// @ts-nocheck
import { error, fail } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { superValidate } from 'sveltekit-superforms/server';
import { zod } from 'sveltekit-superforms/adapters';
import { registrationSchema } from './schema';
import { PUBLIC_RECAPTCHA_SITE_KEY } from '$env/static/public';
import { RECAPTCHA_SECRET_KEY } from '$env/static/private';
import { message } from 'sveltekit-superforms/server';
import { rateLimit } from '$lib/utils/rateLimit';
import { generateQRCode, generateReferenceCode } from '$lib/utils/generators';
import { RoleConfig } from '$lib/auth/roleConfig';

type TicketData = {
    type: string;
    price: number;
    available: number;
    includes: string[];
};

type Event = {
    id: string;
    event_name: string;
    event_long_name: string | null;
    event_url: string | null;
    other_info: Record<string, unknown>;
    ticketing_data: TicketData[];
    is_public: boolean;
    org_id: string;
};

const RATE_LIMIT = {
    window: 60 * 1000,
    max: 10
};

async function verifyCaptcha(token: string) {
    if (!RECAPTCHA_SECRET_KEY) {
        throw error(500, 'reCAPTCHA secret key not configured');
    }

    const response = await fetch('https://www.google.com/recaptcha/api/siteverify', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: `secret=${RECAPTCHA_SECRET_KEY}&response=${token}`,
    });

    const data = await response.json();
    if (!data.success) {
        throw error(400, 'reCAPTCHA verification failed');
    }
}

export const load = async ({ locals: { supabase, safeGetSession, user, profile }, params }: Parameters<PageServerLoad>[0]) => {
    const rateLimitResult = await rateLimit(user?.id || 'anonymous', RATE_LIMIT);
    if (!rateLimitResult.success) {
        throw error(429, 'Too many requests');
    }

    const { session } = await safeGetSession();

    let profileData = null;
    if (user) {
        const { data: profileResult } = await supabase
            .from('profiles')
            .select('role, org_id')
            .eq('id', user.id)
            .single();

        profileData = profileResult;
    }

    const { data: event, error: eventError } = await supabase
        .from('events')
        .select('*, organizations(id)')
        .eq('event_url', params.event_url)
        .single();

    if (eventError || !event) {
        throw error(404, 'Event not found');
    }

    if (!event.is_public) {
        throw error(403, 'Event not public');
    }

    const ticketingData = Array.isArray(event.ticketing_data) ? 
        event.ticketing_data : 
        [];

    const availableTickets = ticketingData.some((ticket: TicketData) => ticket.available > 0);
    if (!availableTickets) {
        throw error(403, 'No tickets available');
    }

    const form = await superValidate(zod(registrationSchema));
    const isAdmin = profile?.role && RoleConfig[profile.role].isAdmin;

    return {
        form,
        event: {
            ...event,
            ticketing_data: ticketingData
        },
        local: {
            recaptcha: !isAdmin ? PUBLIC_RECAPTCHA_SITE_KEY : null
        },
        userRole: profile?.role || null
    };
};

export const actions = {
    default: async ({ request, locals: { supabase,  profile }, params }) => {
        console.log('Starting registration process...');
        try {
            const formData = await request.formData();
            console.log('Form data received:', Object.fromEntries(formData));

            const form = await superValidate(formData, zod(registrationSchema));
            console.log('Form validation result:', { valid: form.valid, errors: form.errors });
            
            if (!form.valid) {
                console.log('Form validation failed:', form.errors);
                return fail(400, { form });
            }

            const isAdmin = profile?.role && RoleConfig[profile.role].isAdmin;
            console.log('User role check:', { isAdmin, profile });

            if (!isAdmin) {
                const captchaToken = formData.get('captchaToken');
                if (!captchaToken || typeof captchaToken !== 'string') {
                    return fail(400, { form, message: 'Security verification missing' });
                }
                await verifyCaptcha(captchaToken);
            }

            console.log('Fetching event:', params.event_url);
            const { data: event } = await supabase
                .from('events')
                .select('*')
                .eq('event_url', params.event_url)
                .single();

            if (!event) {
                throw error(404, 'Event not found');
            }
            console.log('Event found:', { id: event.id, name: event.event_name });

            const ticketingData = Array.isArray(event.ticketing_data) ? 
                event.ticketing_data as TicketData[] : 
                [];
            console.log('Ticket data:', ticketingData);

            const selectedTicket = ticketingData.find(t => t.type === form.data.ticketType);
            console.log('Selected ticket:', selectedTicket);

            if (!selectedTicket) {
                return fail(400, { form, message: 'Ticket not available' });
            }

            // Generate codes with proper await
            console.log('Generating codes...');
            const qrLink = await generateQRCode();
            const referenceCode = await generateReferenceCode();
            
            console.log('Generated codes:', { qrLink, referenceCode });

            // Ensure org_id is available
            const org_id = event.org_id;
            if (!org_id) {
                throw error(500, 'Organization ID not found');
            }

            // Prepare registration data
            const registrationData = {
                p_event_id: event.id,
                p_ticket_type: form.data.ticketType,
                p_basic_info: {
                    firstName: form.data.firstName,
                    lastName: form.data.lastName,
                    email: form.data.email,
                    phone: form.data.phone
                },
                p_ticket_info: {
                    type: form.data.ticketType,
                    price: selectedTicket.price,
                    includes: selectedTicket.includes
                },
                p_org_id: org_id,
                p_qr_link: qrLink,
                p_reference_code: referenceCode
            };

            console.log('Calling register_attendee with data:', registrationData);

            const { data: result, error: registrationError } = await supabase.rpc(
                'register_attendee',
                registrationData
            );

            if (registrationError) {
                console.error('Registration error:', registrationError);
                throw error(500, registrationError.message || 'Registration failed');
            }

            console.log('Registration successful:', result);

            return message(form, {
                type: 'success',
                status: 200,
                text: `Registration successful! Please complete payment within ${result.payment_timeout_minutes} minutes.`,
                data: {
                    name: `${form.data.firstName} ${form.data.lastName}`,
                    email: form.data.email,
                    phone: form.data.phone,
                    ticketType: `${form.data.ticketType} - ₱${selectedTicket.price}`,
                    referenceCode,
                    paymentTimeoutMinutes: result.payment_timeout_minutes,
                    event: {
                        name: event.event_name,
                        longName: event.event_long_name,
                        otherInfo: event.other_info
                    }
                }
            } as const);

        } catch (err) {
            console.error('Registration process error:', err);
            const errorForm = await superValidate(zod(registrationSchema));
            
            let errorMessage = 'Registration failed';
            if (err instanceof Error) {
                console.error('Error details:', {
                    message: err.message,
                    stack: err.stack
                });
                errorMessage = err.message;
            }

            return fail(500, {
                form: errorForm,
                message: errorMessage
            });
        }
    }
};
// +page.server.ts
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

// Rate limit configuration
const RATE_LIMIT = {
    window: 60 * 1000, // 1 minute
    max: 10 // maximum 10 requests per minute
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
        console.error('reCAPTCHA verification failed:', data['error-codes']);
        throw error(400, 'reCAPTCHA verification failed');
    }
}

export const load: PageServerLoad = async ({ locals: { supabase, safeGetSession, user, profile }, params }) => {
    // Apply rate limiting
    const rateLimitResult = await rateLimit(user?.id || 'anonymous', RATE_LIMIT);
    if (!rateLimitResult.success) {
        throw error(429, 'Too many requests. Please try again later.');
    }

    // Verify admin role with additional checks
    if (profile?.role && ['super_admin', 'org_admin'].includes(profile.role)) {
        // Additional verification for admin users
        const { data: roleVerification, error: verificationError } = await supabase
            .from('profiles')
            .select('role, last_role_verification')
            .eq('id', user?.id)
            .single();

        if (verificationError || !roleVerification) {
            throw error(403, 'Role verification failed');
        }

        // Force re-verification if last verification is older than 1 hour
        const ONE_HOUR = 60 * 60 * 1000;
        if (!roleVerification.last_role_verification || 
            new Date().getTime() - new Date(roleVerification.last_role_verification).getTime() > ONE_HOUR) {
            throw error(403, 'Role verification expired. Please re-login.');
        }
    }

    // Get authenticated session data using the safe method
    const { session } = await safeGetSession();

    let profileData = null;
    if (user) {
        const { data: profileDataResult, error: profileError } = await supabase
            .from('profiles')
            .select('role, org_id')
            .eq('id', user.id)
            .single();

        if (!profileError) {
            profileData = profileDataResult;
        }
    }

    console.log('Profile from database:', profileData);

    const { data: event, error: eventError } = await supabase
        .from('public_events')
        .select('*, organizations(id)')
        .eq('event_url', params.event_url)
        .single();

    if (eventError || !event) {
        throw error(404, 'Event not found');
    }

    if (!event.is_public) {
        throw error(403, 'Event registration is not public');
    }

    // Parse ticketing data
    const ticketingData = event.ticketing_data ? 
        (typeof event.ticketing_data === 'string' ? 
            JSON.parse(event.ticketing_data.replace(/\\/g, '')) : 
            event.ticketing_data
        ) : [];

    // Check if tickets are available
    const availableTickets = ticketingData.some((ticket: any) => ticket.available > 0);

    if (!availableTickets) {
        throw error(403, 'No tickets available for this event');
    }

    const form = await superValidate(zod(registrationSchema));

    // Only include reCAPTCHA for non-admin users
    const isAdmin = profile?.role && ['super_admin', 'event_admin', 'org_admin'].includes(profile.role);
    console.log('Is admin?', isAdmin);
    console.log('Admin check details:', {
        profileExists: !!profile,
        role: profile?.role,
        isRoleValid: profile?.role ? ['super_admin', 'event_admin', 'org_admin'].includes(profile.role) : false
    });

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
    default: async ({ request, locals: { supabase, safeGetSession, user, profile }, params }) => {
        console.log('Starting server-side registration processing');
        try {
            const formData = await request.formData();
            const form = await superValidate(formData, zod(registrationSchema));
            console.log('Form data received:', form.data);

            // Get session and profile first
            const { session } = await safeGetSession();
            let profileData = null;
            if (user) {
                const { data: profileDataResult, error: profileError } = await supabase
                    .from('profiles')
                    .select('role, org_id')
                    .eq('id', user.id)
                    .single();

                if (!profileError) {
                    profileData = profileDataResult;
                }
            }

            const isAdmin = profile?.role && ['super_admin', 'event_admin', 'org_admin'].includes(profile.role);
            console.log('Admin status:', { isAdmin, role: profile?.role });

            if (!form.valid) {
                console.log('Form validation failed:', form.errors);
                return fail(400, { form });
            }

            // Only verify captcha for non-admin users
            if (!isAdmin) {
                const captchaToken = formData.get('captchaToken');
                if (!captchaToken || typeof captchaToken !== 'string') {
                    console.log('Missing captcha token for non-admin user');
                    return fail(400, {
                        form,
                        message: 'Security verification missing. Please refresh the page and try again.'
                    });
                }

                await verifyCaptcha(captchaToken);
                console.log('reCAPTCHA verification successful');
            } else {
                console.log('Skipping reCAPTCHA verification for admin user');
            }

            // Fetch event data
            console.log('Fetching event data for URL:', params.event_url);
            const { data: event, error: eventError } = await supabase
                .from('public_events')
                .select('*, organizations:org_id(*)')
                .eq('event_url', params.event_url)
                .single();

            if (eventError || !event) {
                console.error('Event fetch error:', eventError);
                return fail(404, {
                    form,
                    message: 'Event not found'
                });
            }

            // Parse ticketing data
            console.log('Parsing ticketing data');
            const ticketingData = event.ticketing_data ? 
                (typeof event.ticketing_data === 'string' ? 
                    JSON.parse(event.ticketing_data.replace(/\\/g, '')) : 
                    event.ticketing_data
                ) : [];

            const selectedTicket = ticketingData.find(
                (ticket: any) => ticket.type === form.data.ticketType
            );

            if (!selectedTicket || selectedTicket.available <= 0) {
                console.log('Selected ticket not available:', form.data.ticketType);
                return fail(400, {
                    form,
                    message: 'Selected ticket type is no longer available'
                });
            }

            // Check for existing registration
            const { data: existingAttendee } = await supabase
                .from('attendees')
                .select('id')
                .eq('event_id', event.id)
                .eq('basic_info->email', form.data.email)
                .single();

            if (existingAttendee) {
                console.log('Existing registration found for email:', form.data.email);
                return fail(400, {
                    form,
                    message: 'You have already registered for this event with this email address'
                });
            }

            // Generate codes
            const [qrLink, referenceCode] = await Promise.all([
                generateQRCode(),
                generateReferenceCode()
            ]);

            console.log('Inserting attendee with org_id:', event.org_id);
            
            // Insert attendee
            const { error: insertError } = await supabase
                .from('attendees')
                .insert({
                    basic_info: {
                        firstName: form.data.firstName,
                        lastName: form.data.lastName,
                        email: form.data.email,
                        phone: form.data.phone
                    },
                    event_id: event.id,
                    ticket_info: {
                        type: form.data.ticketType,
                        price: selectedTicket.price,
                        includes: selectedTicket.includes
                    },
                    org_id: event.org_id,
                    qr_link: qrLink,
                    reference_code_url: referenceCode,
                    attendance_status: 'paymentPending'
                });

            if (insertError) {
                console.error('Attendee insert error:', insertError);
                return fail(500, {
                    form,
                    message: 'Failed to register. Please try again.'
                });
            }

            // Update ticket availability
            const updatedTicketingData = ticketingData.map((ticket: any) => {
                if (ticket.type === form.data.ticketType) {
                    return { ...ticket, available: ticket.available - 1 };
                }
                return ticket;
            });

            const { error: updateError } = await supabase
                .from('events')
                .update({ ticketing_data: updatedTicketingData })
                .eq('id', event.id);

            if (updateError) {
                console.error('Failed to update ticket availability:', updateError);
            }

            const responseData = {
                name: `${form.data.firstName} ${form.data.lastName}`,
                email: form.data.email,
                phone: form.data.phone,
                ticketType: `${form.data.ticketType} - ₱${selectedTicket.price}`,
                referenceCode,
                event: {
                    name: event.event_name,
                    longName: event.event_long_name,
                    otherInfo: event.other_info
                }
            };

            console.log('Registration successful for:', form.data.email);
            return message(form, {
                type: 'success',
                status: 200,
                text: 'Registration successful!',
                data: responseData
            } as const);
        } catch (error) {
            console.error('Registration processing error:', error);
            const errorForm = await superValidate(zod(registrationSchema));
            return fail(500, {
                form: errorForm,
                message: error instanceof Error ? error.message : 'An unexpected error occurred'
            });
        }
    }
};
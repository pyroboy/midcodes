<script lang="ts">
    import type { PageData } from './$types';
    import type { SuperForm, SuperValidated } from 'sveltekit-superforms';
    import { superForm } from 'sveltekit-superforms/client';
    import type { RegistrationSchema, RegistrationResponse } from './schema';
    import type { EventTicketType } from '$lib/types/database';
    import { Button } from '$lib/components/ui/button';
    import { Input } from '$lib/components/ui/input';
    import { Label } from '$lib/components/ui/label';
    import * as RadioGroup from '$lib/components/ui/radio-group';
    import { cn } from '$lib/utils';
    import { page } from '$app/stores';
    import { onMount } from 'svelte';
    import { goto } from '$app/navigation';
    import { Toaster } from 'svelte-french-toast';
    import { toast } from 'svelte-french-toast';
    import type { ActionResult } from '@sveltejs/kit';
    import SimplerSuccessMessage from './SimplerSuccessMessage.svelte';

    export let data: PageData;

    let retoken = '';
    let recaptchaError = '';
    const RecaptchaUrl = 'https://www.google.com/recaptcha/api.js';
    const isAdmin = data.profile?.role && ['super_admin', 'event_admin', 'org_admin'].includes(data.profile.role);
    
    console.log('Client-side admin check:', {
        profileRole: data.profile?.role,
        isAdmin,
        recaptchaKey: data.local.recaptcha
    });

    // Improved state management with proper typing
    let showConfirmation = false;
    let registrationData: RegistrationResponse | null = null;

    let timer = 2;
    let showLink = false;
    let redirecting = false;
    let isSubmitting = false;

    function startTimers() {
        setTimeout(() => {
            redirecting = true;
            if (registrationData?.referenceCode) {
                const redirectUrl = `/${$page.params.event_url}/${registrationData.referenceCode}`;
                goto(redirectUrl);
            }
        }, 4000);
    }

    const { form, errors, enhance, message } = superForm<RegistrationSchema>(data.form, {
        taintedMessage: null,
        onSubmit: ({ formData, cancel }) => {
            if (!isAdmin && !retoken) {
                toast.error('Please complete the reCAPTCHA verification');
                cancel();
                return;
            }

            if (!isAdmin) {
                formData.append('captchaToken', retoken);
            }
            isSubmitting = true;

            return async ({ result, update }: any) => {
                update({ reset: true }); // Reset the form on success
                
                if (result.type === 'success') {
                    registrationData = result.data?.data as RegistrationResponse;
                    showConfirmation = true;
                    startTimers();
                }
                isSubmitting = false;
            };
        },
        onResult: ({ result }: { result: ActionResult }) => {
            if (result.type === 'success' ) {
                console.log('Registration successful:', result.data?.form.message.data);
                showConfirmation = true;
                registrationData = result.data?.form.message.data;
                startTimers();
            }
        }
    });

    const formFieldErrorClass = (error: unknown): string => {
        if (!error) return '';
        
        if (Array.isArray(error)) {
            return error.length > 0 ? 'border-destructive focus-visible:ring-destructive' : '';
        }
        
        if (typeof error === 'string') {
            return 'border-destructive focus-visible:ring-destructive';
        }

        return '';
    };

    let phoneValue = '';
    let isValidPhone = false;

    function validatePhoneNumber(value: string) {
        const phoneRegex = /((^(\+)(\d){12}$)|(^\d{11}$))/;
        isValidPhone = phoneRegex.test(value);
        return isValidPhone;
    }

    function handlePhoneInput(event: Event) {
        const input = event.target as HTMLInputElement;
        phoneValue = input.value;
        validatePhoneNumber(phoneValue);
        $form.phone = phoneValue;
    }

    interface DisplayTicket extends EventTicketType {
        available: number;
    }

    let ticketTypes: DisplayTicket[] = [];
    
    $: {
        ticketTypes = Array.isArray(data.event.ticketing_data) 
            ? data.event.ticketing_data.map((ticket: EventTicketType) => ({
                type: ticket.type,
                price: ticket.price,
                includes: ticket.includes,
                available: ticket.available
            }))
            : [];
    }

    let availableTickets: boolean;
    $: availableTickets = ticketTypes.some(ticket => ticket.available > 0);

    // Add reCAPTCHA callback
    function onRecaptchaLoad() {
        console.log('reCAPTCHA loaded');
        if (typeof window.grecaptcha !== 'undefined') {
            window.grecaptcha.ready(() => {
                console.log('reCAPTCHA is ready');
            });
        }
    }

    // Define callbacks
    function handleRecaptchaSuccess(token: string) {
        console.log('reCAPTCHA success');
        retoken = token;
    }

    function handleRecaptchaError() {
        console.error('reCAPTCHA error');
        recaptchaError = 'Failed to load reCAPTCHA. Please refresh the page and try again.';
        retoken = '';
    }

    function handleRecaptchaExpired() {
        console.log('reCAPTCHA expired');
        retoken = '';
    }

    onMount(() => {
        if (!isAdmin) {
            const sitekey = data.local.recaptcha;
            if (!sitekey) {
                recaptchaError = 'reCAPTCHA site key not configured. Please check your environment variables.';
                return;
            }

            // Add reCAPTCHA script
            const script = document.createElement('script');
            script.src = RecaptchaUrl;
            script.async = true;
            script.defer = true;
            document.head.appendChild(script);

            script.onload = onRecaptchaLoad;

            // Assign callbacks to window
            window.onRecaptchaSuccess = handleRecaptchaSuccess;
            window.onRecaptchaError = handleRecaptchaError;
            window.onRecaptchaExpired = handleRecaptchaExpired;
        }
    });
</script>

<svelte:head>
    <title>Register for {data.event.event_name}</title>
    <meta name="description" content="Registration page for {data.event.event_name}" />
</svelte:head>

<Toaster/>

<div class="relative min-h-screen bg-background">
    <!-- Success Message Overlay -->
    {#if showConfirmation && registrationData}
        <SimplerSuccessMessage />
    {/if}

    <div class="container mx-auto px-4 py-8 {showConfirmation ? 'pointer-events-none blur-sm' : ''}">
        <div class="max-w-2xl mx-auto bg-card rounded-lg shadow-lg p-6 dark:border dark:border-border">
            {#if showConfirmation && registrationData}
                <div class="fixed inset-0 z-50 flex items-center justify-center">
                </div>
            {:else}
                <div class="mb-8">
                    <h1 class="text-3xl font-bold mb-2 text-foreground">{data.event.event_name}</h1>
                    {#if data.event.event_long_name}
                        <p class="text-lg text-muted-foreground">{data.event.event_long_name}</p>
                    {/if}
                </div>

                <form
                    method="POST"
                    use:enhance
                    class="space-y-6"
                >
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div class="space-y-2">
                            <Label for="firstName" class="text-foreground">First Name</Label>
                            <Input
                                type="text"
                                id="firstName"
                                name="firstName"
                                bind:value={$form.firstName}
                                class={cn(
                                    "w-full",
                                    $errors.firstName && "border-destructive"
                                )}
                            />
                            {#if $errors.firstName}
                                <p class="text-sm text-destructive">{$errors.firstName}</p>
                            {/if}
                        </div>

                        <div class="space-y-2">
                            <Label for="lastName" class="text-foreground">Last Name</Label>
                            <Input
                                type="text"
                                id="lastName"
                                name="lastName"
                                bind:value={$form.lastName}
                                class={cn(
                                    "w-full",
                                    $errors.lastName && "border-destructive"
                                )}
                            />
                            {#if $errors.lastName}
                                <p class="text-sm text-destructive">{$errors.lastName}</p>
                            {/if}
                        </div>

                        <div class="space-y-2">
                            <Label for="email" class="text-foreground">Email</Label>
                            <Input
                                type="email"
                                id="email"
                                name="email"
                                bind:value={$form.email}
                                class={cn(
                                    "w-full",
                                    $errors.email && "border-destructive"
                                )}
                            />
                            {#if $errors.email}
                                <p class="text-sm text-destructive">{$errors.email}</p>
                            {/if}
                        </div>

                        <div class="space-y-2">
                            <Label for="phone" class="text-foreground">Phone</Label>
                            <Input
                                type="tel"
                                id="phone"
                                name="phone"
                                bind:value={$form.phone}
                                class={cn(
                                    "w-full",
                                    $errors.phone && "border-destructive"
                                )}
                            />
                            {#if $errors.phone}
                                <p class="text-sm text-destructive">{$errors.phone}</p>
                            {/if}
                        </div>
                    </div>

                    {#if availableTickets}
                        <div class="space-y-4">
                            <div class="text-lg font-medium text-foreground mb-2">Select Ticket Type</div>
                            <div class="grid gap-4">
                                {#each ticketTypes as ticket (ticket.type)}
                                    {#if ticket.available > 0}
                                        <label
                                            class="relative flex flex-col p-4 cursor-pointer rounded-lg border transition-colors
                                                {$form.ticketType === ticket.type ? 
                                                    'bg-primary text-primary-foreground border-primary' : 
                                                    'hover:bg-muted/50 border-border'}"
                                        >
                                            <input
                                                type="radio"
                                                name="ticketType"
                                                value={ticket.type}
                                                bind:group={$form.ticketType}
                                                class="sr-only"
                                            />
                                            <div class="flex justify-between items-start gap-2">
                                                <div>
                                                    <div class="font-medium">{ticket.type}</div>
                                                    {#if ticket.includes?.length}
                                                        <ul class="mt-1 text-sm text-muted-foreground list-disc list-inside space-y-1">
                                                            {#each ticket.includes as item}
                                                                <li>{item}</li>
                                                            {/each}
                                                        </ul>
                                                    {/if}
                                                </div>
                                                <div class="text-right">
                                                    <div class="font-medium">₱{ticket.price}</div>
                                                    <span class="text-sm text-muted-foreground">{ticket.available} left</span>
                                                </div>
                                            </div>
                                        </label>
                                    {/if}
                                {/each}
                            </div>
                            {#if $errors.ticketType}
                                <p class="text-sm text-destructive mt-2">{$errors.ticketType}</p>
                            {/if}
                        </div>
                    {:else}
                        <div class="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
                            <p class="text-destructive font-medium">
                                No tickets available for this event.
                            </p>
                        </div>
                    {/if}

                    {#if !isAdmin && data.local.recaptcha}
                        <div class="mt-4">
                            <div 
                                class="g-recaptcha dark:invert-[.95]" 
                                data-sitekey={data.local.recaptcha}
                                data-callback="onRecaptchaSuccess"
                                data-error-callback="onRecaptchaError"
                                data-expired-callback="onRecaptchaExpired"
                            ></div>
                            {#if recaptchaError}
                                <p class="text-sm text-destructive mt-1">{recaptchaError}</p>
                            {/if}
                        </div>
                    {/if}

                    <div class="pt-4">
                        <Button
                            type="submit"
                            class="w-full"
                            disabled={isSubmitting || !availableTickets || (!isAdmin && !retoken)}
                            variant="default"
                        >
                            {#if isSubmitting}
                                Registering...
                            {:else}
                                Register
                            {/if}
                        </Button>
                    </div>
                </form>
            {/if}
        </div>
    </div>
</div>
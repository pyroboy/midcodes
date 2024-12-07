<script lang="ts">
    import { registrationSchema, type RegistrationSchema, type RegistrationResponse } from './schema';
    import type { PageData } from './$types';
    import { superForm } from 'sveltekit-superforms/client';
    import { zod } from 'sveltekit-superforms/adapters';
    import type { EventTicketType } from '$lib/types/database';
    import { Button } from '$lib/components/ui/button';
    import { Input } from '$lib/components/ui/input';
    import { Label } from '$lib/components/ui/label';
    import { cn } from '$lib/utils';
    import { page } from '$app/stores';
    import { onMount } from 'svelte';
    import { goto } from '$app/navigation';
    import { Toaster } from 'svelte-french-toast';
    import { toast } from 'svelte-french-toast';
    import SimplerSuccessMessage from './SimplerSuccessMessage.svelte';
  
    
    export let data: PageData;
    
    let retoken = '';
    let recaptchaError = '';
    const RecaptchaUrl = 'https://www.google.com/recaptcha/api.js';
    const isAdmin = data.profile?.role && ['super_admin', 'event_admin', 'org_admin'].includes(data.profile.role);
    
    let showConfirmation = false;
    let registrationData: RegistrationResponse | null = null;
    let isSubmitting = false;
    
    function startRedirect(referenceCode: string) {
        toast.success('Registration successful!');
        showConfirmation = true;
        
        setTimeout(() => {
            goto(`/${$page.params.event_url}/${referenceCode}`);
        }, 2000);
    }
    
    const { form, errors, enhance } = superForm<RegistrationSchema>(data.form, {
    validators: zod(registrationSchema),
    taintedMessage: null,
    onSubmit: async ({ formData, cancel }) => {
        console.log('Form submission started');
        isSubmitting = true;

        if (!isAdmin && !retoken) {
            console.log('Missing reCAPTCHA token for non-admin user');
            toast.error('Please complete the reCAPTCHA verification');
            isSubmitting = false;
            cancel();
            return false;
        }

        if (!isAdmin) {
            console.log('Adding captcha token to form data');
            formData.append('captchaToken', retoken);
        }
    },
    onResult: ({ result }) => {
        console.log('Form submission result:', result);
        isSubmitting = false;

        if (result.type === 'success' && result.data?.form?.message?.data) {
            console.log('Success data:', result.data);
            const responseData = result.data.form.message.data as RegistrationResponse;
            registrationData = responseData;
            
            if (responseData && responseData.referenceCode) {
                console.log('Starting redirect with reference code:', responseData.referenceCode);
                toast.success('Registration successful!');
                showConfirmation = true;
                setTimeout(() => {
                    goto(`/events/${$page.params.event_url}/${responseData.referenceCode}`);
                }, 2000);
            } else {
                console.error('Missing reference code in response');
                toast.error('Missing reference code in response');
            }
        } else if (result.type === 'error') {
            console.error('Form submission error:', result.error);
            toast.error(result.error?.message || 'Registration failed');

            if (result.error?.message.includes('reCAPTCHA')) {
                console.log('reCAPTCHA error detected, resetting token');
                retoken = '';
                if (window.grecaptcha) {
                    window.grecaptcha.reset();
                }
            }
        }
    }
});
    
    interface DisplayTicket extends EventTicketType {
        available: number;
    }
    
    let ticketTypes: DisplayTicket[] = [];
    $: {
        ticketTypes = Array.isArray(data.event.ticketing_data) 
            ? data.event.ticketing_data
                .filter((ticket: EventTicketType): ticket is DisplayTicket => 
                    typeof ticket.available === 'number' && ticket.available > 0)
            : [];
    }
    
    $: availableTickets = ticketTypes.length > 0;
    
    onMount(() => {
        if (!isAdmin && data.local.recaptcha) {
            const script = document.createElement('script');
            script.src = RecaptchaUrl;
            script.async = true;
            script.defer = true;
            document.head.appendChild(script);
    
            window.onRecaptchaSuccess = (token: string) => {
                console.log('reCAPTCHA success, token received');
                retoken = token;
                recaptchaError = '';
            };
            window.onRecaptchaError = () => {
                console.error('reCAPTCHA error');
                recaptchaError = 'reCAPTCHA verification failed';
                retoken = '';
            };
            window.onRecaptchaExpired = () => {
                console.log('reCAPTCHA expired');
                retoken = '';
                recaptchaError = 'reCAPTCHA verification expired, please try again';
            };
        }
    });
    </script>
    
    <svelte:head>
        <title>Register for {data.event.event_name}</title>
        <meta name="description" content="Registration page for {data.event.event_name}" />
    </svelte:head>
    
    <Toaster/>
    
    <div class="relative min-h-screen bg-background">
        {#if showConfirmation && registrationData}
        <SimplerSuccessMessage data={registrationData} />
    {/if}
    
        <div class="container mx-auto px-4 py-8 {showConfirmation ? 'pointer-events-none blur-sm' : ''}">
            <div class="max-w-2xl mx-auto bg-card rounded-lg shadow-lg p-6 dark:border dark:border-border">
                <div class="mb-8">
                    <h1 class="text-3xl font-bold mb-2 text-foreground">{data.event.event_name}</h1>
                    {#if data.event.event_long_name}
                        <p class="text-lg text-muted-foreground">{data.event.event_long_name}</p>
                    {/if}
                </div>
    
                <form method="POST" use:enhance class="space-y-6">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div class="space-y-2">
                            <Label for="firstName">First Name</Label>
                            <Input
                                id="firstName"
                                name="firstName"
                                bind:value={$form.firstName}
                                class={cn("w-full", $errors.firstName && "border-destructive")}
                            />
                            {#if $errors.firstName}
                                <p class="text-sm text-destructive">{$errors.firstName}</p>
                            {/if}
                        </div>
    
                        <div class="space-y-2">
                            <Label for="lastName">Last Name</Label>
                            <Input
                                id="lastName"
                                name="lastName"
                                bind:value={$form.lastName}
                                class={cn("w-full", $errors.lastName && "border-destructive")}
                            />
                            {#if $errors.lastName}
                                <p class="text-sm text-destructive">{$errors.lastName}</p>
                            {/if}
                        </div>
    
                        <div class="space-y-2">
                            <Label for="email">Email</Label>
                            <Input
                                type="email"
                                id="email"
                                name="email"
                                bind:value={$form.email}
                                class={cn("w-full", $errors.email && "border-destructive")}
                            />
                            {#if $errors.email}
                                <p class="text-sm text-destructive">{$errors.email}</p>
                            {/if}
                        </div>
    
                        <div class="space-y-2">
                            <Label for="phone">Phone</Label>
                            <Input
                                type="tel"
                                id="phone"
                                name="phone"
                                bind:value={$form.phone}
                                class={cn("w-full", $errors.phone && "border-destructive")}
                            />
                            {#if $errors.phone}
                                <p class="text-sm text-destructive">{$errors.phone}</p>
                            {/if}
                        </div>
                    </div>
    
                    {#if availableTickets}
                        <div class="space-y-4">
                            <Label class="text-lg">Select Ticket Type</Label>
                            <div class="grid gap-4">
                                {#each ticketTypes as ticket}
                                    <label class={cn(
                                        "relative flex flex-col p-4 cursor-pointer rounded-lg border transition-colors",
                                        $form.ticketType === ticket.type ? "bg-primary text-primary-foreground border-primary" : "hover:bg-muted/50 border-border"
                                    )}>
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
                                                    <ul class="mt-1 text-sm list-disc list-inside space-y-1">
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
                                {/each}
                            </div>
                            {#if $errors.ticketType}
                                <p class="text-sm text-destructive">{$errors.ticketType}</p>
                            {/if}
                        </div>
                    {:else}
                        <div class="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
                            <p class="text-destructive font-medium">No tickets available for this event.</p>
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
                            />
                            {#if recaptchaError}
                                <p class="text-sm text-destructive mt-1">{recaptchaError}</p>
                            {/if}
                        </div>
                    {/if}
    
                    <Button
                        type="submit"
                        class="w-full"
                        disabled={isSubmitting || !availableTickets || (!isAdmin && !retoken)}
                    >
                        {isSubmitting ? 'Registering...' : 'Register'}
                    </Button>
                </form>
            </div>
        </div>
    </div>
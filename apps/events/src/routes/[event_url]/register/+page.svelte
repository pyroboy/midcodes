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
    
    interface Props {
        data: PageData;
    }

    let { data }: Props = $props();
    
    const { form, errors, enhance, message } = superForm<RegistrationSchema>(data.form, {
        validators: registrationSchema,
        onResult: ({ result }) => {
            if (result.type === 'success') {
                const response = result.data as RegistrationResponse;
                registrationSuccess = true;
                successData = response;
            }
            return result;
        },
    });

    let registrationSuccess = false;
    let successData: RegistrationResponse | null = null;
    let recaptchaError: string | null = null;
    
    interface DisplayTicket extends EventTicketType {
        available: number;
    }
    
    $: displayTickets = data.ticketTypes.map(ticket => ({
        ...ticket,
        available: ticket.quantity - ticket.sold
    }));

    $: selectedTicket = displayTickets.find(t => t.id === $form.ticketType);
</script>

<svelte:head>
    <title>Register - {data.event.event_name}</title>
</svelte:head>

<Toaster />

<div class="container mx-auto px-4 py-8">
    <div class="max-w-2xl mx-auto">
        {#if registrationSuccess && successData}
            <SimplerSuccessMessage 
                referenceCode={successData.referenceCode}
                eventName={data.event.event_name}
            />
        {:else}
            <div class="mb-8">
                <h1 class="text-3xl font-bold mb-2">Register for Event</h1>
                <p class="text-gray-600">{data.event.event_name}</p>
            </div>

            <form method="POST" use:enhance class="space-y-6">
                <!-- Ticket Type Selection -->
                <div class="space-y-2">
                    <Label for="ticketType">Ticket Type</Label>
                    <div class="grid gap-4">
                        {#each displayTickets as ticket}
                            {@const isAvailable = ticket.available > 0}
                            <label 
                                class={cn(
                                    "relative flex cursor-pointer rounded-lg border p-4 shadow-sm focus:outline-none",
                                    $form.ticketType === ticket.id && "border-primary",
                                    !isAvailable && "opacity-50 cursor-not-allowed"
                                )}
                            >
                                <input
                                    type="radio"
                                    name="ticketType"
                                    value={ticket.id}
                                    bind:group={$form.ticketType}
                                    disabled={!isAvailable}
                                    class="sr-only"
                                />
                                <div class="flex w-full items-center justify-between">
                                    <div class="flex items-center">
                                        <div class="text-sm">
                                            <p class="font-medium text-gray-900">
                                                {ticket.name}
                                            </p>
                                            {#if ticket.description}
                                                <p class="text-gray-500">
                                                    {ticket.description}
                                                </p>
                                            {/if}
                                        </div>
                                    </div>
                                    <div class="text-sm font-medium text-gray-900">
                                        ₱{ticket.price.toLocaleString()}
                                    </div>
                                </div>
                            </label>
                        {/each}
                    </div>
                    {#if $errors.ticketType}
                        <p class="text-sm text-destructive">{$errors.ticketType}</p>
                    {/if}
                </div>

                <!-- Personal Information -->
                <div class="space-y-4">
                    <div class="grid gap-4 sm:grid-cols-2">
                        <div>
                            <Label for="firstName">First Name</Label>
                            <Input 
                                type="text" 
                                id="firstName" 
                                name="firstName"
                                bind:value={$form.firstName}
                                class={$errors.firstName ? "border-destructive" : ""}
                            />
                            {#if $errors.firstName}
                                <p class="text-sm text-destructive mt-1">{$errors.firstName}</p>
                            {/if}
                        </div>
                        <div>
                            <Label for="lastName">Last Name</Label>
                            <Input 
                                type="text" 
                                id="lastName" 
                                name="lastName"
                                bind:value={$form.lastName}
                                class={$errors.lastName ? "border-destructive" : ""}
                            />
                            {#if $errors.lastName}
                                <p class="text-sm text-destructive mt-1">{$errors.lastName}</p>
                            {/if}
                        </div>
                    </div>

                    <div>
                        <Label for="email">Email</Label>
                        <Input 
                            type="email" 
                            id="email" 
                            name="email"
                            bind:value={$form.email}
                            class={$errors.email ? "border-destructive" : ""}
                        />
                        {#if $errors.email}
                            <p class="text-sm text-destructive mt-1">{$errors.email}</p>
                        {/if}
                    </div>

                    <div>
                        <Label for="phone">Phone Number</Label>
                        <Input 
                            type="tel" 
                            id="phone" 
                            name="phone"
                            bind:value={$form.phone}
                            class={$errors.phone ? "border-destructive" : ""}
                            placeholder="+639191234567 or 09191234567"
                        />
                        {#if $errors.phone}
                            <p class="text-sm text-destructive mt-1">{$errors.phone}</p>
                        {/if}
                    </div>
                </div>

                {#if data.event.other_info?.additional_fields}
                    <div class="space-y-4">
                        <h3 class="font-medium">Additional Information</h3>
                        {#each Object.entries(data.event.other_info.additional_fields) as [field, config]}
                            {@const fieldId = `additional_${field}`}
                            <div>
                                <Label for={fieldId}>{config.label}</Label>
                                <Input 
                                    type="text" 
                                    id={fieldId} 
                                    name={fieldId}
                                    bind:value={$form.additionalInfo[field]}
                                    required={config.required}
                                />
                            </div>
                        {/each}
                    </div>
                {/if}

                <Button type="submit" class="w-full">
                    Register Now
                </Button>
            </form>
        {/if}
    </div>
</div>

<style>
    /* Add any custom styles here */
</style>

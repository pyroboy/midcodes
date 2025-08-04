<script lang="ts">
  import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '$lib/components/ui/dialog';
  import { Button } from '$lib/components/ui/button';
  import { Input } from '$lib/components/ui/input';
  import { Label } from '$lib/components/ui/label';
  import * as Select from '$lib/components/ui/select';
  import { Badge } from '$lib/components/ui/badge';
  import { Card, CardContent } from '$lib/components/ui/card';
  import { toast } from 'svelte-sonner';
  import { Pencil, Plus, AlertCircle, User, Phone, Mail, MapPin } from 'lucide-svelte';
  import { superForm } from 'sveltekit-superforms/client';
  import { zodClient } from 'sveltekit-superforms/adapters';
  import { invalidateAll } from '$app/navigation';
  import { tenantFormSchema, TenantStatusEnum, defaultEmergencyContact } from './formSchema';
  import type { z } from 'zod';
  import Textarea from '$lib/components/ui/textarea/textarea.svelte';

  type FormType = z.infer<typeof tenantFormSchema>;

  let { 
    tenant = null, 
    open, 
    onOpenChange, 
    editMode = false,
    form: initialForm
  } = $props<{
    tenant?: any;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    editMode: boolean;
    form: any;
  }>();

  // Debug logging
  $effect(() => {
    // Modal props changed - no longer needed for debugging
  });

  // Initialize Superforms
  const { 
    form, 
    errors, 
    enhance, 
    constraints, 
    submitting, 
    reset 
  } = superForm(initialForm, {
    validators: zodClient(tenantFormSchema),
    validationMethod: 'onsubmit',
    resetForm: true,
    onSubmit: () => {
      console.log('🔄 Form submission started');
      console.log('📤 Form data being sent:', $form);
    },
    onResult: async ({ result }) => {
      if (result.type === 'success') {
        await invalidateAll();
        reset();
        toast.success(editMode ? 'Tenant updated successfully' : 'Tenant created successfully');
        onOpenChange(false);
      } else if (result.type === 'failure') {
        // Check for duplicate email error specifically
        if (result.data?.form?.errors?.email || result.data?.message?.includes('Duplicate email found')) {
          toast.error('Duplicate email found: A tenant with this email already exists');
        } else {
          toast.error(editMode ? 'Failed to update tenant' : 'Failed to create tenant');
        }
      }
    },
    onError: ({ result }) => {
      toast.error(result.error?.message || 'An error occurred');
    }
  });

  // Ensure emergency_contact is always initialized
  $effect(() => {
    if ($form && !$form.emergency_contact) {
      $form.emergency_contact = { ...defaultEmergencyContact };
    }
  });

  // Convert ZodEnum to array of status options
  let tenantStatusOptions = $derived(Object.values(TenantStatusEnum.Values));

  function getStatusColor(status: string) {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-100 text-green-800';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'INACTIVE':
        return 'bg-gray-100 text-gray-800';
      case 'BLACKLISTED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  // Reset form when modal opens/closes or tenant changes
  $effect(() => {
    if (open) {
      if (editMode && tenant) {
        // Edit mode - populate with existing tenant data
        $form = {
          id: tenant.id,
          name: tenant.name || '',
          email: tenant.email || '', // Ensure email is empty string if null
          contact_number: tenant.contact_number || '',
          tenant_status: tenant.tenant_status || 'PENDING',
          emergency_contact: tenant.emergency_contact ? {
            name: tenant.emergency_contact.name || '',
            relationship: tenant.emergency_contact.relationship || '',
            phone: tenant.emergency_contact.phone || '',
            email: tenant.emergency_contact.email || null,
            address: tenant.emergency_contact.address || ''
          } : { ...defaultEmergencyContact },
          // Add other fields as needed
          auth_id: tenant.auth_id || null,
          created_by: tenant.created_by || null,
          lease_status: tenant.lease?.status || '',
          lease_type: tenant.lease?.type || '',
          lease_id: tenant.lease?.id || null,
          location_id: tenant.lease?.location?.id || null,
          start_date: tenant.lease?.start_date || '',
          end_date: tenant.lease?.end_date || '',
          rent_amount: tenant.lease?.rent_amount || 0,
          security_deposit: tenant.lease?.security_deposit || 0,
          outstanding_balance: tenant.lease?.balance || 0,
          notes: tenant.lease?.notes || '',
          last_payment_date: null,
          next_payment_due: null,
          payment_schedules: [],
          status_history: [],
          status_change_reason: null
        };
      } else {
        // Create mode - reset to defaults with proper emergency_contact initialization
        $form = {
          id: undefined,
          name: '',
          email: '', // Ensure email is empty string, not null
          contact_number: '',
          tenant_status: 'PENDING',
          emergency_contact: { ...defaultEmergencyContact },
          auth_id: null,
          created_by: null,
          lease_status: '',
          lease_type: '',
          lease_id: null,
          location_id: null,
          start_date: '',
          end_date: '',
          rent_amount: 0,
          security_deposit: 0,
          outstanding_balance: 0,
          notes: '',
          last_payment_date: null,
          next_payment_due: null,
          payment_schedules: [],
          status_history: [],
          status_change_reason: null
        };
      }
    }
  });
</script>

<Dialog open={open} onOpenChange={onOpenChange}>
  <DialogContent class="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
    <DialogHeader>
      <div class="flex items-center gap-2">
        {#if editMode}
          <Pencil class="w-5 h-5 text-primary" />
        {:else}
          <Plus class="w-5 h-5 text-primary" />
        {/if}
        <DialogTitle>{editMode ? 'Edit' : 'Create'} Tenant</DialogTitle>
      </div>
      <DialogDescription>
        {editMode ? 'Update the tenant information and contact details.' : 'Create a new tenant and add their contact information.'} Click save when you're done.
      </DialogDescription>
    </DialogHeader>
    
    <form 
      method="POST" 
      action={editMode ? "?/update" : "?/create"}
      use:enhance
      class="space-y-6"
    >
      <!-- Hidden input for tenant ID in edit mode -->
      {#if editMode && $form.id}
        <input type="hidden" name="id" value={$form.id} />
      {/if}
      
      <!-- Basic Information -->
      <div class="space-y-4">
        <div class="flex items-center gap-2 pb-2 border-b border-slate-200">
          <User class="w-4 h-4 text-slate-500" />
          <h3 class="text-sm font-semibold text-slate-700">Basic Information</h3>
        </div>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="space-y-2">
            <Label for="name">Full Name *</Label>
            <Input 
              id="name" 
              name="name" 
              type="text" 
              bind:value={$form.name}
              class={$errors.name ? 'border-red-500' : ''}
              placeholder="Enter tenant's full name"
              {...$constraints.name}
              required
            />
            {#if $errors.name}
              <p class="text-sm text-red-500 flex items-center gap-1">
                <AlertCircle class="w-4 h-4" />
                {$errors.name}
              </p>
            {/if}
          </div>
          
          <div class="space-y-2">
            <Label for="tenant_status">Status</Label>
            <input type="hidden" name="tenant_status" bind:value={$form.tenant_status} />
            <Select.Root
              type="single"
              bind:value={$form.tenant_status}
            >
              <Select.Trigger>
                <Badge variant="outline" class={getStatusColor($form.tenant_status)}>
                  {$form.tenant_status}
                </Badge>
              </Select.Trigger>
              <Select.Content>
                {#each tenantStatusOptions as status}
                  <Select.Item value={status}>
                    <Badge variant="outline" class={getStatusColor(status)}>
                      {status}
                    </Badge>
                  </Select.Item>
                {/each}
              </Select.Content>
            </Select.Root>
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="space-y-2">
            <Label for="email">Email Address (Optional)</Label>
            <div class="relative">
              <Mail class="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input 
                id="email" 
                name="email" 
                type="email" 
                bind:value={$form.email}
                class={`pl-10 ${$errors.email ? 'border-red-500' : ''}`}
                placeholder="tenant@example.com (optional)"
                {...$constraints.email}
              />
            </div>
            {#if $errors.email}
              <p class="text-sm text-red-500 flex items-center gap-1">
                <AlertCircle class="w-4 h-4" />
                {$errors.email}
              </p>
            {/if}
          </div>
          
          <div class="space-y-2">
            <Label for="contact_number">Contact Number (Optional)</Label>
            <div class="relative">
              <Phone class="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input 
                id="contact_number" 
                name="contact_number" 
                type="tel" 
                bind:value={$form.contact_number}
                class={`pl-10 ${$errors.contact_number ? 'border-red-500' : ''}`}
                placeholder="+1 (555) 123-4567 (optional)"
                {...$constraints.contact_number}
              />
            </div>
            {#if $errors.contact_number}
              <p class="text-sm text-red-500 flex items-center gap-1">
                <AlertCircle class="w-4 h-4" />
                {$errors.contact_number}
              </p>
            {/if}
          </div>
        </div>
      </div>

      <!-- Emergency Contact -->
      <div class="space-y-4">
        <div class="flex items-center gap-2 pb-2 border-b border-slate-200">
          <User class="w-4 h-4 text-slate-500" />
          <h3 class="text-sm font-semibold text-slate-700">Emergency Contact (All fields optional)</h3>
        </div>
        
        <Card>
          <CardContent class="grid grid-cols-1 md:grid-cols-2 gap-4 pt-6">
            <!-- Hidden inputs for emergency contact fields -->
            <input type="hidden" name="emergency_contact.name" bind:value={$form.emergency_contact.name} />
            <input type="hidden" name="emergency_contact.relationship" bind:value={$form.emergency_contact.relationship} />
            <input type="hidden" name="emergency_contact.phone" bind:value={$form.emergency_contact.phone} />
            <input type="hidden" name="emergency_contact.email" bind:value={$form.emergency_contact.email} />
            <input type="hidden" name="emergency_contact.address" bind:value={$form.emergency_contact.address} />
            
            <div class="space-y-2">
              <Label for="emergency_contact.name">Contact Name (Optional)</Label>
              <Input
                id="emergency_contact.name"
                type="text"
                bind:value={$form.emergency_contact.name}
                class={$errors.emergency_contact && typeof $errors.emergency_contact === 'object' && 'name' in $errors.emergency_contact ? 'border-red-500' : ''}
                placeholder="Emergency contact name (optional)"
              />
              {#if $errors.emergency_contact && typeof $errors.emergency_contact === 'object' && 'name' in $errors.emergency_contact}
                <p class="text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle class="w-4 h-4" />
                  {$errors.emergency_contact.name}
                </p>
              {/if}
            </div>

            <div class="space-y-2">
              <Label for="emergency_contact.relationship">Relationship (Optional)</Label>
              <Input
                id="emergency_contact.relationship"
                type="text"
                bind:value={$form.emergency_contact.relationship}
                class={$errors.emergency_contact && typeof $errors.emergency_contact === 'object' && 'relationship' in $errors.emergency_contact ? 'border-red-500' : ''}
                placeholder="e.g., Spouse, Parent, Friend (optional)"
              />
              {#if $errors.emergency_contact && typeof $errors.emergency_contact === 'object' && 'relationship' in $errors.emergency_contact}
                <p class="text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle class="w-4 h-4" />
                  {$errors.emergency_contact.relationship}
                </p>
              {/if}
            </div>

            <div class="space-y-2">
              <Label for="emergency_contact.phone">Phone Number (Optional)</Label>
              <div class="relative">
                <Phone class="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  id="emergency_contact.phone"
                  type="tel"
                  bind:value={$form.emergency_contact.phone}
                  class={`pl-10 ${$errors.emergency_contact && typeof $errors.emergency_contact === 'object' && 'phone' in $errors.emergency_contact ? 'border-red-500' : ''}`}
                  placeholder="+1 (555) 123-4567 (optional)"
                />
              </div>
              {#if $errors.emergency_contact && typeof $errors.emergency_contact === 'object' && 'phone' in $errors.emergency_contact}
                <p class="text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle class="w-4 h-4" />
                  {$errors.emergency_contact.phone}
                </p>
              {/if}
            </div>

            <div class="space-y-2">
              <Label for="emergency_contact.email">Email Address (Optional)</Label>
              <div class="relative">
                <Mail class="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  id="emergency_contact.email"
                  type="email"
                  bind:value={$form.emergency_contact.email}
                  class={`pl-10 ${$errors.emergency_contact && typeof $errors.emergency_contact === 'object' && 'email' in $errors.emergency_contact ? 'border-red-500' : ''}`}
                  placeholder="emergency@example.com (optional)"
                />
              </div>
              {#if $errors.emergency_contact && typeof $errors.emergency_contact === 'object' && 'email' in $errors.emergency_contact}
                <p class="text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle class="w-4 h-4" />
                  {$errors.emergency_contact.email}
                </p>
              {/if}
            </div>

            <div class="col-span-2 space-y-2">
              <Label for="emergency_contact.address">Address (Optional)</Label>
              <div class="relative">
                <MapPin class="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <Textarea
                  id="emergency_contact.address"
                  bind:value={$form.emergency_contact.address}
                  class={`pl-10 ${$errors.emergency_contact && typeof $errors.emergency_contact === 'object' && 'address' in $errors.emergency_contact ? 'border-red-500' : ''}`}
                  placeholder="Enter emergency contact's full address (optional)"
                  rows={3}
                />
              </div>
              {#if $errors.emergency_contact && typeof $errors.emergency_contact === 'object' && 'address' in $errors.emergency_contact}
                <p class="text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle class="w-4 h-4" />
                  {$errors.emergency_contact.address}
                </p>
              {/if}
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div class="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onclick={() => onOpenChange(false)}>
          Cancel
        </Button>
        <Button type="submit" disabled={$submitting}>
          {$submitting ? (editMode ? 'Saving...' : 'Creating...') : (editMode ? 'Save Changes' : 'Create Tenant')}
        </Button>
      </div>
    </form>
  </DialogContent>
</Dialog> 
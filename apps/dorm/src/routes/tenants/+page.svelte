<script lang="ts">
  import { superForm } from 'sveltekit-superforms/client';
  import { zodClient } from 'sveltekit-superforms/adapters';
  import { tenantFormSchema, type TenantFormData } from './formSchema';
  import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
  import TenantList from './TenantList.svelte';
  import TenantForm from './TenantForm.svelte';
  import type { ExtendedTenant } from './types';
  import type { PageData } from './$types';
  import { browser } from "$app/environment";
  import SuperDebug from 'sveltekit-superforms/client/SuperDebug.svelte';
  import { invalidate,invalidateAll } from '$app/navigation';

  interface Props {
    data: PageData;
  }

  let { data }: Props = $props();
  let tenants = $state(data.tenants);

  $effect(() => {
  tenants = structuredClone(data.tenants);
});

  
  const defaultEmergencyContact = {
    name: '',
    relationship: '',
    phone: '',
    email: null,
    address: ''
  };

  let editMode = $state(false);
  let selectedTenant: ExtendedTenant | undefined = $state();
  let formError = $state('');

  const formInstance = superForm<TenantFormData>(data.form, {
    id: 'tenant-form',
    validators: zodClient(tenantFormSchema),
    validationMethod: 'oninput',
    dataType: 'json',
    delayMs: 10,
    taintedMessage: null,
    resetForm: true,
    onError: ({ result }) => {
      console.error('Form validation errors:', result.error);
      if (result.error) {
        console.error('Server error:', result.error.message);
      }
    },
    onResult: async ({ result }) => {
      if (result.type === 'success') {
        selectedTenant = undefined;
        editMode = false;
        await invalidate('app:tenants');
        reset();
      } else if (result.type === 'failure') {
        formError = result.data?.message || 'An unknown error occurred';
      }
    }
  });

  const { form, enhance, errors, constraints, submitting, reset } = formInstance;

  function handleEdit(tenant: ExtendedTenant) {
    console.log('--- Edit Tenant Clicked ---');
    console.log('Tenant data:', tenant);
    editMode = true;
    selectedTenant = tenant;

    const emergencyContact = tenant.emergency_contact ?? defaultEmergencyContact;

    reset({ data: {
      id: tenant.id,
      name: tenant.name,
      contact_number: tenant.contact_number,
      email: tenant.email,
      auth_id: tenant.auth_id,
      tenant_status: tenant.tenant_status,
      created_by: tenant.created_by,
      emergency_contact: {
        ...defaultEmergencyContact,
        ...emergencyContact,
        email: emergencyContact.email ?? null
      }
    }});
    console.log('Form reset with new data for editing.');
  }

  async function handleDeleteTenant(tenant: ExtendedTenant) {
    console.log('Starting delete process for tenant:', tenant);

    if (!confirm(`Are you sure you want to delete tenant ${tenant.name}?`)) {
        console.log('Delete cancelled by user');
        return;
    }

    const formData = new FormData();
    formData.append('id', String(tenant.id));
    console.log('Form data prepared:', { tenantId: tenant.id });

    try {
        console.log('Sending delete request...');
        const result = await fetch('?/delete', {
            method: 'POST',
            body: formData
        });

        const response = await result.json();
        console.log('Received response:', response);

        if (response.type === 'failure') {
            // Parse the data string if it's a string
            let errorData;
            try {
                errorData = typeof response.data === 'string' 
                    ? JSON.parse(response.data) 
                    : response.data;
            } catch (e) {
                errorData = response.data;
            }

            // Extract error message
            const errorMessage = Array.isArray(errorData) 
                ? errorData[1] 
                : response.message || 'Unknown error';
                
            console.error('Delete failed:', {
                status: response.status,
                response,
                error: errorMessage
            });
            alert(errorMessage);
            return;
        }

        console.log('Delete successful, updating local state');
        tenants = tenants.filter(t => t.id !== tenant.id);
        selectedTenant = undefined;
        editMode = false;

        console.log('Invalidating caches...');
        await invalidateAll();
        console.log('Cache invalidation complete');
    } catch (error) {
        console.error('Error deleting tenant:', error);
        alert(`Error deleting tenant: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}
  function handleCancel() {
    selectedTenant = undefined;
    editMode = false;
    reset();
  }
</script>

<div class="container mx-auto p-4 flex">
  <TenantList
  {tenants}
    on:edit={event => handleEdit(event.detail)}
    on:delete={event => handleDeleteTenant(event.detail)}
  />

  <div class="w-1/3 pl-4">
    <Card>
      <CardHeader>
        <CardTitle>{editMode ? 'Edit' : 'Add'} Tenant</CardTitle>
      </CardHeader>
      <CardContent>
        <TenantForm
          {data}
          {editMode}
          form={form}
          {errors}
          {enhance}
          {constraints}
          {submitting}
          tenant={selectedTenant}
          on:cancel={handleCancel}
          on:tenantSaved={async () => {
            selectedTenant = undefined;
            editMode = false;
            await invalidate('app:tenants');
          }}
        />
      </CardContent>
    </Card>
  </div>
</div>

{#if browser}
  <SuperDebug data={form} />
{/if}
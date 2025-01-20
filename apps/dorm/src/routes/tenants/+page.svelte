<script lang="ts">
  import { superForm } from 'sveltekit-superforms/client';
  import { zodClient } from 'sveltekit-superforms/adapters';
  import { tenantFormSchema, type TenantFormData } from './formSchema';
  import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
  import TenantList from './TenantList.svelte';
  import TenantForm from './TenantForm.svelte';
  import type { ExtendedTenant } from './types';
  import type { SuperValidated } from 'sveltekit-superforms';
  import type { z } from 'zod';
  import type { Rental_unit } from '../rental_unit/formSchema';
  import type { Database } from '$lib/database.types';
  import type { PageData } from './$types';



  interface Props {
    data: PageData;
  }

  let { data }: Props = $props();
  
  const defaultEmergencyContact = {
    name: '',
    relationship: '',
    phone: '',
    email: null,
    address: ''
  };

  let editMode = $state(false);
  let selectedTenant: ExtendedTenant | undefined = $state();

  const { form, enhance, errors, constraints, submitting } = superForm<TenantFormData>(data.form, {
    id: 'tenant-form',
    validators: zodClient(tenantFormSchema),
    validationMethod: 'onblur',
    dataType: 'json',
    delayMs: 10,
    taintedMessage: null,
    resetForm: true,

    onError: ({ result }) => {
      console.error('Form validation errors:', result.error);
    },
    onResult: ({ result }) => {
      if (result.type === 'success') {
        selectedTenant = undefined;
        editMode = false;
        // Reset form to initial values
        handleCreate();
      }
    }
  });

  function handleEdit(tenant: ExtendedTenant) {
    editMode = true;
    selectedTenant = tenant;
    
    $form = {
      id: tenant.id,
      name: tenant.name,
      contact_number: tenant.contact_number,
      email: tenant.email,
      auth_id: tenant.auth_id,
      tenant_status: tenant.tenant_status,
      created_by: tenant.created_by,
      emergency_contact: tenant.emergency_contact ?? defaultEmergencyContact
    };
  }

  function handleCreate() {
    selectedTenant = undefined;
    editMode = false;
    
    $form = {
      id: 0,
      name: '',
      contact_number: null,
      email: null,
      auth_id: null,
      tenant_status: 'PENDING',
      created_by: data.profile?.id ?? null,
      emergency_contact: defaultEmergencyContact
    };
  }

  function handleCancel() {
    selectedTenant = undefined;
    editMode = false;
  }

  function handleDeleteSuccess() {
    selectedTenant = undefined;
    editMode = false;
  }
</script>

<div class="container mx-auto p-4 flex">
  <TenantList
    {data}
    on:edit={event => handleEdit(event.detail)}
    on:deleteSuccess={handleDeleteSuccess}
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
          {form}
          {errors}
          {enhance}
          {constraints}
          {submitting}
          tenant={selectedTenant}
          on:cancel={handleCancel}
          on:tenantSaved={() => {
            selectedTenant = undefined;
            editMode = false;
          }}
        />
      </CardContent>
    </Card>
  </div>
</div>

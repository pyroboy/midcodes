<script lang="ts">
  import { superForm } from 'sveltekit-superforms/client';
  import { zodClient } from 'sveltekit-superforms/adapters';
  import type { PageData } from './$types';
  import type { SuperValidated } from 'sveltekit-superforms';
  import { tenantFormSchema, type TenantFormData } from './formSchema';
  import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
  import TenantList from './TenantList.svelte';
  import TenantForm from './TenantForm.svelte';
  import type { ExtendedTenant } from './types';

  export let data: PageData;
  
  const defaultEmergencyContact = {
    name: '',
    relationship: '',
    phone: '',
    email: null,
    address: ''
  };

  let editMode = false;
  let selectedTenant: ExtendedTenant | undefined;

  const { form, enhance, errors, constraints, submitting } = superForm<TenantFormData>(data.form, {
    id: 'tenant-form',
    validators: zodClient(tenantFormSchema),
    validationMethod: 'auto',
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
      lease_status: tenant.lease_status,
      lease_type: tenant.lease_type,
      lease_id: tenant.lease?.id ? parseInt(tenant.lease.id) : null,
      location_id: tenant.lease?.location?.id ? parseInt(tenant.lease.location.id) : null,
      start_date: tenant.start_date,
      end_date: tenant.end_date,
      rent_amount: tenant.lease?.rent_amount ?? 0,
      security_deposit: tenant.lease?.security_deposit ?? 0,
      outstanding_balance: tenant.outstanding_balance,
      notes: tenant.lease?.notes ?? '',
      last_payment_date: null,
      next_payment_due: null,
      created_by: tenant.created_by,
      emergency_contact: tenant.emergency_contact ?? defaultEmergencyContact,
      payment_schedules: [],
      status_history: []
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
      lease_status: 'INACTIVE',
      lease_type: 'BEDSPACER',
      lease_id: null,
      location_id: null,
      start_date: new Date().toISOString().split('T')[0],
      end_date: new Date().toISOString().split('T')[0],
      rent_amount: 0,
      security_deposit: 0,
      outstanding_balance: 0,
      notes: '',
      last_payment_date: null,
      next_payment_due: null,
      created_by: data.profile?.id ?? null,
      emergency_contact: defaultEmergencyContact,
      payment_schedules: [],
      status_history: []
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
          formData={form}
          errors={errors}
          enhance={enhance}
          submitting={submitting}
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
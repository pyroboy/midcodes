<script lang="ts">
  import { superForm } from 'sveltekit-superforms/client';
  import { zodClient } from 'sveltekit-superforms/adapters';
  import { tenantFormSchema } from './formSchema';
  import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
  import TenantForm from './TenantForm.svelte';
  import type { TenantResponse } from '$lib/types/tenant';
  import type { PageData } from './$types';
  import { browser } from '$app/environment';
  import SuperDebug from 'sveltekit-superforms/client/SuperDebug.svelte';
  import { invalidate } from '$app/navigation';
  import { propertyStore } from '$lib/stores/property';
  import { derived } from 'svelte/store';
  import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '$lib/components/ui/accordion';
  import { Button } from '$lib/components/ui/button';
  import { Pencil, Trash2 } from 'lucide-svelte';
  import { Input } from '$lib/components/ui/input';
  import { Select, SelectContent, SelectItem, SelectTrigger } from '$lib/components/ui/select';

  let { data }: { data: PageData } = $props();

  const { form, enhance, errors, constraints, submitting, reset } = superForm(data.form, {
    validators: zodClient(tenantFormSchema),
    dataType: 'json',
    onResult: async ({ result }) => {
      if (result.type === 'success') {
        selectedTenant = undefined;
        editMode = false;
        await invalidate('app:tenants');
        reset();
      }
    },
    taintedMessage: null
  });

  let editMode = $state(false);
  let selectedTenant: TenantResponse | undefined = $state();
  let searchTerm = $state('');
  let selectedStatus = $state('');

      const filteredTenants = $derived.by(() => {
    const selectedProperty = $propertyStore.selectedProperty;

    return data.tenants.filter((tenant) => {
      // const propertyMatch = !selectedProperty || String(tenant.lease?.location?.property?.id) === String(selectedProperty.id);
      const searchMatch = !searchTerm || tenant.name.toLowerCase().includes(searchTerm.toLowerCase());
      const statusMatch = !selectedStatus || tenant.tenant_status === selectedStatus;

      // return propertyMatch && searchMatch && statusMatch;
      return searchMatch && statusMatch;
    });
  });

  function handleEdit(tenant: TenantResponse) {
    editMode = true;
    selectedTenant = tenant;
    reset({ data: tenant });
  }

  function handleCancel() {
    selectedTenant = undefined;
    editMode = false;
    reset();
  }
</script>

<div class="container mx-auto p-4 flex space-x-4">
  <div class="w-2/3">
    <Card>
      <CardHeader>
        <CardTitle>Tenants</CardTitle>
      </CardHeader>
      <CardContent>
        <div class="flex space-x-4 mb-4">
          <Input placeholder="Search tenants..." bind:value={searchTerm} class="w-full" />
          <Select type="single" name="tenant_status"  bind:value={selectedStatus}>
            <SelectTrigger class="w-[180px]">
              {selectedStatus ? selectedStatus.charAt(0).toUpperCase() + selectedStatus.slice(1).toLowerCase() : 'Filter by status'}
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Statuses</SelectItem>
              <SelectItem value="ACTIVE">Active</SelectItem>
              <SelectItem value="INACTIVE">Inactive</SelectItem>
              <SelectItem value="PENDING">Pending</SelectItem>
              <SelectItem value="BLACKLISTED">Blacklisted</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Accordion type="single" class="w-full">
          {#each filteredTenants as tenant (tenant.id)}
            <AccordionItem value={tenant.id.toString()}>
              <div class="flex justify-between items-center w-full">
                <AccordionTrigger>{tenant.name}</AccordionTrigger>
                <div class="flex space-x-2 mr-4">
                  <Button variant="outline" size="icon" onclick={() => handleEdit(tenant)}>
                    <Pencil class="h-4 w-4" />
                  </Button>
                  <form method="POST" action="?/delete" use:enhance>
                    <input type="hidden" name="id" value={tenant.id} />
                    <Button variant="destructive" size="icon" type="submit">
                      <Trash2 class="h-4 w-4" />
                    </Button>
                  </form>
                </div>
              </div>
              <AccordionContent>
                <div>
                  <p><strong>Email:</strong> {tenant.email || 'N/A'}</p>
                  <p><strong>Contact:</strong> {tenant.contact_number || 'N/A'}</p>
                  <p><strong>Status:</strong> {tenant.tenant_status}</p>
                </div>
              </AccordionContent>
            </AccordionItem>
          {/each}
        </Accordion>
      </CardContent>
    </Card>
  </div>

  <div class="w-1/3">
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
          on:cancel={handleCancel}
        />
      </CardContent>
    </Card>
  </div>
</div>

{#if browser}
  <SuperDebug data={$form} />
{/if}
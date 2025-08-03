<script lang="ts">
  import { invalidateAll } from '$app/navigation';
  import LeaseFormModal from './LeaseFormModal.svelte';
  import LeaseList from './LeaseList.svelte';
  import { Button } from '$lib/components/ui/button';
  import { Plus } from 'lucide-svelte';
  import type { z } from 'zod';
  import { leaseSchema } from './formSchema';

  type FormType = z.infer<typeof leaseSchema>;
  
  let { data } = $props();
  let leases = $state(data.leases);
  let showModal = $state(false);
  let selectedLease: FormType | undefined = $state();
  let editMode = $state(false);

  $effect(() => {
    leases = data.leases;
  });

  function handleAddLease() {
    selectedLease = undefined;
    editMode = false;
    showModal = true;
  }

  function handleEdit(lease: FormType) {
    selectedLease = lease;
    editMode = true;
    showModal = true;
  }

  async function handleDeleteLease(lease: FormType) {
    if (!confirm(`Are you sure you want to delete lease ${lease.name}?`)) return;

    const formData = new FormData();
    formData.append('id', String(lease.id));
    
    try {
      const result = await fetch('?/delete', {
        method: 'POST',
        body: formData
      });
      const response = await result.json();

      if (result.ok) {
        leases = leases.filter(l => l.id !== lease.id);
        await invalidateAll();
      } else {
        console.error('Delete failed:', response);
        alert(response.message || 'Failed to delete lease');
      }
    } catch (error) {
      console.error('Error deleting lease:', error);
      alert(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  function handleModalClose() {
    showModal = false;
    selectedLease = undefined;
    editMode = false;
  }

  function handleStatusChange(id: string, status: string) {
    leases = leases.map(lease => 
      lease.id === id 
        ? { ...lease, status } 
        : lease
    );
  }
</script>

<div class="w-full p-4">
  <div class="flex justify-between items-center mb-6">
    <h1 class="text-3xl font-bold">Leases</h1>
    <Button onclick={handleAddLease} class="flex items-center gap-2">
      <Plus class="w-4 h-4" />
      Add Lease
    </Button>
  </div>
  
  <LeaseList
    {leases}
    tenants={data.tenants}
    rentalUnits={data.rental_units}
    on:edit={event => handleEdit(event.detail)}
    on:delete={event => handleDeleteLease(event.detail)}
    onStatusChange={handleStatusChange}
  />
</div>

<!-- Modal for Create/Edit -->
<LeaseFormModal
  open={showModal}
  lease={selectedLease}
  {editMode}
  tenants={data.tenants}
  rentalUnits={data.rental_units}
  onOpenChange={handleModalClose}
/>

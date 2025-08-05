<script lang="ts">
  import { 
    Calendar,
    MapPin,
    Users,
    FileText
  } from 'lucide-svelte';
  import type { Lease } from '$lib/types/lease';
  import { formatDate } from '$lib/utils/format';

  interface Props {
    lease: Lease;
  }

  let { lease }: Props = $props();
</script>

<div class="p-6 space-y-6">
  <!-- Property & Tenant Info -->
  <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
    <!-- Property Details -->
    <div class="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-100">
      <div class="flex items-center gap-2 mb-4">
        <div class="p-2 bg-blue-100 rounded-lg">
          <MapPin class="w-5 h-5 text-blue-600" />
        </div>
        <h3 class="text-lg font-semibold text-slate-800">Property Details</h3>
      </div>
      
      <div class="space-y-3">
        <div>
          <div class="text-sm text-slate-600">Unit Information</div>
          <div class="font-semibold text-slate-800">
            {(lease.rental_unit as any)?.name || (lease.rental_unit as any)?.rental_unit_number || `Unit ${(lease.rental_unit as any)?.number || 'N/A'}`}
          </div>
        </div>
        
        {#if lease.rental_unit?.property?.name}
          <div>
            <div class="text-sm text-slate-600">Property</div>
            <div class="font-semibold text-slate-800">{lease.rental_unit.property.name}</div>
          </div>
        {/if}
        
        <div>
          <div class="text-sm text-slate-600">Lease Type</div>
          <div class="font-semibold text-slate-800">{lease.type || 'STANDARD'}</div>
        </div>
      </div>
    </div>

    <!-- Tenant Details -->
    <div class="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 border border-green-100">
      <div class="flex items-center gap-2 mb-4">
        <div class="p-2 bg-green-100 rounded-lg">
          <Users class="w-5 h-5 text-green-600" />
        </div>
        <h3 class="text-lg font-semibold text-slate-800">
          {lease.lease_tenants?.length === 1 ? 'Tenant' : 'Tenants'}
        </h3>
      </div>
      
      {#if lease.lease_tenants?.length}
        <div class="space-y-2">
          {#each lease.lease_tenants.filter(lt => lt.name) as tenant}
            <div class="flex items-center gap-3 p-3 bg-white/60 rounded-lg">
              <div class="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <span class="text-sm font-semibold text-green-600">
                  {tenant.name?.charAt(0).toUpperCase()}
                </span>
              </div>
              <span class="font-medium text-slate-800">{tenant.name}</span>
            </div>
          {/each}
        </div>
      {:else}
        <div class="text-slate-600 italic">No tenant information available</div>
      {/if}
    </div>
  </div>

  <!-- Lease Period & Status -->
  <div class="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-6 border border-purple-100">
    <div class="flex items-center gap-2 mb-4">
      <div class="p-2 bg-purple-100 rounded-lg">
        <Calendar class="w-5 h-5 text-purple-600" />
      </div>
      <h3 class="text-lg font-semibold text-slate-800">Lease Period</h3>
    </div>
    
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div class="text-center p-4 bg-white/60 rounded-xl">
        <div class="text-sm text-slate-600 mb-1">Start Date</div>
        <div class="font-semibold text-slate-800">{formatDate(lease.start_date)}</div>
      </div>
      <div class="text-center p-4 bg-white/60 rounded-xl">
        <div class="text-sm text-slate-600 mb-1">End Date</div>
        <div class="font-semibold text-slate-800">{formatDate(lease.end_date)}</div>
      </div>
      <div class="text-center p-4 bg-white/60 rounded-xl">
        <div class="text-sm text-slate-600 mb-1">Duration</div>
        <div class="font-semibold text-slate-800">
          {Math.ceil((new Date(lease.end_date).getTime() - new Date(lease.start_date).getTime()) / (1000 * 60 * 60 * 24))} days
        </div>
      </div>
    </div>
  </div>

  <!-- Notes -->
  {#if lease.notes}
    <div class="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-6 border border-amber-100">
      <div class="flex items-center gap-2 mb-4">
        <div class="p-2 bg-amber-100 rounded-lg">
          <FileText class="w-5 h-5 text-amber-600" />
        </div>
        <h3 class="text-lg font-semibold text-slate-800">Notes</h3>
      </div>
      <div class="text-slate-700 leading-relaxed">{lease.notes}</div>
    </div>
  {/if}
</div> 
<script lang="ts">
  import { Button } from '$lib/components/ui/button';
  import { Badge } from '$lib/components/ui/badge';
  import { Pencil, Trash2, MoreHorizontal, Calendar, Phone, Mail, User, DollarSign, Home } from 'lucide-svelte';
  import type { TenantResponse } from '$lib/types/tenant';
  import { formatCurrency } from '$lib/utils/format';

  interface Props {
    tenant: TenantResponse;
    onEdit: (tenant: TenantResponse) => void;
    onDelete: (tenant: TenantResponse) => void;
  }

  let { tenant, onEdit, onDelete }: Props = $props();

  let showMoreOptions = $state(false);

  function getStatusColor(status: string) {
    const colors: Record<string, string> = {
      'ACTIVE': 'bg-green-100 text-green-800 border-green-200',
      'PENDING': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'INACTIVE': 'bg-gray-100 text-gray-800 border-gray-200',
      'BLACKLISTED': 'bg-red-100 text-red-800 border-red-200'
    };
    return colors[status] || colors['INACTIVE'];
  }


  function getBalanceStatus(balance: number | null | undefined): string {
    if (!balance || balance <= 0) return 'bg-green-100 text-green-800 border-green-200';
    return 'bg-red-100 text-red-800 border-red-200';
  }
</script>

<div class="bg-white border border-slate-200 rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden group relative flex flex-col h-full">
  <div class="absolute top-3 right-3 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10">
    <Button 
      variant="ghost" 
      size="icon" 
      onclick={() => onEdit(tenant)} 
      class="h-8 w-8 bg-white/80 backdrop-blur-sm hover:bg-white border border-slate-200"
      aria-label="Edit tenant"
    >
      <Pencil class="h-3.5 w-3.5 text-slate-600" />
    </Button>
    <Button 
      variant="ghost" 
      size="icon" 
      onclick={() => onDelete(tenant)} 
      class="h-8 w-8 bg-white/80 backdrop-blur-sm hover:bg-white border border-slate-200"
      aria-label="Delete tenant"
    >
      <Trash2 class="h-3.5 w-3.5 text-red-500" />
    </Button>
  </div>

  <div class="flex-grow p-6 text-center">
    <div class="flex justify-center relative mb-4">
      <div class="relative w-40 h-40">
        {#if tenant.profile_picture_url}
          <!-- Profile Picture -->
          <div class="absolute inset-0 rounded-full overflow-hidden shadow-lg border-4 border-white">
            <img 
              src={tenant.profile_picture_url} 
              alt="{tenant.name}'s profile picture" 
              class="w-full h-full object-cover"
              loading="lazy"
            />
          </div>
        {:else}
          <!-- Fallback to Initials -->
          <div class="absolute inset-0 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-lg">
            <span class="text-white font-bold text-xl">
              {tenant.name.split(' ').map((n: string) => n[0]).join('').toUpperCase()}
            </span>
          </div>
        {/if}
        <div class="absolute bottom-[-10px] w-full flex justify-center">
          <Badge class={`${getStatusColor(tenant.tenant_status)} text-xs font-medium px-3 py-1.5 rounded-full border`}>
            {tenant.tenant_status}
          </Badge>
        </div>
      </div>
    </div>

    <h3 class="font-semibold text-slate-900 text-2xl mb-2">{tenant.name}</h3>
    
    <div class="space-y-2 mb-4">
      {#if tenant.email}
        <div class="flex items-center justify-center gap-2 text-sm text-slate-600">
          <Mail class="h-3.5 w-3.5" />
          <span class="truncate max-w-[200px]">{tenant.email}</span>
        </div>
      {/if}
      {#if tenant.contact_number}
        <div class="flex items-center justify-center gap-2 text-sm text-slate-600">
          <Phone class="h-3.5 w-3.5" />
          <span>{tenant.contact_number}</span>
        </div>
      {/if}
    </div>
  </div>

  <div class="p-6 pt-0 mt-auto">
    <div class="grid grid-cols-2 gap-4">
      <div class="text-center">
        <div class="text-sm font-medium text-slate-800">
          {tenant.lease?.location?.name || 'N/A'}
        </div>
      </div>
      <div class="text-center">
        <div class="text-sm font-medium text-slate-800">
          {formatCurrency(tenant.lease?.balance || 0)}
        </div>
        {#if tenant.lease?.balance && tenant.lease.balance > 0}
          <Badge class={`${getBalanceStatus(tenant.lease.balance)} text-xs px-2 py-0.5 rounded-full border`}>
            Overdue
          </Badge>
        {/if}
      </div>
    </div>
  </div>
</div>
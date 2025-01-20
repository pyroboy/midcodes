<!-- PaymentList.svelte -->
<script lang="ts">
  import { Badge } from '$lib/components/ui/badge';
  import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
  } from '$lib/components/ui/card';
  import { createEventDispatcher } from 'svelte';

  interface Props {
    payments?: any[];
    canEdit?: boolean;
  }

  let { payments = [], canEdit = false }: Props = $props();

  const dispatch = createEventDispatcher();

  function getMethodBadgeVariant(method: string): 'default' | 'destructive' | 'outline' | 'secondary' {
    switch (method) {
      case 'CASH':
        return 'default';
      case 'BANK':
        return 'secondary';
      case 'GCASH':
        return 'outline';
      default:
        return 'destructive';
    }
  }

  function getStatusBadgeVariant(status: string): 'default' | 'destructive' | 'outline' | 'secondary' {
    switch (status) {
      case 'PAID':
        return 'default';
      case 'PARTIAL':
        return 'secondary';
      case 'PENDING':
        return 'outline';
      case 'OVERDUE':
        return 'destructive';
      default:
        return 'outline';
    }
  }

  function getStatusClass(status: string): string {
    switch (status) {
      case 'PAID':
        return 'bg-green-50 border-green-200';
      case 'PARTIAL':
        return 'bg-blue-50 border-blue-200';
      case 'PENDING':
        return 'bg-yellow-50 border-yellow-200';
      case 'OVERDUE':
        return 'bg-red-50 border-red-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  }

  function formatDate(date: string): string {
    return new Date(date).toLocaleString();
  }

  function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP'
    }).format(amount);
  }
</script>

<div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
  {#each payments as payment}
    <Card class="w-full {getStatusClass(payment.billing?.status)} transition-colors duration-200">
      <CardHeader>
        <div class="flex items-center justify-between">
          <CardTitle class="text-lg">
            Payment #{payment.id}
          </CardTitle>
          <Badge variant={getMethodBadgeVariant(payment.method)}>
            {payment.method}
          </Badge>
        </div>
        <CardDescription>
          {payment.billing.lease.name} - {payment.billing.type}
          {#if payment.billing.utility_type}
            - {payment.billing.utility_type}
          {/if}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div class="space-y-2">
          <div class="flex items-center justify-between">
            <span class="text-sm text-muted-foreground">Amount:</span>
            <span class="font-medium">{formatCurrency(payment.amount)}</span>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-sm text-muted-foreground">Status:</span>
            <Badge variant={getStatusBadgeVariant(payment.billing.status)}>
              {payment.billing.status}
            </Badge>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-sm text-muted-foreground">Paid By:</span>
            <span>{payment.paid_by}</span>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-sm text-muted-foreground">Paid At:</span>
            <span>{formatDate(payment.paid_at)}</span>
          </div>
          {#if payment.reference_number}
            <div class="flex items-center justify-between">
              <span class="text-sm text-muted-foreground">Reference:</span>
              <span class="font-mono text-sm">{payment.reference_number}</span>
            </div>
          {/if}
          {#if payment.receipt_url}
            <div class="flex items-center justify-between">
              <span class="text-sm text-muted-foreground">Receipt:</span>
              <a href={payment.receipt_url} target="_blank" class="text-blue-600 hover:underline">View Receipt</a>
            </div>
          {/if}
          {#if payment.billing.status === 'OVERDUE'}
            <div class="mt-2 p-2 bg-red-100 border border-red-200 rounded text-red-800 text-sm">
              <strong>Warning:</strong> This payment is overdue. Please settle as soon as possible.
            </div>
          {/if}
        </div>
      </CardContent>
      {#if canEdit}
        <CardFooter>
          <div class="text-xs text-muted-foreground">
            Created: {formatDate(payment.created_at)}
            {#if payment.updated_at && payment.updated_at !== payment.created_at}
              <br />Updated: {formatDate(payment.updated_at)}
            {/if}
          </div>
        </CardFooter>
      {/if}
    </Card>
  {/each}
</div>

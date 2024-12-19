<script lang="ts">
  import PaymentForm from './PaymentForm.svelte';
  import * as Card from '$lib/components/ui/card';
  import { Badge } from '$lib/components/ui/badge';
  import Button from '$lib/components/ui/button/button.svelte';
  import type { PageData } from './$types';
  import type { z } from 'zod';
  import type { paymentSchema } from './formSchema';

  type Payment = z.infer<typeof paymentSchema> & {
    billing?: {
      id: number;
      type: string;
      utility_type?: string;
      lease?: {
        id: number;
        name: string;
        room?: {
          id: number;
          room_number: string;
          floor?: {
            floor_number: string;
            wing?: string;
            property?: {
              name: string;
            };
          };
        };
      };
    };
  };

  export let data: PageData;

  let showForm = false;
  let selectedPayment: Payment | undefined = undefined;

  function handlePaymentClick(payment: Payment) {
    if (data.isAdminLevel || data.isAccountant) {
      selectedPayment = payment;
      showForm = true;
    }
  }

  function handlePaymentAdded() {
    showForm = false;
    selectedPayment = undefined;
  }

  function getStatusVariant(status: string): 'default' | 'destructive' | 'outline' | 'secondary' {
    switch (status) {
      case 'PAID':
        return 'secondary';
      case 'PENDING':
        return 'outline';
      case 'FAILED':
        return 'destructive';
      case 'REFUNDED':
      case 'CANCELLED':
        return 'secondary';
      default:
        return 'default';
    }
  }

  function getMethodVariant(method: string): 'default' | 'destructive' | 'outline' | 'secondary' {
    switch (method) {
      case 'CASH':
        return 'secondary';
      case 'BANK_TRANSFER':
      case 'GCASH':
      case 'MAYA':
        return 'outline';
      case 'CREDIT_CARD':
        return 'destructive';
      case 'CHECK':
        return 'secondary';
      default:
        return 'default';
    }
  }
</script>

<div class="space-y-4">
  {#if !showForm}
    <div class="flex justify-between items-center">
      <h1 class="text-2xl font-bold">Payments</h1>
      {#if data.isAdminLevel || data.isAccountant || data.isFrontdesk}
        <Button on:click={() => showForm = true}>Add Payment</Button>
      {/if}
    </div>

    <div class="grid gap-4">
      {#each data.payments || [] as payment}
        <Card.Root 
          class="cursor-pointer {(data.isAdminLevel || data.isAccountant) ? 'hover:bg-gray-50' : ''}"
          on:click={() => handlePaymentClick(payment)}
        >
          <Card.Header>
            <Card.Title class="flex justify-between items-center">
              <span>
                ₱{payment.amount.toFixed(2)}
                <Badge variant={getStatusVariant(payment.status)} class="ml-2">
                  {payment.status}
                </Badge>
                <Badge variant={getMethodVariant(payment.payment_method)} class="ml-2">
                  {payment.payment_method}
                </Badge>
              </span>
              <span class="text-sm font-normal">
                {#if payment.billing?.lease?.room}
                  Room {payment.billing.lease.room.room_number}
                  {#if payment.billing.lease.room.floor}
                    - Floor {payment.billing.lease.room.floor.floor_number}
                    {#if payment.billing.lease.room.floor.wing}
                      Wing {payment.billing.lease.room.floor.wing}
                    {/if}
                  {/if}
                {/if}
              </span>
            </Card.Title>
            <Card.Description>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-2">
                <div>
                  <strong>Property:</strong> {payment.billing?.lease?.room?.floor?.property?.name}
                </div>
                <div>
                  <strong>Lease:</strong> {payment.billing?.lease?.name}
                </div>
                <div>
                  <strong>Billing Type:</strong> {payment.billing?.type}
                  {#if payment.billing?.utility_type}
                    - {payment.billing.utility_type}
                  {/if}
                </div>
                <div>
                  <strong>Payment Date:</strong> {new Date(payment.payment_date).toLocaleDateString()}
                </div>
                {#if payment.reference_number}
                  <div>
                    <strong>Reference:</strong> {payment.reference_number}
                  </div>
                {/if}
              </div>
            </Card.Description>
          </Card.Header>
          {#if payment.notes}
            <Card.Content>
              <div class="text-sm">
                <strong>Notes:</strong> {payment.notes}
              </div>
            </Card.Content>
          {/if}
        </Card.Root>
      {/each}
    </div>
  {:else}
    <div class="flex justify-between items-center mb-4">
      <h1 class="text-2xl font-bold">{selectedPayment ? 'Edit' : 'Add'} Payment</h1>
      <Button variant="outline" on:click={() => {
        showForm = false;
        selectedPayment = undefined;
      }}>
        Cancel
      </Button>
    </div>

    <PaymentForm
      {data}
      billings={data.billings}
      editMode={!!selectedPayment}
      payment={selectedPayment}
      on:paymentAdded={handlePaymentAdded}
    />
  {/if}
</div>

{#if !data.isAdminLevel && !data.isAccountant && !data.isFrontdesk}
  <div class="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
    <p class="text-yellow-800">
      You are viewing this page in read-only mode. Contact an administrator if you need to make changes.
    </p>
  </div>
{/if}

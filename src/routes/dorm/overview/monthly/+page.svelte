<script lang="ts">
  import type { PageData } from './$types';
  import { formatCurrency } from '$lib/utils';
  import * as Card from '$lib/components/ui/card';
  import * as Table from '$lib/components/ui/table';
  import { Badge } from '$lib/components/ui/badge';

  export let data: PageData;

  // Group rooms by floor
  $: roomsByFloor = data.rooms.reduce((acc, room) => {
    const floor = room.floor_number;
    if (!acc[floor]) acc[floor] = [];
    acc[floor].push(room);
    return acc;
  }, {} as Record<number, typeof data.rooms>);

  // Group balances by tenant
  $: balancesByTenant = data.balances.reduce((acc, balance) => {
    if (!acc[balance.tenant_id]) acc[balance.tenant_id] = {};
    acc[balance.tenant_id][balance.month] = balance.balance;
    return acc;
  }, {} as Record<number, Record<string, number>>);
</script>

<div class="container mx-auto p-4 space-y-8">
  <h1 class="text-2xl font-bold">Monthly Overview</h1>

  {#each Object.entries(roomsByFloor) as [floor, rooms]}
    <Card.Root>
      <Card.Header>
        <Card.Title>Floor {floor}</Card.Title>
      </Card.Header>
      <Card.Content>
        <Table.Root>
          <Table.Header>
            <Table.Row>
              <Table.Head>Room</Table.Head>
              <Table.Head>Status</Table.Head>
              <Table.Head>Tenant</Table.Head>
              {#each data.months as month}
                <Table.Head>{month}</Table.Head>
              {/each}
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {#each rooms as room}
              {#each room.leases as lease}
                {#each lease.lease_tenants as tenant}
                  <Table.Row>
                    <Table.Cell>{room.number}</Table.Cell>
                    <Table.Cell>
                      <Badge
                        variant={room.room_status === 'OCCUPIED'
                          ? 'default'
                          : room.room_status === 'MAINTENANCE'
                          ? 'secondary'
                          : 'destructive'}
                      >
                        {room.room_status}
                      </Badge>
                    </Table.Cell>
                    <Table.Cell>{tenant.tenant.email}</Table.Cell>
                    {#each data.months as month}
                      <Table.Cell>
                        {formatCurrency(balancesByTenant[tenant.tenant.id]?.[month] ?? 0)}
                      </Table.Cell>
                    {/each}
                  </Table.Row>
                {/each}
              {/each}
            {/each}
          </Table.Body>
        </Table.Root>
      </Card.Content>
    </Card.Root>
  {/each}
</div>
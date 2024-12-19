<script lang="ts">
  import type { PageData } from './$types';
  import { formatCurrency } from '$lib/utils/format';
  import * as Card from '$lib/components/ui/card';
  import * as Table from '$lib/components/ui/table';
  import { Badge } from '$lib/components/ui/badge';

  export let data: PageData;

  interface Room {
    id: number;
    name: string;
    number: number;
    floor_number: number;
    room_status: 'OCCUPIED' | 'MAINTENANCE' | 'VACANT';
    property_id: number;
    leases: Array<{
      id: number;
      lease_status: string;
      lease_start_date: string;
      lease_end_date: string;
      lease_rent_rate: number;
      lease_tenants: Array<{
        tenant: {
          id: number;
          email: string;
          first_name: string;
          last_name: string;
        };
      }>;
    }>;
  }

  interface Balance {
    tenant_id: number;
    month: string;
    balance: number;
  }

  // Group rooms by floor
  $: roomsByFloor = data.rooms.reduce<Record<number, Room[]>>((acc, room) => {
    const floor = room.floor_number;
    if (!acc[floor]) acc[floor] = [];
    acc[floor].push(room);
    return acc;
  }, {});

  // Group balances by tenant
  $: balancesByTenant = data.balances.reduce((acc: Record<number, Record<string, number>>, balance: Balance) => {
    if (!acc[balance.tenant_id]) acc[balance.tenant_id] = {};
    acc[balance.tenant_id][balance.month] = balance.balance;
    return acc;
  }, {});
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
                    <Table.Cell>{tenant.tenant.first_name} {tenant.tenant.last_name} ({tenant.tenant.email})</Table.Cell>
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
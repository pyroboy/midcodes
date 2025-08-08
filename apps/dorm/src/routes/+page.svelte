<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Building, Users, FileText, CreditCard } from 'lucide-svelte';
	import type { PageData } from './$types';

	let { data } = $props<{ data: PageData }>();
</script>

<div class="container mx-auto p-6 space-y-8">
	<div class="text-center space-y-4">
		<h1 class="text-4xl font-bold">Welcome to Dorm Management</h1>
		<p class="text-xl text-muted-foreground max-w-2xl mx-auto">
			Your comprehensive solution for managing dormitory properties, tenants, and operations.
		</p>
	</div>

	{#if data.user}
		<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
			<Card class="hover:shadow-lg transition-shadow">
				<CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
					<CardTitle class="text-sm font-medium">Properties</CardTitle>
					<Building class="h-4 w-4 text-muted-foreground" />
				</CardHeader>
				<CardContent>
					<div class="text-2xl font-bold">--</div>
					<p class="text-xs text-muted-foreground">
						<a href="/properties" class="text-primary hover:underline">Manage your properties</a>
					</p>
				</CardContent>
			</Card>

			<Card class="hover:shadow-lg transition-shadow">
				<CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
					<CardTitle class="text-sm font-medium">Tenants</CardTitle>
					<Users class="h-4 w-4 text-muted-foreground" />
				</CardHeader>
				<CardContent>
					<div class="text-2xl font-bold">--</div>
					<p class="text-xs text-muted-foreground">
						<a href="/tenants" class="text-primary hover:underline">Manage tenants</a>
					</p>
				</CardContent>
			</Card>

			<Card class="hover:shadow-lg transition-shadow">
				<CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
					<CardTitle class="text-sm font-medium">Active Leases</CardTitle>
					<FileText class="h-4 w-4 text-muted-foreground" />
				</CardHeader>
				<CardContent>
					<div class="text-2xl font-bold">--</div>
					<p class="text-xs text-muted-foreground">
						<a href="/leases" class="text-primary hover:underline">View all leases</a>
					</p>
				</CardContent>
			</Card>

			<Card class="hover:shadow-lg transition-shadow">
				<CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
					<CardTitle class="text-sm font-medium">Payments</CardTitle>
					<CreditCard class="h-4 w-4 text-muted-foreground" />
				</CardHeader>
				<CardContent>
					<div class="text-2xl font-bold">--</div>
					<p class="text-xs text-muted-foreground">
						<a href="/payments" class="text-primary hover:underline">Track payments</a>
					</p>
				</CardContent>
			</Card>
		</div>

		<div class="text-center">
			<h2 class="text-2xl font-semibold mb-4">Quick Actions</h2>
			<div class="flex flex-wrap justify-center gap-4">
				<Button variant="default">
					<a href="/properties">
						<Building class="mr-2 h-4 w-4" />
						Add Property
					</a>
				</Button>
				<Button variant="outline">
					<a href="/tenants">
						<Users class="mr-2 h-4 w-4" />
						Add Tenant
					</a>
				</Button>
				<Button variant="outline">
					<a href="/leases">
						<FileText class="mr-2 h-4 w-4" />
						Create Lease
					</a>
				</Button>
			</div>
		</div>
	{:else}
		<div class="text-center space-y-6">
			<p class="text-lg text-muted-foreground">Please sign in to access the dorm management system.</p>
			<Button>
				<a href="/auth">Sign In</a>
			</Button>
		</div>
	{/if}
</div>

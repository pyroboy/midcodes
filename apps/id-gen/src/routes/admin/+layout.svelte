<script lang="ts">
	import type { LayoutData } from './$types';

	interface Props {
		data: LayoutData & { organization?: any };
		children: any;
	}

	let { data, children }: Props = $props();

	// Check if user has admin permissions
	$effect(() => {
		if (!data.user) {
			// Will be handled by server-side redirect
			return;
		}

		const hasAdminRole =
			data.user.role && ['super_admin', 'org_admin', 'id_gen_admin'].includes(data.user.role);
		if (!hasAdminRole) {
			console.warn('User does not have admin permissions');
		}
	});
</script>

<div class="min-h-screen bg-background">
	<!-- Admin-specific header -->
	<header class="bg-gray-900 text-white shadow-lg">
		<div class="container mx-auto px-4">
			<div class="flex justify-between items-center h-16">
				<div class="flex items-center space-x-4">
					<a href="/" class="text-white hover:text-gray-300" aria-label="Back to home">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							class="h-6 w-6"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M10 19l-7-7m0 0l7-7m-7 7h18"
							/>
						</svg>
					</a>
					<h1 class="text-xl font-bold">Admin Dashboard</h1>
				</div>
				<div class="flex items-center space-x-4">
					<span class="text-sm text-gray-300">
						{data.user?.role} • {data.organization?.name || 'Unknown Org'}
					</span>
					<a href="/profile" class="px-3 py-2 rounded hover:bg-gray-700 text-sm"> Profile </a>
				</div>
			</div>
		</div>
	</header>

	<!-- Admin navigation -->
	<nav class="bg-gray-800 text-white">
		<div class="container mx-auto px-4">
			<div class="flex space-x-2 sm:space-x-8 overflow-x-auto scrollbar-hide">
				<a
					href="/admin"
					class="flex items-center px-2 sm:px-3 py-4 text-xs sm:text-sm font-medium hover:text-blue-300 border-b-2 border-transparent hover:border-blue-300 whitespace-nowrap"
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						class="h-4 w-4 mr-1 sm:mr-2"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
						/>
					</svg>
					<span class="hidden sm:inline">Overview</span>
					<span class="sm:hidden">Home</span>
				</a>
				<a
					href="/admin/users"
					class="flex items-center px-2 sm:px-3 py-4 text-xs sm:text-sm font-medium hover:text-blue-300 border-b-2 border-transparent hover:border-blue-300 whitespace-nowrap"
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						class="h-4 w-4 mr-1 sm:mr-2"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
						/>
					</svg>
					Users
				</a>
				<a
					href="/admin/organization"
					class="flex items-center px-2 sm:px-3 py-4 text-xs sm:text-sm font-medium hover:text-blue-300 border-b-2 border-transparent hover:border-blue-300 whitespace-nowrap"
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						class="h-4 w-4 mr-1 sm:mr-2"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
						/>
					</svg>
					<span class="hidden sm:inline">Organization</span>
					<span class="sm:hidden">Org</span>
				</a>
				<a
					href="/admin/analytics"
					class="flex items-center px-2 sm:px-3 py-4 text-xs sm:text-sm font-medium hover:text-blue-300 border-b-2 border-transparent hover:border-blue-300 whitespace-nowrap"
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						class="h-4 w-4 mr-1 sm:mr-2"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
						/>
					</svg>
					<span class="hidden sm:inline">Analytics</span>
					<span class="sm:hidden">Stats</span>
				</a>
			</div>
		</div>
	</nav>

	<!-- Main content area -->
	<main class="container mx-auto px-4 py-8">
		{@render children()}
	</main>
</div>

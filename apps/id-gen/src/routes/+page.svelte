<script lang="ts">
	import type { PageData } from './$types';
	import {
		Card,
		CardContent,
		CardDescription,
		CardHeader,
		CardTitle
	} from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import DashboardStatsCard from '$lib/components/DashboardStatsCard.svelte';
	import IDThumbnailCard from '$lib/components/IDThumbnailCard.svelte';
	import IDPreviewModal from '$lib/components/IDPreviewModal.svelte';
	import { formatDate, formatDateShort } from '$lib/utils/dateFormat';

	interface Props {
		data: PageData & { user?: any };
	}

	let { data }: Props = $props();

	// Modal state
	let modalOpen = $state(false);
	interface PreviewCard {
		idcard_id?: number;
		template_name: string;
		front_image?: string | null;
		back_image?: string | null;
		created_at?: string;
		fields?: Record<string, { value: string }>;
	}
	let selectedCards = $state<PreviewCard[]>([]);
	let selectedIndex = $state(0);
	let downloadingCards = $state(new Set<string>());

	// Debug modal state changes
	$effect(() => {
		console.log('🔍 Modal state changed:', {
			modalOpen,
			selectedCardsLength: selectedCards.length,
			selectedIndex
		});
	});

	function getIdNumber(cardData: any) {
		try {
			return cardData?.id_number || 'N/A';
		} catch (e) {
			return 'N/A';
		}
	}

	function getName(cardData: any) {
		try {
			return cardData?.full_name || cardData?.name || 'N/A';
		} catch (e) {
			return 'N/A';
		}
	}

	function getUserFirstName(user: any): string {
		if (!user?.email) return 'User';
		return user.email.split('@')[0].charAt(0).toUpperCase() + user.email.split('@')[0].slice(1);
	}

	function getTimeGreeting(): string {
		const hour = new Date().getHours();
		if (hour < 12) return 'Good morning';
		if (hour < 17) return 'Good afternoon';
		return 'Good evening';
	}

	// Modal and interaction functions
	function openPreview(cards: PreviewCard[], index: number = 0) {
		console.log('openPreview called with:', { cardsLength: cards.length, index });
		selectedCards = cards;
		selectedIndex = index;
		modalOpen = true;
		console.log('Modal state set to:', modalOpen);
	}

	function openSinglePreview(card: PreviewCard) {
		console.log('Opening preview for card:', card);
		const cardIndex = transformedCards.findIndex(c => c.idcard_id === card.idcard_id);
		console.log('Card index found:', cardIndex, 'Total cards:', transformedCards.length);
		openPreview(transformedCards, cardIndex >= 0 ? cardIndex : 0);
	}

	function closePreview() {
		modalOpen = false;
		selectedCards = [];
		selectedIndex = 0;
	}

	async function downloadCard(card: any) {
		const cardId = card.id?.toString();
		if (!cardId) return;

		downloadingCards.add(cardId);
		downloadingCards = downloadingCards;

		try {
			// Implement download logic here
			console.log('Downloading card:', cardId);
			// You can reuse the download logic from all-ids route
		} catch (error) {
			console.error('Download failed:', error);
		} finally {
			downloadingCards.delete(cardId);
			downloadingCards = downloadingCards;
		}
	}

	function editCard(card: any) {
		// Navigate to template editing with this card's data
		window.location.href = `/templates?edit=${card.id}`;
	}

	// Transform recent cards for thumbnail component
	function transformRecentCards(cards: any[]) {
		return cards.map(card => ({
			idcard_id: card.id,
			template_name: card.template_name || 'Unknown Template',
			front_image: card.front_image,
			back_image: card.back_image,
			created_at: card.created_at,
			fields: {
				Name: { value: getName(card.data) },
				ID: { value: getIdNumber(card.data) }
			}
		}));
	}

	// Get stats for dashboard
	function getDashboardStats() {
		const totalCards = data.totalCards || 0;
		const recentCardsCount = data.recentCards?.length || 0;
		const templatesCount = data.totalTemplates || 0;
		const weeklyCards = data.weeklyCards || 0;
		
		return {
			totalCards,
			recentCardsCount,
			templatesCount,
			weeklyCards
		};
	}

	const stats = getDashboardStats();
	const transformedCards = transformRecentCards(data.recentCards || []);

	// Debug transformed cards
	console.log('🎯 Dashboard data loaded:', {
		totalCards: data.totalCards,
		recentCardsCount: data.recentCards?.length,
		transformedCardsCount: transformedCards.length,
		transformedCards: transformedCards.slice(0, 2) // Show first 2 for debugging
	});

	// Quick actions based on user role
	function getQuickActions(user: any) {
		const baseActions = [
			{
				title: 'Browse Templates',
				description: 'Choose from available templates',
				href: '/templates',
				icon: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />`,
				primary: true
			},
			{
				title: 'View My IDs',
				description: 'See all generated ID cards',
				href: '/all-ids',
				icon: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V4a2 2 0 114 0v2m-4 0a2 2 0 104 0m-4 0V4a2 2 0 014 0v2" />`,
				primary: false
			}
		];

		// Add admin actions - check app_metadata for roles
		const userRoles = user?.app_metadata?.role
			? [user.app_metadata.role]
			: user?.app_metadata?.roles || [];
		const hasAdminRole = userRoles.some((role: string) =>
			['super_admin', 'org_admin', 'id_gen_admin', 'property_admin'].includes(role)
		);

		if (hasAdminRole) {
			baseActions.push({
				title: 'Admin Panel',
				description: 'Manage users and settings',
				href: '/admin',
				icon: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />`,
				primary: false
			});
		}

		return baseActions;
	}
</script>

<div class="container mx-auto px-4 py-6 space-y-8">
	<!-- Hero Section -->
	<div class="bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-2xl p-6 md:p-8">
		<div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
			<div>
				<h1 class="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2">
					{getTimeGreeting()}, {data.user ? getUserFirstName(data.user) : 'User'}!
				</h1>
				<p class="text-gray-600 dark:text-gray-300 text-lg mb-4">Here's what's happening with your ID generation</p>
				<div class="flex flex-wrap gap-3">
					<Button href="/templates" size="lg">
						<svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
						</svg>
						Create New ID
					</Button>
					<Button href="/templates" variant="outline" size="lg">
						<svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path>
						</svg>
						Manage Templates
					</Button>
				</div>
			</div>
		</div>
	</div>

	<!-- Statistics Grid -->
	<div class="space-y-4">
		<h2 class="text-2xl font-bold text-gray-900 dark:text-white">Overview</h2>
		<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
			<DashboardStatsCard 
				title="Total IDs Created" 
				value={stats.totalCards} 
				icon="id-card" 
				href="/all-ids"
			/>
			<DashboardStatsCard 
				title="Templates Available" 
				value={stats.templatesCount} 
				icon="layout-template" 
				href="/templates"
			/>
			<DashboardStatsCard 
				title="Recent Activity" 
				value={stats.recentCardsCount} 
				icon="trending-up" 
			/>
			<DashboardStatsCard 
				title="This Week" 
				value={stats.weeklyCards} 
				icon="calendar" 
				change="+12%" 
				changeType="positive"
			/>
		</div>
	</div>


	<!-- Recent ID Cards -->
	{#if data.error}
		<Card class="border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800">
			<CardContent class="p-6">
				<div class="flex items-center gap-3">
					<svg
						class="h-5 w-5 text-red-600"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
						/>
					</svg>
					<p class="text-red-700 dark:text-red-300">
						Error loading recent activity. Please try again later.
					</p>
				</div>
			</CardContent>
		</Card>
	{:else if transformedCards.length > 0}
		<div class="space-y-6">
			<div class="flex items-center justify-between">
				<h2 class="text-2xl font-bold text-gray-900 dark:text-white">Recent ID Cards</h2>
				<div class="flex gap-2">
					<!-- Debug button -->
					<Button variant="outline" onclick={() => { 
						console.log('🧪 Test button clicked'); 
						if (transformedCards.length > 0) {
							openSinglePreview(transformedCards[0]);
						} else {
							console.log('No cards to preview');
						}
					}}>
						Test Modal
					</Button>
					<Button href="/all-ids" variant="outline">
						View All
						<svg class="h-4 w-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
						</svg>
					</Button>
				</div>
			</div>

			<!-- Thumbnail Grid -->
			<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
				{#each transformedCards.slice(0, 8) as card, index}
					<IDThumbnailCard 
						{card}
						onPreview={() => openSinglePreview(card)}
						onDownload={() => downloadCard(card)}
						onEdit={() => editCard(card)}
						downloading={downloadingCards.has(card.idcard_id?.toString() || '')}
					/>
				{/each}
			</div>
		</div>
	{:else}
		<div class="space-y-6">
			<h2 class="text-2xl font-bold text-gray-900 dark:text-white">Recent ID Cards</h2>
			<Card>
				<CardContent class="p-12 text-center">
					<div class="w-20 h-20 mx-auto mb-6 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
						<svg class="h-10 w-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V4a2 2 0 114 0v2m-4 0a2 2 0 104 0m-4 0V4a2 2 0 014 0v2"/>
						</svg>
					</div>
					<h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-3">No ID Cards Yet</h3>
					<p class="text-gray-500 dark:text-gray-400 mb-6 max-w-md mx-auto">
						Get started by creating your first ID card. Choose from our available templates and customize them to your needs.
					</p>
					<Button href="/templates" size="lg">
						<svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
						</svg>
						Create Your First ID
					</Button>
				</CardContent>
			</Card>
		</div>
	{/if}
</div>

<!-- Preview Modal -->
{#if modalOpen}
	<IDPreviewModal 
		open={modalOpen}
		cards={selectedCards}
		initialIndex={selectedIndex}
		mode="simple"
		onClose={closePreview}
		onDownload={downloadCard}
		onEdit={editCard}
	/>
{/if}

<style>
	:global(.dark) {
		color-scheme: dark;
	}
</style>

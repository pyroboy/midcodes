<script lang="ts">
	// Props
	let {
		title,
		value,
		icon,
		change = null,
		changeType = 'neutral',
		href = null,
		className = ''
	} = $props<{
		title: string;
		value: string | number;
		icon: string;
		change?: string | number | null;
		changeType?: 'positive' | 'negative' | 'neutral';
		href?: string | null;
		className?: string;
	}>();

	// Icon mapping
	const iconMap: Record<string, string> = {
		'id-card':
			'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z',
		'layout-template':
			'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10',
		'trending-up': 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6',
		users:
			'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a4 4 0 11-8 0 4 4 0 018 0z',
		calendar:
			'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
		'chart-bar':
			'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z'
	};

	const iconPath = $derived(iconMap[icon] || iconMap['chart-bar']);

	// Format value for display
	const formattedValue = $derived(
		typeof value === 'number' && value >= 1000 ? `${(value / 1000).toFixed(1)}k` : value
	);

	// Change color classes
	const changeColorClass = $derived(
		changeType === 'positive'
			? 'text-green-600 dark:text-green-400'
			: changeType === 'negative'
				? 'text-red-600 dark:text-red-400'
				: 'text-gray-500 dark:text-gray-400'
	);
</script>

{#if href}
	<a
		{href}
		class="block bg-card border border-border rounded-lg p-6 shadow-sm hover:shadow-md transition-all duration-200 {className}"
	>
		<div class="flex items-center justify-between">
			<div class="flex-1">
				<p class="text-sm font-medium text-muted-foreground mb-1">
					{title}
				</p>
				<div class="flex items-baseline">
					<p class="text-2xl font-bold text-foreground">
						{formattedValue}
					</p>
					{#if change !== null}
						<span class="ml-2 text-sm font-medium {changeColorClass}">
							{typeof change === 'number' && change > 0 ? '+' : ''}{change}
							{typeof change === 'number' ? '%' : ''}
						</span>
					{/if}
				</div>
			</div>
			<div class="flex-shrink-0">
				<div class="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
					<svg
						class="w-6 h-6 text-blue-600 dark:text-blue-400"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d={iconPath}
						></path>
					</svg>
				</div>
			</div>
		</div>
	</a>
{:else}
	<div class="bg-card border border-border rounded-lg p-6 shadow-sm {className}">
		<div class="flex items-center justify-between">
			<div class="flex-1">
				<p class="text-sm font-medium text-muted-foreground mb-1">
					{title}
				</p>
				<div class="flex items-baseline">
					<p class="text-2xl font-bold text-foreground">
						{formattedValue}
					</p>
					{#if change !== null}
						<span class="ml-2 text-sm font-medium {changeColorClass}">
							{typeof change === 'number' && change > 0 ? '+' : ''}{change}
							{typeof change === 'number' ? '%' : ''}
						</span>
					{/if}
				</div>
			</div>
			<div class="flex-shrink-0">
				<div class="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
					<svg
						class="w-6 h-6 text-blue-600 dark:text-blue-400"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d={iconPath}
						></path>
					</svg>
				</div>
			</div>
		</div>
	</div>
{/if}

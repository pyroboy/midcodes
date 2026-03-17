<script lang="ts">
	type Announcement = {
		id: number;
		message: string;
		linkUrl: string | null;
		linkText: string | null;
		isActive: boolean;
	};

	let { announcements }: { announcements: Announcement[] } = $props();

	let dismissed = $state(false);

	let activeAnnouncement = $derived(announcements.length > 0 ? announcements[0] : null);
</script>

{#if activeAnnouncement && !dismissed}
	<div class="announcement-banner">
		<div class="banner-content">
			<p class="banner-message">
				{activeAnnouncement.message}
				{#if activeAnnouncement.linkUrl}
					<a href={activeAnnouncement.linkUrl} class="banner-link">
						{activeAnnouncement.linkText ?? 'Learn More'}
					</a>
				{/if}
			</p>
			<button
				class="banner-close"
				onclick={() => { dismissed = true; }}
				aria-label="Dismiss announcement"
			>
				&times;
			</button>
		</div>
	</div>
{/if}

<style>
	.announcement-banner {
		background: #981B1E;
		color: white;
		font-family: 'Montserrat', sans-serif;
		font-size: 0.875rem;
		line-height: 1.4;
	}

	.banner-content {
		max-width: 1200px;
		margin: 0 auto;
		padding: 0.625rem 2rem;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 1rem;
	}

	.banner-message {
		margin: 0;
		text-align: center;
	}

	.banner-link {
		color: white;
		font-weight: 600;
		text-decoration: underline;
		text-underline-offset: 2px;
		margin-left: 0.5rem;
		white-space: nowrap;
	}

	.banner-link:hover {
		opacity: 0.9;
	}

	.banner-close {
		background: none;
		border: none;
		color: white;
		font-size: 1.25rem;
		cursor: pointer;
		padding: 0 0.25rem;
		line-height: 1;
		opacity: 0.8;
		transition: opacity 0.2s ease;
		flex-shrink: 0;
	}

	.banner-close:hover {
		opacity: 1;
	}
</style>

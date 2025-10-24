<script lang="ts">
	/**
	 * BottomActionBar - Mobile-only fixed action bar
	 * Displays at the bottom of the screen on mobile devices (hidden on desktop)
	 * Provides quick access to primary actions
	 */

	let { children } = $props();
</script>

<!-- Mobile-only bottom action bar with safe area padding for iOS -->
<div
	class="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-white/95 backdrop-blur-md border-t border-slate-200/80 shadow-lg"
	style="padding-bottom: env(safe-area-inset-bottom);"
>
	<div class="px-4 py-3">
		<div class="flex items-center justify-around gap-2">
			{@render children()}
		</div>
	</div>
</div>

<!-- Spacer to prevent content from being hidden behind the fixed bar -->
<div class="h-16 md:hidden" aria-hidden="true"></div>

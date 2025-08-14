<script lang="ts">
	import { featureFlags } from '$lib/stores/featureFlags';
	import { Button } from '$lib/components/ui/button';
	import { Shield } from 'lucide-svelte';
</script>

<!-- Development tool for testing the security deposit indicator -->
<div class="fixed bottom-4 right-4 z-50 bg-white p-4 border border-slate-200 rounded-lg shadow-lg">
	<div class="flex items-center gap-2 mb-2">
		<Shield class="w-4 h-4" />
		<span class="text-sm font-medium">Feature Flags</span>
	</div>
	
	<div class="flex items-center gap-2">
		<input 
			type="checkbox" 
			id="security-deposit-indicator" 
			bind:checked={$featureFlags.showSecurityDepositIndicator}
			class="rounded"
		/>
		<label for="security-deposit-indicator" class="text-xs">
			Show Security Deposit Indicator
		</label>
	</div>
	
	<div class="text-xs text-slate-500 mt-1">
		Status: {$featureFlags.showSecurityDepositIndicator ? 'Enabled' : 'Disabled'}
	</div>
</div>
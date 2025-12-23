<script lang="ts">
	import { page } from '$app/stores';
	import { ArrowLeft, CreditCard, ShieldAlert } from 'lucide-svelte';
</script>

<div class="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
	<div class="max-w-md w-full bg-white rounded-xl shadow-lg overflow-hidden border border-slate-100">
		<div class="p-8 text-center">
			{#if $page.error?.message === 'Profile not active'}
				<!-- Scenario: QR Code scanned for an ID that exists but isn't claimed/active yet -->
				<div class="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
					<CreditCard class="w-8 h-8 text-blue-600" />
				</div>
				<h1 class="text-2xl font-bold text-slate-900 mb-2">Profile Not Active</h1>
				<p class="text-slate-600 mb-8 leading-relaxed">
					This digital ID has been created but hasn't been activated by the cardholder yet.
				</p>
			{:else}
				<!-- Scenario: Invalid Slug or Generic 404 -->
				<div class="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
					<ShieldAlert class="w-8 h-8 text-red-600" />
				</div>
				<h1 class="text-2xl font-bold text-slate-900 mb-2">ID Not Found</h1>
				<p class="text-slate-600 mb-8 leading-relaxed">
					We couldn't find a digital profile associated with this link. It may have been removed or the URL is incorrect.
				</p>
			{/if}

			<div class="flex flex-col gap-3">
				<a
					href="/"
					class="inline-flex items-center justify-center gap-2 px-4 py-3 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors font-medium"
				>
					<ArrowLeft size={18} />
					Return Home
				</a>
			</div>
		</div>
		
		<div class="bg-slate-50 px-8 py-4 border-t border-slate-100 text-center">
			<p class="text-xs text-slate-400">
				Secure Digital ID System
			</p>
		</div>
	</div>
</div>

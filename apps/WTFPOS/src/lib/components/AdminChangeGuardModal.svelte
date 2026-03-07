<script lang="ts">
	import { cn } from '$lib/utils';
	import {
		CRITICAL_ACTIONS,
		getActiveServiceInfo,
		verifyManagerPin,
		type CriticalActionId
	} from '$lib/stores/admin-guard.svelte';
	import { ShieldAlert, TriangleAlert } from 'lucide-svelte';

	interface Props {
		action: CriticalActionId;
		locationId: string;
		locationName?: string;
		onConfirm: () => void;
		onCancel: () => void;
	}

	let { action, locationId, locationName = locationId, onConfirm, onCancel }: Props = $props();

	const meta = $derived(CRITICAL_ACTIONS[action]);
	const service = $derived(getActiveServiceInfo(locationId));

	let pin = $state('');
	let pinError = $state(false);

	function handleConfirm() {
		if (!verifyManagerPin(pin)) {
			pinError = true;
			pin = '';
			return;
		}
		onConfirm();
	}

	function handlePinInput(e: Event) {
		pinError = false;
		pin = (e.target as HTMLInputElement).value;
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter') handleConfirm();
		if (e.key === 'Escape') onCancel();
	}
</script>

<!-- Backdrop -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
	class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
	onkeydown={handleKeydown}
>
	<div class="w-[460px] rounded-2xl border border-border bg-white shadow-2xl">
		<!-- Header -->
		<div
			class={cn(
				'flex items-start gap-3 rounded-t-2xl p-5',
				meta.risk === 'critical' ? 'bg-red-50' : 'bg-amber-50'
			)}
		>
			<div
				class={cn(
					'mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full',
					meta.risk === 'critical'
						? 'bg-status-red/10 text-status-red'
						: 'bg-status-yellow/10 text-status-yellow'
				)}
			>
				{#if meta.risk === 'critical'}
					<ShieldAlert size={18} />
				{:else}
					<TriangleAlert size={18} />
				{/if}
			</div>
			<div>
				<p
					class={cn(
						'text-xs font-semibold uppercase tracking-wide',
						meta.risk === 'critical' ? 'text-status-red' : 'text-status-yellow'
					)}
				>
					{meta.risk === 'critical' ? 'Critical Action' : 'Service Warning'}
				</p>
				<h2 class="text-base font-bold text-gray-900">{meta.label}</h2>
			</div>
		</div>

		<div class="flex flex-col gap-4 p-5">
			<!-- Risk description -->
			<p class="text-sm leading-relaxed text-gray-600">{meta.description}</p>

			<!-- Active order count banner -->
			{#if service.isActive}
				<div class="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
					<p class="text-sm font-semibold text-amber-800">
						{locationName} currently has active service:
					</p>
					<ul class="mt-1 text-sm text-amber-700">
						{#if service.openCount > 0}
							<li>• {service.openCount} open {service.openCount === 1 ? 'order' : 'orders'}</li>
						{/if}
						{#if service.pendingCount > 0}
							<li>
								• {service.pendingCount}
								{service.pendingCount === 1 ? 'order' : 'orders'} pending payment
							</li>
						{/if}
					</ul>
				</div>
			{/if}

			<!-- Manager PIN override -->
			<div class="flex flex-col gap-1.5">
				<label for="manager-pin" class="text-xs font-semibold uppercase tracking-wide text-gray-500">
					Manager PIN — required to proceed
				</label>
				<!-- svelte-ignore a11y_autofocus -->
				<input
					id="manager-pin"
					type="password"
					inputmode="numeric"
					maxlength={4}
					placeholder="Enter PIN"
					value={pin}
					oninput={handlePinInput}
					class={cn(
						'pos-input font-mono tracking-widest',
						pinError && 'border-status-red ring-1 ring-status-red'
					)}
					autofocus
				/>
				{#if pinError}
					<p class="text-xs text-status-red">Incorrect PIN. Try again.</p>
				{/if}
			</div>

			<!-- Actions -->
			<div class="flex gap-2 pt-1">
				<button onclick={onCancel} class="btn-secondary flex-1"> Cancel </button>
				<button
					onclick={handleConfirm}
					class={cn('flex-1', meta.risk === 'critical' ? 'btn-danger' : 'btn-primary')}
				>
					Override & Proceed
				</button>
			</div>
		</div>
	</div>
</div>

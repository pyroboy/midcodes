<script lang="ts">
	import {
		generateVouchers,
		CHARACTER_SETS,
		PRESETS,
		type VoucherConfig,
		type GenerationResult
	} from '$lib/generator';

	// ─── Form state ──────────────────────────────────────
	let hotspot = $state('');
	let prefix = $state('');
	let quantity = $state(10);
	let codeLength = $state(6);
	let charSetId = $state(1);
	let userMode = $state<'username_password' | 'username_only'>('username_password');
	let withQR = $state(true);
	let voucherDuration = $state('1h');
	let voucherValidity = $state('');
	let profile = $state('');
	let server = $state('hotspot1');
	let timeLimit = $state('01:00:00');
	let dataLimit = $state('');

	// ─── Output state ────────────────────────────────────
	let result = $state<GenerationResult | null>(null);
	let activeTab = $state<'vouchers' | 'script'>('vouchers');
	let copied = $state(false);

	// ─── Preset loader ───────────────────────────────────
	function loadPreset(idx: number) {
		const p = PRESETS[idx];
		hotspot = p.hotspot;
		prefix = p.prefix;
		profile = p.profile;
		server = p.server;
	}

	// ─── Generate ────────────────────────────────────────
	function handleGenerate() {
		const config: VoucherConfig = {
			hotspot, prefix, quantity, codeLength, charSetId,
			userMode, withQR, voucherDuration, voucherValidity,
			profile, server, timeLimit, dataLimit
		};
		result = generateVouchers(config);
	}

	// ─── Copy script to clipboard ────────────────────────
	async function copyScript() {
		if (!result) return;
		await navigator.clipboard.writeText(result.fullScript);
		copied = true;
		setTimeout(() => (copied = false), 2000);
	}

	// ─── Print vouchers ─────────────────────────────────
	function printVouchers() {
		const printWindow = window.open('', '_blank');
		if (!printWindow || !result) return;
		const voucherCards = result.vouchers.map((v) => {
			const qrHtml = v.qrUrl
				? `<td rowspan="3" style="vertical-align:top;padding:4px"><img src="${v.qrUrl}" width="70" height="70"/></td>`
				: '';
			const qrColspan = v.qrUrl ? '2' : '3';
			return `
			<table class="voucher">
				<tbody>
					<tr>
						<td class="sidebar" rowspan="4"><div>${voucherDuration} ${codeLength}</div></td>
						<td style="font-weight:bold" colspan="${qrColspan}">${hotspot}</td>
						${qrHtml}
					</tr>
					<tr><td style="font-weight:bold;font-size:16px;text-align:center;padding:6px 4px">${v.code}</td></tr>
					<tr><td style="font-size:10px">Duration: ${voucherDuration} | Limit: ${timeLimit}</td></tr>
					<tr><td colspan="3" style="font-size:10px">Login: http://<b>${server}</b></td></tr>
				</tbody>
			</table>`;
		}).join('\n');

		printWindow.document.write(`<!DOCTYPE html><html><head><style>
			body { font-family: Helvetica, Arial, sans-serif; font-size: 14px; margin: 0; color: #000; -webkit-print-color-adjust: exact; }
			table.voucher { display: inline-block; border: 2px solid #000; margin: 3px; width: ${withQR ? '230' : '170'}px; }
			table.voucher td { padding: 2px 6px; }
			.sidebar { font-weight: bold; border-right: 2px dashed #000; writing-mode: vertical-rl; text-align: center; padding: 4px; background: #e2e8f0; }
			@page { margin: 3mm; }
			@media print { table { page-break-after: auto; } tr { page-break-inside: avoid; } }
		</style></head><body>${voucherCards}<script>window.onload=()=>window.print()<\/script></body></html>`);
		printWindow.document.close();
	}
</script>

<svelte:head>
	<title>Voucher Generator — MikroTik Hotspot</title>
</svelte:head>

<div class="min-h-screen bg-gray-900 text-white">
	<!-- Header -->
	<header class="bg-gray-800 border-b border-gray-700 px-6 py-4">
		<h1 class="text-2xl font-bold text-emerald-400">Voucher Generator</h1>
		<p class="text-sm text-gray-400">MikroTik Hotspot Code Generator</p>
	</header>

	<main class="max-w-6xl mx-auto p-6">
		<div class="flex flex-col lg:flex-row gap-6">

			<!-- ─── LEFT: Config Form ─────────────────── -->
			<div class="lg:w-1/2 space-y-4">

				<!-- Presets -->
				<div class="bg-gray-800 rounded-xl p-4">
					<label class="block text-sm text-gray-400 mb-2">Quick Presets</label>
					<div class="flex flex-wrap gap-2">
						{#each PRESETS as preset, i}
							<button onclick={() => loadPreset(i)}
								class="px-3 py-1.5 text-xs bg-gray-700 rounded-lg hover:bg-gray-600 transition">
								{preset.name}
							</button>
						{/each}
					</div>
				</div>

				<!-- Main form -->
				<div class="bg-gray-800 rounded-xl p-5 space-y-3">
					<div class="grid grid-cols-2 gap-3">
						<div>
							<label class="block text-xs text-gray-400 mb-1">Hotspot Name</label>
							<input bind:value={hotspot} placeholder="e.g. Mama Maly's"
								class="w-full px-3 py-2 bg-gray-700 rounded-lg border border-gray-600 text-sm focus:border-emerald-500 focus:outline-none" />
						</div>
						<div>
							<label class="block text-xs text-gray-400 mb-1">Prefix</label>
							<input bind:value={prefix} placeholder="e.g. malys-"
								class="w-full px-3 py-2 bg-gray-700 rounded-lg border border-gray-600 text-sm focus:border-emerald-500 focus:outline-none" />
						</div>
						<div>
							<label class="block text-xs text-gray-400 mb-1">Quantity</label>
							<input type="number" bind:value={quantity} min="1" max="1000"
								class="w-full px-3 py-2 bg-gray-700 rounded-lg border border-gray-600 text-sm focus:border-emerald-500 focus:outline-none" />
						</div>
						<div>
							<label class="block text-xs text-gray-400 mb-1">Code Length</label>
							<input type="number" bind:value={codeLength} min="3" max="20"
								class="w-full px-3 py-2 bg-gray-700 rounded-lg border border-gray-600 text-sm focus:border-emerald-500 focus:outline-none" />
						</div>
					</div>

					<div>
						<label class="block text-xs text-gray-400 mb-1">Character Set</label>
						<select bind:value={charSetId}
							class="w-full px-3 py-2 bg-gray-700 rounded-lg border border-gray-600 text-sm focus:border-emerald-500 focus:outline-none">
							{#each CHARACTER_SETS as cs}
								<option value={cs.id}>{cs.id} — {cs.label}</option>
							{/each}
						</select>
					</div>

					<div class="flex gap-4 items-center">
						<label class="flex items-center gap-2 text-sm cursor-pointer">
							<input type="radio" bind:group={userMode} value="username_password" class="accent-emerald-500" />
							Username = Password
						</label>
						<label class="flex items-center gap-2 text-sm cursor-pointer">
							<input type="radio" bind:group={userMode} value="username_only" class="accent-emerald-500" />
							Username only
						</label>
					</div>

					<label class="flex items-center gap-2 text-sm cursor-pointer">
						<input type="checkbox" bind:checked={withQR} class="accent-emerald-500" />
						Include QR Code
					</label>
				</div>

				<!-- MikroTik config -->
				<div class="bg-gray-800 rounded-xl p-5 space-y-3">
					<p class="text-sm font-medium text-gray-300">MikroTik Config</p>
					<div class="grid grid-cols-2 gap-3">
						<div>
							<label class="block text-xs text-gray-400 mb-1">Profile</label>
							<input bind:value={profile} placeholder="Customer"
								class="w-full px-3 py-2 bg-gray-700 rounded-lg border border-gray-600 text-sm focus:border-emerald-500 focus:outline-none" />
						</div>
						<div>
							<label class="block text-xs text-gray-400 mb-1">Server</label>
							<input bind:value={server} placeholder="hotspot1"
								class="w-full px-3 py-2 bg-gray-700 rounded-lg border border-gray-600 text-sm focus:border-emerald-500 focus:outline-none" />
						</div>
						<div>
							<label class="block text-xs text-gray-400 mb-1">Voucher Duration</label>
							<input bind:value={voucherDuration} placeholder="1h / 30min / 1d"
								class="w-full px-3 py-2 bg-gray-700 rounded-lg border border-gray-600 text-sm focus:border-emerald-500 focus:outline-none" />
						</div>
						<div>
							<label class="block text-xs text-gray-400 mb-1">Voucher Validity</label>
							<input bind:value={voucherValidity} placeholder="color or label"
								class="w-full px-3 py-2 bg-gray-700 rounded-lg border border-gray-600 text-sm focus:border-emerald-500 focus:outline-none" />
						</div>
						<div>
							<label class="block text-xs text-gray-400 mb-1">Time Limit (uptime)</label>
							<input bind:value={timeLimit} placeholder="01:00:00"
								class="w-full px-3 py-2 bg-gray-700 rounded-lg border border-gray-600 text-sm focus:border-emerald-500 focus:outline-none" />
						</div>
						<div>
							<label class="block text-xs text-gray-400 mb-1">Data Limit (bytes)</label>
							<input bind:value={dataLimit} placeholder="optional"
								class="w-full px-3 py-2 bg-gray-700 rounded-lg border border-gray-600 text-sm focus:border-emerald-500 focus:outline-none" />
						</div>
					</div>
				</div>

				<button onclick={handleGenerate}
					class="w-full py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition font-bold text-lg">
					Generate {quantity} Vouchers
				</button>
			</div>

			<!-- ─── RIGHT: Output ─────────────────────── -->
			<div class="lg:w-1/2">
				{#if result}
					<!-- Tabs -->
					<div class="flex gap-2 mb-4">
						<button onclick={() => activeTab = 'vouchers'}
							class="px-4 py-2 rounded-lg font-medium transition {activeTab === 'vouchers' ? 'bg-emerald-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'}">
							Vouchers ({result.vouchers.length})
						</button>
						<button onclick={() => activeTab = 'script'}
							class="px-4 py-2 rounded-lg font-medium transition {activeTab === 'script' ? 'bg-emerald-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'}">
							MikroTik Script
						</button>
					</div>

					{#if activeTab === 'vouchers'}
						<div class="flex gap-2 mb-4">
							<button onclick={printVouchers}
								class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium">
								Print Vouchers
							</button>
						</div>
						<div class="grid grid-cols-2 gap-2 max-h-[70vh] overflow-y-auto pr-1">
							{#each result.vouchers as v, i}
								<div class="bg-gray-800 border border-gray-700 rounded-lg p-3 text-center">
									<p class="text-xs text-gray-500 mb-1">#{i + 1}</p>
									<p class="text-lg font-bold font-mono text-emerald-400 break-all">{v.code}</p>
									<p class="text-xs text-gray-500 mt-1">{voucherDuration} | {profile}</p>
									{#if v.qrUrl}
										<img src={v.qrUrl} alt="QR" class="w-16 h-16 mx-auto mt-2 rounded" />
									{/if}
								</div>
							{/each}
						</div>

					{:else}
						<div class="flex gap-2 mb-4">
							<button onclick={copyScript}
								class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium">
								{copied ? 'Copied!' : 'Copy to Clipboard'}
							</button>
						</div>
						<pre class="bg-gray-800 border border-gray-700 rounded-xl p-4 text-xs font-mono text-green-400 overflow-auto max-h-[70vh] whitespace-pre-wrap">{result.fullScript}</pre>
					{/if}
				{:else}
					<div class="bg-gray-800 rounded-xl p-12 text-center">
						<p class="text-gray-500 text-lg">Configure and hit Generate</p>
						<p class="text-gray-600 text-sm mt-2">Voucher codes, MikroTik script, and printable cards will appear here</p>
					</div>
				{/if}
			</div>
		</div>
	</main>
</div>

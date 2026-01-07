<script lang="ts">
	import ExecutiveSummary from '../docs/business-plan/01-executive-summary/+page.svelte';
	import CompanyProfile from '../docs/business-plan/02-company-profile/+page.svelte';
	import PropertyOverview from '../docs/business-plan/03-property-overview/+page.svelte';
	import MarketAnalysis from '../docs/business-plan/04-market-analysis/+page.svelte';
	import ServicesAmenities from '../docs/business-plan/05-services-amenities/+page.svelte';
	import Operations from '../docs/business-plan/06-operations/+page.svelte';
	import Organization from '../docs/business-plan/07-organization/+page.svelte';
	import Financials from '../docs/business-plan/08-financials/+page.svelte';
	import Marketing from '../docs/business-plan/09-marketing/+page.svelte';
	import RiskManagement from '../docs/business-plan/10-risk-management/+page.svelte';
	import GrowthStrategy from '../docs/business-plan/11-growth-strategy/+page.svelte';
	import Appendices from '../docs/business-plan/12-appendices/+page.svelte';
	import Logs from '../docs/business-plan/13-printable-logs/+page.svelte';
	import Inventory from '../docs/business-plan/14-inventory-assets/+page.svelte';
	import Checklists from '../docs/business-plan/15-daily-checklists/+page.svelte';
	import Contingency from '../docs/business-plan/16-contingency-emergency/+page.svelte';
	import Complaints from '../docs/business-plan/17-complaint-handling/+page.svelte';
	import AppSpecs from '../docs/business-plan/18-app-specification/+page.svelte';
</script>

<svelte:head>
	<title>Full Business Plan - Print View</title>
</svelte:head>

<div class="print-container">
	<div class="print-controls">
		<button onclick={()=> window.print()} class="print-btn">🖨️ Print to PDF</button>
		<p class="hint">Tip: Enable "Background graphics" in print settings</p>
	</div>

	<div class="chapter-wrapper">
		<ExecutiveSummary />
	</div>
	<div class="chapter-wrapper">
		<CompanyProfile />
	</div>
	<div class="chapter-wrapper">
		<PropertyOverview />
	</div>
	<div class="chapter-wrapper">
		<MarketAnalysis />
	</div>
	<div class="chapter-wrapper">
		<ServicesAmenities />
	</div>
	<div class="chapter-wrapper">
		<Operations />
	</div>
	<div class="chapter-wrapper">
		<Organization />
	</div>
	<div class="chapter-wrapper">
		<Financials />
	</div>
	<div class="chapter-wrapper">
		<Marketing />
	</div>
	<div class="chapter-wrapper">
		<RiskManagement />
	</div>
	<div class="chapter-wrapper">
		<GrowthStrategy />
	</div>
	<div class="chapter-wrapper">
		<Appendices />
	</div>
	<div class="chapter-wrapper">
		<Logs />
	</div>
	<div class="chapter-wrapper">
		<Inventory />
	</div>
	<div class="chapter-wrapper">
		<Checklists />
	</div>
	<div class="chapter-wrapper">
		<Contingency />
	</div>
	<div class="chapter-wrapper">
		<Complaints />
	</div>
	<div class="chapter-wrapper">
		<AppSpecs />
	</div>
</div>

<style>
	.print-container {
		max-width: 900px;
		margin: 0 auto;
		background: white;
		min-height: 100vh;
	}

	.print-controls {
		padding: 2rem;
		background: var(--color-gray-100);
		text-align: center;
		border-bottom: 2px solid var(--color-black);
	}

	.print-btn {
		background: var(--color-black);
		color: white;
		border: none;
		padding: 1rem 2rem;
		font-family: var(--font-header);
		font-size: 1.25rem;
		cursor: pointer;
		font-weight: 700;
		text-transform: uppercase;
	}

	.print-btn:hover {
		opacity: 0.9;
	}

	.hint {
		margin-top: 1rem;
		color: #71717a;
		font-size: 0.9rem;
	}

	.chapter-wrapper {
		padding: 4rem;
		border-bottom: 1px dashed var(--color-gray-200);
		page-break-after: always;
	}
	
	/* Reset generic chapter width constraints for print page */
	:global(.chapter) {
		max-width: 100% !important;
	}

	@media print {
		.print-controls {
			display: none;
		}
		
		.print-container {
			width: 100%;
			max-width: none;
			margin: 0;
		}

		.chapter-wrapper {
			padding: 0;
			margin: 0;
			border: none;
		}

		:global(body) {
			background: white;
		}
	}
</style>

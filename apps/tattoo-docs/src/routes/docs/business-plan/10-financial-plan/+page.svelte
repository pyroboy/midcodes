<script>
    let rent = $state(15000);
    let utilities = $state(3000);
    let supplies = $state(5000);
    let marketing = $state(2000);
    let avgTattooPrice = $state(3500);
    
    let totalOpex = $derived(rent + utilities + supplies + marketing);
    let breakEvenTattoos = $derived(Math.ceil(totalOpex / avgTattooPrice));
</script>

<svelte:head>
	<title>FINANCIAL PLAN | Tattoo Studio</title>
</svelte:head>

<section class="doc-page">

	<header class="doc-header">
		<h1>10 Financial<br><span class="highlight">Plan</span></h1>
	</header>

	<article class="content">
		<h2>10.1 Startup Costs (CAPEX)</h2>
        <div class="table-container">
            <table>
                <thead>
                    <tr>
                        <th>Item</th>
                        <th>Estimated Cost</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>Studio Renovation & Furniture</td>
                        <td>₱50,000</td>
                    </tr>
                    <tr>
                        <td>Tattoo Equipment (Machines, Power Supply)</td>
                        <td>₱40,000</td>
                    </tr>
                    <tr>
                        <td>Initial Supplies (Inks, Needles, Medical)</td>
                        <td>₱20,000</td>
                    </tr>
                    <tr>
                        <td>Permits & Licensing</td>
                        <td>₱10,000</td>
                    </tr>
                    <tr>
                        <td>Marketing (Logo, Website, Ads)</td>
                        <td>₱10,000</td>
                    </tr>
                    <tr class="total-row">
                        <td>TOTAL STARTUP</td>
                        <td>₱130,000</td>
                    </tr>
                </tbody>
            </table>
        </div>
        <div class="divider"></div>

        <h2>10.2 Monthly Estimator (OPEX)</h2>
        <div class="calculator-box">
            <div class="inputs">
                <div class="input-group">
                    <label>Rent</label>
                    <input type="number" bind:value={rent}>
                </div>
                <div class="input-group">
                    <label>Utilities</label>
                    <input type="number" bind:value={utilities}>
                </div>
                <div class="input-group">
                    <label>Supplies Restock</label>
                    <input type="number" bind:value={supplies}>
                </div>
                <div class="input-group">
                    <label>Marketing</label>
                    <input type="number" bind:value={marketing}>
                </div>
                <div class="input-group highlight">
                    <label>Avg Tattoo Price</label>
                    <input type="number" bind:value={avgTattooPrice}>
                </div>
            </div>
            
            <div class="results">
                <div class="res-item">
                    <span>Total Monthly Costs</span>
                    <strong>₱{totalOpex.toLocaleString()}</strong>
                </div>
                <div class="res-item big">
                    <span>Tattoos to Break Even</span>
                    <strong>{breakEvenTattoos}</strong>
                    <small>clients per month</small>
                </div>
            </div>
        </div>
        <div class="divider"></div>

		<h2>10.3 Pricing Strategy</h2>
        <p>
            We adhere to a <strong>value-based pricing model</strong>. While we have a minimum shop charge (e.g., ₱2,500) to cover setup and sterilization costs, larger pieces are quoted by the piece or by the session (half-day/full-day) rather than strictly hourly, incentivizing efficiency.
        </p>
	</article>
</section>

<style>
    .doc-page {
        max-width: 900px;
        margin: 0 auto;
        padding: 4rem 2rem;
    }

    .doc-header h1 {
        font-size: 5rem;
        line-height: 0.9;
        margin-bottom: 4rem;
    }
    .highlight { color: var(--color-white); background: var(--color-black); padding: 0 1rem; }
    @media(max-width:600px) { .doc-header h1 { font-size: 3.5rem; }}

    h2 {
        border-left: 6px solid var(--color-black);
        padding-left: 1rem;
        margin-bottom: 1.5rem;
    }
    
    p { 
        font-size: 1.1rem; 
        line-height: 1.6; 
        margin-bottom: 1.5rem; 
        color: #3f3f46;
    }

    .divider {
        height: 2px;
        background: var(--color-gray-200);
        margin: 3rem 0;
    }

    .table-container { overflow-x: auto; margin-bottom: 2rem; }
    table { width: 100%; border-collapse: collapse; min-width: 500px; }
    th { background: var(--color-black); color: white; text-align: left; padding: 1rem; text-transform: uppercase; font-family: var(--font-header); font-weight: 400; }
    td { padding: 1rem; border-bottom: 1px solid var(--color-gray-300); }
    .total-row td { background: var(--color-gray-200); font-weight: 700; border-top: 2px solid var(--color-black); }

    /* CALCULATOR */
    .calculator-box {
        background: white;
        border: 2px solid var(--color-black);
        padding: 2rem;
        display: grid;
        grid-template-columns: 1.5fr 1fr;
        gap: 2rem;
        box-shadow: 8px 8px 0px var(--color-gray-500);
    }
    @media(max-width: 700px) { .calculator-box { grid-template-columns: 1fr; }}

    .inputs { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
    .input-group { display: flex; flex-direction: column; }
    .input-group.highlight input { background: #fef9c3; border-color: #eab308; }
    .input-group label {
        font-size: 0.8rem;
        text-transform: uppercase;
        font-weight: 700;
        margin-bottom: 0.25rem;
        color: var(--color-gray-500);
    }
    input {
        padding: 0.5rem;
        border: 1px solid var(--color-gray-300);
        font-family: var(--font-body);
        font-size: 1rem;
    }

    .results {
        display: flex;
        flex-direction: column;
        justify-content: center;
        background: var(--color-gray-100);
        padding: 1.5rem;
        border: 1px dashed var(--color-gray-400);
    }
    .res-item { display: flex; flex-direction: column; margin-bottom: 1.5rem; }
    .res-item span { font-size: 0.9rem; text-transform: uppercase; color: var(--color-gray-600); }
    .res-item strong { font-size: 1.5rem; font-family: var(--font-header); font-weight: 400; color: var(--color-black); }
    
    .res-item.big strong { font-size: 3rem; line-height: 1; color: var(--color-black); }
    .res-item.big small { font-size: 0.9rem; color: var(--color-gray-500); }
</style>

<svelte:head>
	<title>EQUIPMENT & SUPPLIES | Tattoo Studio</title>
</svelte:head>

<section class="doc-page">

	<header class="doc-header">
		<h1>13 Equipment<br><span class="highlight">& Supplies</span></h1>
	</header>

	<article class="content">
		<h2>13.1 Core Machinery</h2>
        <div class="equipment-grid">
            <div class="eq-item">
                <span class="cat">Machines</span>
                <strong>Wireless Pen Rotaries</strong>
                <p>Primary: [Brand Model]<br>Backup: [Brand Model]</p>
            </div>
            <div class="eq-item">
                <span class="cat">Power</span>
                <strong>Battery Packs</strong>
                <p>Critical Connect / RCA Packs</p>
            </div>
            <div class="eq-item">
                <span class="cat">Furniture</span>
                <strong>Client Chair</strong>
                <p>Hydraulic adjustable tattoo bed</p>
            </div>
             <div class="eq-item">
                <span class="cat">Furniture</span>
                <strong>Artist Stool</strong>
                <p>Ergonomic saddle stool</p>
            </div>
        </div>
        <div class="divider"></div>

		<h2>13.2 Consumables Inventory</h2>
        <div class="checklist-box">
            <h3>Weekly Restock Check</h3>
            <ul class="checklist">
                <li><span class="check">Needles</span> Cartridges (Liners: 3RL, 5RL, 7RL | Shaders: 9CM, 15CM)</li>
                <li><span class="check">Ink</span> Dynamic Black, Color Sets, Shading Greywash</li>
                <li><span class="check">Medical</span> Gloves (Nitrile), Alcohol (70%), Green Soap, Distilled Water</li>
                <li><span class="check">Barriers</span> Clip cord covers, machine bags, bottle bags, barrier film</li>
                <li><span class="check">Paper</span> Paper towels, stencil paper</li>
                <li><span class="check">Aftercare</span> Ointment sachets, Second Skin/Derm Shield</li>
            </ul>
        </div>
        <div class="divider"></div>

        <h2>13.3 Trusted Suppliers</h2>
        <ul class="simple-list">
			<li><strong>[Supplier Name A]:</strong> Main source for cartridges and inks.</li>
			<li><strong>[Supplier Name B]:</strong> Medical supplies and sanitation.</li>
			<li><strong>Lazada/Shopee Official Stores:</strong> For general paper products and office supplies.</li>
		</ul>
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

    .equipment-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
        gap: 1.5rem;
        margin-bottom: 2rem;
    }
    .eq-item {
        background: white;
        border: 2px solid var(--color-black);
        padding: 1.5rem;
    }
    .cat { display: block; font-size: 0.75rem; text-transform: uppercase; color: var(--color-gray-500); font-weight: 700; margin-bottom: 0.5rem; }
    .eq-item strong { display: block; font-size: 1.2rem; margin-bottom: 0.5rem; font-family: var(--font-header); font-weight: 400; }
    .eq-item p { font-size: 0.95rem; margin: 0; color: #52525b; line-height: 1.4; }

    .checklist-box {
        background: var(--color-gray-100);
        padding: 2rem;
        border: 1px solid var(--color-gray-300);
    }
    .checklist-box h3 { font-size: 1.5rem; margin-bottom: 1rem; margin-top: 0; }
    .checklist { list-style: none; padding: 0; margin: 0; }
    .checklist li { 
        margin-bottom: 0.75rem; 
        font-size: 1.05rem; 
        display: flex;
        align-items: flex-start;
    }
    .check {
        font-size: 0.7rem;
        font-weight: 700;
        text-transform: uppercase;
        background: white;
        border: 1px solid var(--color-black);
        padding: 2px 6px;
        margin-right: 1rem;
        border-radius: 4px;
        min-width: 70px;
        text-align: center;
        margin-top: 3px;
    }

    .simple-list { margin-bottom: 1.5rem; padding-left: 1.5rem; }
    .simple-list li { margin-bottom: 0.75rem; font-size: 1.05rem; line-height: 1.5; }
</style>

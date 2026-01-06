<svelte:head>
	<title>Organization & HR | SILOG HUB</title>
</svelte:head>

<section class="doc-page">

	
	<header class="doc-header">
		<h1>07 Organization &<br><span class="highlight">Management</span></h1>
	</header>

	<article class="content">
		<h2>7.1 Organizational Structure</h2>
        <p>
            As a small-scale eatery, the business maintains a flat organizational structure to ensure efficiency and direct communication. The Owner acts as the manager, overseeing all daily operations.
        </p>
        
        <div class="highlight-box">
             <h3>Core Team Structure</h3>
             <ul>
                 <li><strong>Owner/Manager</strong>: Top-level management and operations.</li>
                 <li><strong>Head Cook</strong>: Kitchen leadership and food quality.</li>
                 <li><strong>Kitchen Helper</strong>: Support for food prep and cleaning.</li>
                 <li><strong>Service Staff</strong>: Customer service, cashiering, and serving.</li>
             </ul>
        </div>
        <div class="divider"></div>

		<h2>7.2 Key Roles & Responsibilities</h2>
        <div class="org-grid">
            <div class="org-card dark">
                <h4>Head Cook</h4>
                <p>Responsible for preparing all Silog meals, managing kitchen inventory, and maintaining hygiene standards.</p>
            </div>
            <div class="org-card">
                <h4>Kitchen Helper / Dishwasher</h4>
                <p>Assists in ingredient preparation, washes dishes, and ensures the kitchen area is clean.</p>
            </div>
            <div class="org-card">
                <h4>Cashier / Server</h4>
                <p>Handles customer orders and payments, serves food to tables, and maintains the cleanliness of the dining area.</p>
            </div>
        </div>
        <div class="divider"></div>

        <h2>7.3 HR Plan</h2>
        <p>
            This is a small store operation, so there is <strong>no dedicated HR department</strong>. The business owner directly manages all human resource functions, including hiring, scheduling, training, and payroll.
        </p>
        <div class="divider"></div>

        <h2>7.4 Compensation & Benefits</h2>
        <div class="highlight-box">
            <h3>Standard Package</h3>
            <ul>
                <li><strong>Salary:</strong> Employees are paid at the <strong>Minimum Wage Rate</strong> applicable to our region in the Philippines.</li>
                <li><strong>Government Benefits:</strong> Application of mandatory government contributions (SSS, PhilHealth, Pag-IBIG).</li>
                <li><strong>Schedule:</strong> 6-day work week with rotational shifts.</li>
            </ul>
        </div>

        <div class="highlight-box">
            <h3>Staff Meal Policy</h3>
            <p>Recommended approach: Don't let staff eat the "Winners" (High profit/expensive items like Tapa). It eats into your margins.</p>
            <ul class="simple-list">
                <li><strong>Allowance:</strong> One (1) free meal per shift.</li>
                <li><strong>Menu Restrictions:</strong> Staff may choose from the "Volume Drivers" or "Budget" list (e.g., Hotsilog, Burgersilog, Shanghai, Egg, or Mami).</li>
                <li><strong>Restricted Items:</strong> Premium items (Beef Tapa, Bangus, Sisig) are <strong>off-limits</strong> for free meals unless paid for at a 20% employee discount.</li>
                <li><strong>Recording:</strong> All staff meals must be punched/written in the daily log as "Officer Meals" to track inventory usage.</li>
            </ul>
        </div>

	</article>
</section>

<style>
    /* PAGE LAYOUT - Consistent with Exec Summary & Marketing */
    .doc-page {
        max-width: 900px;
        margin: 0 auto;
        padding: 4rem 2rem;
        background: white;
        min-height: 100vh;
        font-family: 'Inter', sans-serif;
        color: #334155;
    }



    /* HEADER */
    .doc-header h1 {
        font-size: 5rem;
        line-height: 0.9;
        margin-bottom: 4rem;
        color: #0f172a;
    }
    .highlight { color: white; background: #0f172a; padding: 0 1rem; }
    @media(max-width:600px) { .doc-header h1 { font-size: 3.5rem; }}

    /* CONTENT */
    h2 {
        border-left: 6px solid #0f172a;
        padding-left: 1rem;
        margin-bottom: 1.5rem;
        margin-top: 3rem;
        color: #1e293b;
        font-size: 1.5rem;
        font-weight: 700;
    }
    
    h3 { font-size: 1.25rem; font-weight: 700; margin-bottom: 1rem; color: #0f172a; }
    h4 { font-size: 1.1rem; margin-bottom: 0.5rem; text-transform: uppercase; font-weight: 700; }

    p { 
        font-size: 1.1rem; 
        line-height: 1.6; 
        margin-bottom: 1.5rem; 
        color: #3f3f46;
    }

    .divider {
        height: 2px;
        background: #e4e4e7;
        margin: 3rem 0;
    }

    /* BOXES & GRIDS */
    .highlight-box {
        border: 2px solid #0f172a;
        padding: 2rem;
        background: white;
        box-shadow: 6px 6px 0px #f97316; /* Orange shadow */
        margin: 2rem 0;
    }
    
    .org-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1rem; margin-bottom: 2rem; }
    .org-card { padding: 1.5rem; background: white; border: 1px solid #d4d4d8; }
    .org-card.dark { background: #0f172a; color: white; }
    .org-card.dark h4 { color: white; }
    .org-card.dark p { color: #cbd5e1; }
    .org-card p { font-size: 0.95rem; margin: 0; }

    ul, ol { margin-bottom: 1.5rem; list-style-position: inside; }
    li { margin-bottom: 0.5rem; font-size: 1.05rem; color: #334155; }
    .simple-list li { list-style: none; padding-left: 0; margin-bottom: 1rem; }
    .simple-list li strong { display: block; margin-bottom: 0.25rem; color: #0f172a; }
</style>

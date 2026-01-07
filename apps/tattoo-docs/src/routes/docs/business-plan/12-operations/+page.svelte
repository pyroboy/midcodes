<svelte:head>
	<title>OPERATIONS | Tattoo Studio</title>
</svelte:head>

<section class="doc-page">

	<header class="doc-header">
		<h1>12 Operations<br><span class="highlight">Manual</span></h1>
	</header>

	<article class="content">
		<h2>12.1 Daily Workflow</h2>
        <div class="timeline">
            <div class="time-slot">
                <span class="time">10:00 AM</span>
                <div class="activity">
                    <strong>Studio Prep</strong>
                    <p>Clean surfaces, set up station for first client, print stencils.</p>
                </div>
            </div>
            <div class="time-slot">
                <span class="time">11:00 AM</span>
                <div class="activity">
                    <strong>Client Session 1</strong>
                    <p>Consultation, stenciling, tattooing (3-4 hours).</p>
                </div>
            </div>
            <div class="time-slot">
                <span class="time">03:00 PM</span>
                <div class="activity">
                    <strong>Turnover & Lunch</strong>
                    <p>Full breakdown, sterilization, waste disposal, reset for next client.</p>
                </div>
            </div>
             <div class="time-slot">
                <span class="time">04:00 PM</span>
                <div class="activity">
                    <strong>Client Session 2</strong>
                    <p>Smaller appointments or consultations.</p>
                </div>
            </div>
             <div class="time-slot">
                <span class="time">07:00 PM</span>
                <div class="activity">
                    <strong>Closing & Admin</strong>
                    <p>Final clean, reply to messages/bookings, draw designs for next day.</p>
                </div>
            </div>
        </div>
        <div class="divider"></div>

		<h2>12.2 Appointment Management</h2>
        <p>All bookings are managed through [Tool Name, e.g., Calendly/Instagram DM].</p>
        <ul class="simple-list">
			<li><strong>Inquiry:</strong> Client sends idea + reference photos + placement + size.</li>
			<li><strong>Quote:</strong> Artist provides estimated price/time.</li>
			<li><strong>Deposit:</strong> Client pays deposit to lock date.</li>
			<li><strong>Confirmation:</strong> Artist confirms slot and sends pre-session instructions.</li>
		</ul>
        <div class="divider"></div>

        <h2>12.3 Aftercare Protocol</h2>
        <div class="highlight-box">
            <h3>Standard Instructions</h3>
            <ol>
                <li>Keep bandage on for [X] hours.</li>
                <li>Wash gently with unscented antibacterial soap.</li>
                <li>Pat dry with disposable paper towel.</li>
                <li>Apply thin layer of [Recommended Ointment/Lotion].</li>
                <li>Do not pick, scratch, or submerge in water (pool/beach).</li>
            </ol>
        </div>
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

    .timeline {
        border-left: 2px solid var(--color-black);
        padding-left: 2rem;
        margin-left: 1rem;
    }
    .time-slot {
        margin-bottom: 2rem;
        position: relative;
    }
    .time-slot:last-child { margin-bottom: 0; }
    .time-slot::before {
        content: '';
        position: absolute;
        left: -2.4rem;
        top: 0.5rem;
        width: 12px;
        height: 12px;
        background: var(--color-black);
        border-radius: 50%;
    }
    .time {
        font-size: 0.8rem;
        font-weight: 700;
        color: var(--color-gray-500);
        text-transform: uppercase;
        display: block;
        margin-bottom: 0.25rem;
    }
    .activity strong { display: block; font-size: 1.25rem; margin-bottom: 0.5rem; font-family: var(--font-header); font-weight: 400;}
    .activity p { margin: 0; font-size: 1rem; }

    .highlight-box {
        border: 2px solid var(--color-black);
        padding: 2rem;
        background: white;
        box-shadow: 6px 6px 0px var(--color-gray-400);
        margin: 2rem 0;
    }
    .highlight-box h3 { font-size: 1.5rem; margin-bottom: 1rem; }
    .highlight-box ol { margin: 0; padding-left: 1.25rem; }
    .highlight-box li { margin-bottom: 0.5rem; font-size: 1.05rem; }

    .simple-list { margin-bottom: 1.5rem; padding-left: 1.5rem; }
    .simple-list li { margin-bottom: 0.75rem; font-size: 1.05rem; line-height: 1.5; }
</style>

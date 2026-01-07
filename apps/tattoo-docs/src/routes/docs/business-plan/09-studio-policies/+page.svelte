<svelte:head>
	<title>STUDIO POLICIES | Tattoo Studio</title>
</svelte:head>

<section class="doc-page">

	<header class="doc-header">
		<h1>09 Studio<br><span class="highlight">Policies</span></h1>
	</header>

	<article class="content">
		<h2>9.1 Booking & Deposits</h2>
        <div class="policy-card">
            <p>
                <strong>Deposits are non-refundable.</strong> A deposit is required to secure an appointment slot. 
                This amount comes off the final price of the tattoo.
            </p>
        </div>
        <ul class="simple-list">
			<li><strong>Rescheduling:</strong> Must be done at least 48 hours in advance to transfer the deposit to a new date.</li>
			<li><strong>Cancellations:</strong> Cancellations within 48 hours forfeit the deposit.</li>
			<li><strong>No-Shows:</strong> Forfeit the deposit and may require full prepayment for future bookings.</li>
		</ul>
        <div class="divider"></div>

        <h2>9.2 Late Arrival</h2>
        <p>
            Please respect the artist's time. If you are more than <strong>15 minutes late</strong> without notice, 
            your appointment may be cancelled and your deposit forfeited.
        </p>
        <div class="divider"></div>

		<h2>9.3 Guests & Visitors</h2>
        <div class="policy-card dark">
            <p>
                <strong>No Entourage Policy.</strong> Due to space constraints and to maintain focus, 
                clients are requested to come alone. One guest may be permitted for moral support upon prior approval 
                but cannot be in the immediate tattooing area.
            </p>
        </div>
        <div class="divider"></div>

        <h2>9.4 Design Changes</h2>
        <p>
            Minor adjustments to the design on the day of the appointment are fine. 
            <strong>Major design changes</strong> (changing the entire concept) may require rescheduling and a new deposit 
            if the original time slot is no longer sufficient.
        </p>
        <div class="divider"></div>

        <h2>9.5 Touch-Ups</h2>
        <p>
            One free touch-up is included within 3 months of the appointment. 
            <strong>Exceptions:</strong> Hands, feet, and fingers are excluded from free touch-ups due to the nature of skin in these areas.
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

    .policy-card {
        padding: 1.5rem;
        border-left: 8px solid var(--color-black);
        background: var(--color-gray-100);
        margin-bottom: 1.5rem;
    }
    .policy-card.dark {
        background: var(--color-black);
        border-left: 8px solid var(--color-gray-500);
    }
    .policy-card.dark p { color: white; }
    .policy-card p { margin: 0; }

    .simple-list { margin-bottom: 1.5rem; padding-left: 1.5rem; }
    .simple-list li { margin-bottom: 0.75rem; font-size: 1.05rem; line-height: 1.5; }
</style>

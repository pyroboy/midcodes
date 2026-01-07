<svelte:head>
	<title>STUDIO OVERVIEW | Tattoo Studio</title>
</svelte:head>

<section class="doc-page">

	<header class="doc-header">
		<h1>02 Studio<br><span class="highlight">Overview</span></h1>
	</header>

	<article class="content">
		<h2>2.1 Artist Profile</h2>
        <p>
			<strong>Artist Name:</strong> [Your Name]<br>
			<strong>Experience:</strong> [X] years in the tattoo industry<br>
			<strong>Specialization:</strong> [Your specialty styles - e.g., Blackwork, Neo-Traditional, Fine Line]
		</p>
		<div class="highlight-box">
			<h3>About the Artist</h3>
			<p>
				[Brief bio about your journey, training, apprenticeship, and what drives your passion for tattooing. 
				Mention any notable achievements, collaborations, or recognition.]
			</p>
		</div>
        <div class="divider"></div>

		<h2>2.2 Studio Location</h2>
        <div class="info-grid">
            <div class="info-card">
                <h4>📍 Address</h4>
                <p>[Street Address]<br>[City, State, ZIP]</p>
            </div>
            <div class="info-card dark">
                <h4>🕐 Operating Hours</h4>
                <p>By Appointment Only<br>Tue - Sat: 10AM - 7PM</p>
            </div>
        </div>
        <div class="divider"></div>

        <h2>2.3 Studio Atmosphere</h2>
        <ul class="simple-list">
			<li><strong>Private Setting:</strong> One client at a time for focused, intimate sessions.</li>
			<li><strong>Clean & Minimal:</strong> Professional, sterile environment with modern aesthetics.</li>
			<li><strong>Comfortable:</strong> Climate-controlled space with comfortable seating.</li>
			<li><strong>Music/Entertainment:</strong> Client-friendly audio system for personal playlists.</li>
		</ul>
        <div class="divider"></div>

		<h2>2.4 Business Registration</h2>
        <div class="stat-box">
            <div class="stat">
                 <span class="label">Business Name</span>
                 <span class="value">[Registered Name]</span>
            </div>
            <div class="stat">
                 <span class="label">Registration Type</span>
                 <span class="value">Sole Proprietor</span>
            </div>
        </div>
        <p>
			<strong>DTI Registration:</strong> [Number]<br>
			<strong>Barangay Clearance:</strong> [Status]<br>
			<strong>Mayor's Permit:</strong> [Status]
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

    .highlight-box {
        border: 2px solid var(--color-black);
        padding: 2rem;
        background: white;
        box-shadow: 6px 6px 0px var(--color-gray-400);
        margin: 2rem 0;
    }
    .highlight-box h3 { font-size: 1.5rem; margin-bottom: 1rem; }
    .highlight-box p { margin: 0; }

    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 2rem; }
    .info-card { padding: 1.5rem; background: white; border: 2px solid var(--color-gray-300); }
    .info-card.dark { background: var(--color-black); color: white; border-color: var(--color-black); }
    .info-card.dark h4 { color: white; }
    .info-card.dark p { color: var(--color-gray-400); }
    .info-card h4 { font-size: 1.25rem; margin-bottom: 0.5rem; }
    .info-card p { font-size: 0.95rem; margin: 0; }
    @media(max-width:600px) { .info-grid { grid-template-columns: 1fr; }}

    .stat-box {
        display: flex;
        gap: 3rem;
        margin-bottom: 2rem;
        flex-wrap: wrap;
    }
    .stat { display: flex; flex-direction: column; }
    .stat .label { font-size: 0.8rem; text-transform: uppercase; font-weight: 700; color: var(--color-gray-500); margin-bottom: 5px;}
    .stat .value { font-family: var(--font-header); font-size: 1.75rem; font-weight: 400; color: var(--color-black); line-height: 1;}

    .simple-list { margin-bottom: 1.5rem; padding-left: 1.5rem; }
    .simple-list li { margin-bottom: 0.75rem; font-size: 1.05rem; line-height: 1.5; }
</style>

<svelte:head>
	<title>FOUNDER'S STORY | SweetyTreats</title>
</svelte:head>

<section class="doc-page">
	<header class="doc-header">
		<h1>02 Founder's<br><span class="highlight">Story</span></h1>
	</header>

	<article class="content">
		<h2>2.1 The Beginning</h2>
        <div class="story-card">
            <span class="icon">👩‍🍳</span>
            <p>
                <em>Every great cookie has a story. Mine started in my grandmother's kitchen...</em>
            </p>
        </div>
        <p>
			[Share your personal journey here — how you discovered your passion for baking, 
			the moments that inspired you, and why cookies became your calling.]
		</p>
		<div class="divider"></div>

		<h2>2.2 Why Cookies?</h2>
        <p>
			[Explain what makes cookies special to you. Is it the joy of sharing treats with 
			loved ones? The creative expression? The universal appeal?]
		</p>
        <ul class="simple-list">
			<li><strong>Universal Love:</strong> Everyone loves a good cookie</li>
			<li><strong>Creative Canvas:</strong> Endless flavor possibilities</li>
			<li><strong>Shareable Joy:</strong> Perfect for gifting and celebrations</li>
		</ul>
        <div class="divider"></div>

		<h2>2.3 The Homegrown Dream</h2>
        <p>
			[Describe your vision for organic growth — starting small, building community, 
			and growing naturally without rush or compromise.]
		</p>
        <div class="highlight-box">
			<h3>💕 Our Promise</h3>
			<p>
				Every cookie is baked with the same love and care as if we were making it for our own family.
			</p>
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
        font-size: 4.5rem;
        line-height: 0.95;
        margin-bottom: 4rem;
        color: var(--color-brown);
    }
    .highlight { 
        color: white; 
        background: linear-gradient(135deg, var(--color-pink) 0%, var(--color-rose) 100%); 
        padding: 0 1rem; 
        border-radius: 8px;
    }
    @media(max-width:600px) { .doc-header h1 { font-size: 3rem; }}

    h2 {
        border-left: 6px solid var(--color-pink);
        padding-left: 1rem;
        margin-bottom: 1.5rem;
        color: var(--color-brown);
    }
    
    p { 
        font-size: 1.1rem; 
        line-height: 1.7; 
        margin-bottom: 1.5rem; 
        color: #52525b;
    }

    .divider {
        height: 2px;
        background: var(--color-pink-light);
        margin: 3rem 0;
    }

    .story-card {
        background: linear-gradient(135deg, #fdf2f8 0%, #fce7f3 100%);
        padding: 2rem;
        border-radius: 16px;
        text-align: center;
        margin-bottom: 2rem;
    }
    .story-card .icon { font-size: 3rem; display: block; margin-bottom: 1rem; }
    .story-card p {
        font-family: var(--font-header);
        font-size: 1.3rem;
        color: var(--color-pink-dark);
        margin: 0;
    }

    .highlight-box {
        border: 2px solid var(--color-pink);
        padding: 2rem;
        background: white;
        box-shadow: 0 4px 20px rgba(236, 72, 153, 0.15);
        margin: 2rem 0;
        border-radius: 16px;
    }
    .highlight-box h3 { 
        font-size: 1.25rem; 
        margin-bottom: 1rem; 
        text-align: center;
        color: var(--color-brown);
    }
    .highlight-box p { margin: 0; text-align: center; }

    .simple-list { margin-bottom: 1.5rem; }
    .simple-list li { 
        margin-bottom: 0.75rem; 
        font-size: 1.05rem; 
        line-height: 1.6;
        color: #52525b;
    }
</style>

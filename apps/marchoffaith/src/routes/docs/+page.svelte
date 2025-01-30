<svelte:head>
	<title>Documents - Grace Community Church</title>
	<meta name="description" content="Important documents and resources for our church community" />
</svelte:head>

<div class="text-column">
	<h1>Church Documents</h1>

	<section class="docs-section">
		<h2>Resources</h2>
		<ul class="docs-list">
			<li>
				<a href="/" class="doc-link">
					<span class="doc-title">Weekly Bulletin</span>
					<span class="doc-desc">Current week's announcements and events</span>
				</a>
			</li>
			<li>
				<a href="/" class="doc-link">
					<span class="doc-title">Statement of Faith</span>
					<span class="doc-desc">Our core beliefs and doctrinal positions</span>
				</a>
			</li>
			<li>
				<a href="/" class="doc-link">
					<span class="doc-title">Ministry Guidelines</span>
					<span class="doc-desc">Information for ministry volunteers</span>
				</a>
			</li>
			<li>
				<a href="/" class="doc-link">
					<span class="doc-title">Church Constitution</span>
					<span class="doc-desc">Governing documents of our church</span>
				</a>
			</li>
		</ul>
	</section>
</div>

<style>
	.docs-list {
		list-style: none;
		padding: 0;
	}

	.doc-link {
		display: block;
		padding: 1rem;
		margin-bottom: 1rem;
		background-color: var(--color-bg-2);
		border-radius: 4px;
		transition: transform 0.2s ease;
	}

	.doc-link:hover {
		transform: translateX(5px);
		text-decoration: none;
	}

	.doc-title {
		display: block;
		font-weight: bold;
		color: var(--color-theme-1);
	}

	.doc-desc {
		display: block;
		font-size: 0.9rem;
		color: var(--color-text);
		margin-top: 0.5rem;
	}
</style>
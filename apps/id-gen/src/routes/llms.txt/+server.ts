import type { RequestHandler } from './$types';

export const GET: RequestHandler = async () => {
	const modules = {
		...import.meta.glob('../\\(shell\\)/admin/docs/**/*.svelte', {
			query: '?raw',
			import: 'default',
			eager: true
		}),
		...import.meta.glob(['../+page.svelte', '../pricing/+page.svelte'], {
			query: '?raw',
			import: 'default',
			eager: true
		})
	};

	// DEBUGGING LOGS
	console.log('--- LLMS.TXT GENERATION START ---');
	const foundPaths = Object.keys(modules);
	console.log(`Found ${foundPaths.length} documentation modules.`);
	if (foundPaths.length === 0) {
		console.warn('WARNING: No modules found matching the glob pattern!');
		console.log('Current directory context:', import.meta.url);
	} else {
		console.log('Modules found:', foundPaths);
	}

	// Add metadata header for "client-side" visibility of health
	let content = '# Kanaya Admin Documentation (LLM Context)\n';
	content += `Generated: ${new Date().toISOString()}\n`;
	content += `Status: ✅ Live Generated\n`;
	content += `Files Found: ${foundPaths.length}\n`;
	content += '----------------------------------------\n\n';
	
	if (foundPaths.length === 0) {
		content += '⚠️ WARNING: No documentation files were found. Check the glob pattern in +server.ts.\n';
		content += `Glob Pattern Used: ../(shell)/admin/docs/**/*.svelte\n\n`;
	}

	// Sort modules by path to ensure consistent order
	const sortedPaths = Object.keys(modules).sort();

	for (const path of sortedPaths) {
		const rawSvelte = modules[path] as string;
		const fileName = path.split('/').slice(-2, -1)[0]; // get the directory name (e.g. 'ads', 'legal')
		
		// Skip the main docs hub page itself if it's just links, or include it.
		// The path for the main page is '../(shell)/admin/docs/+page.svelte'
		// The path for subpages is '../(shell)/admin/docs/ads/+page.svelte'
		// Let's include everything but give a nice header.

		let title = fileName;
		if (fileName === 'docs') {
			title = 'Overview';
		}

		content += `\n\n# SECTION: ${title.toUpperCase()}\n`;
		content += `Source: ${path}\n`;
		content += '----------------------------------------\n\n';

		content += cleanSvelteContent(rawSvelte);
	}

	return new Response(content, {
		headers: {
			'content-type': 'text/plain; charset=utf-8'
		}
	});
};

function cleanSvelteContent(html: string): string {
	let text = html;

	// Remove script and style blocks
	text = text.replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '');
	text = text.replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, '');
	text = text.replace(/<svelte:head>[\s\S]*?<\/svelte:head>/gi, '');

	// Replace headers with markdown style
	text = text.replace(/<h1[^>]*>(.*?)<\/h1>/gi, '\n# $1\n');
	text = text.replace(/<h2[^>]*>(.*?)<\/h2>/gi, '\n## $1\n');
	text = text.replace(/<h3[^>]*>(.*?)<\/h3>/gi, '\n### $1\n');
	text = text.replace(/<h4[^>]*>(.*?)<\/h4>/gi, '\n#### $1\n');

	// Replace lists
	text = text.replace(/<li[^>]*>/gi, '\n- ');
	
	// Replace paragraphs and breaks
	text = text.replace(/<p[^>]*>/gi, '\n');
	text = text.replace(/<\/p>/gi, '\n');
	text = text.replace(/<br\s*\/?>/gi, '\n');

	// Strip remaining HTML tags
	text = text.replace(/<[^>]+>/g, '');

	// Decode common entities (basic ones)
	text = text.replace(/&amp;/g, '&');
	text = text.replace(/&lt;/g, '<');
	text = text.replace(/&gt;/g, '>');
	text = text.replace(/&quot;/g, '"');
	text = text.replace(/&#39;/g, "'");
	text = text.replace(/&nbsp;/g, ' ');

	// Clean up excessive whitespace
	// Replace multiple newlines with max 2
	text = text.replace(/\n\s*\n\s*\n/g, '\n\n');
	
	// Trim lines
	text = text.split('\n').map(line => line.trim()).join('\n');

	return text.trim();
}

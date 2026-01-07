import type { RequestHandler } from './$types';

export const GET: RequestHandler = async () => {
	const modules = import.meta.glob('../docs/**/*.svelte', {
		query: '?raw',
		import: 'default',
		eager: true
	}) as Record<string, string>;

	let content = '# Tattoo Studio Docs\n\n';
	const sortedPaths = Object.keys(modules).sort();

	const moduleContents: { markdown: string; html: string }[] = [];

	for (const path of sortedPaths) {
		const rawSvelte = modules[path];
		const pathParts = path.split('/');
		const fileName = pathParts[pathParts.length - 2];
		
		let title = fileName;
		if (fileName === 'docs' || !fileName || fileName === '..') title = 'Home';
		else title = fileName.replace(/-/g, ' ').toUpperCase();

		const sectionMd = `\n\n# SECTION: ${title}\nSource: ${path}\n\n`;
		moduleContents.push({
			markdown: sectionMd,
			html: cleanSvelteContent(rawSvelte)
		});
	}

	// Clean text preview (LLM-friendly)
	let textPreview = '';
	for (const mod of moduleContents) {
		const mdText = mod.markdown;
		// Simple regex strip tags
		const cleanHtmlText = mod.html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
		textPreview += mdText + cleanHtmlText + '\n\n';
	}

	return new Response(textPreview, {
		headers: { 'content-type': 'text/plain; charset=utf-8' }
	});
};

function cleanSvelteContent(html: string): string {
	return html
		.replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
		.replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, '')
		.replace(/<svelte:head>[\s\S]*?<\/svelte:head>/gi, '')
		.replace(/\{#if[\s\S]*?\{\/if\}/gi, '') 
		.replace(/\{@html[\s\S]*?\}/gi, '')
        .replace(/\{[^}]+\}/g, '')
		.replace(/&nbsp;/g, ' ')
		.trim();
}

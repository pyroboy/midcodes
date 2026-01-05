import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from 'pdf-lib';
import type { RequestHandler } from './$types';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkRehype from 'remark-rehype';
import rehypeParse from 'rehype-parse';
import rehypeRaw from 'rehype-raw';
import { visit } from 'unist-util-visit';
import { toText } from 'hast-util-to-text';

export const GET: RequestHandler = async ({ url }) => {
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

	let content = '# Kanaya Admin Documentation\n\n';
	const sortedPaths = Object.keys(modules).sort();

	const moduleContents: { markdown: string; html: string }[] = [];

	for (const path of sortedPaths) {
		const rawSvelte = modules[path] as string;
		const fileName = path.split('/').slice(-2, -1)[0];
		let title = fileName === 'docs' ? 'Overview' : fileName.toUpperCase();

		const sectionMd = `\n\n# SECTION: ${title}\nSource: ${path}\n\n`;
		moduleContents.push({
			markdown: sectionMd,
			html: cleanSvelteContent(rawSvelte)
		});
	}

	if (url.searchParams.get('format') === 'pdf') {
		const pdfBytes = await generatePdf(moduleContents);
		return new Response(pdfBytes, {
			headers: {
				'content-type': 'application/pdf',
				'content-disposition': 'attachment; filename="kanaya-admin-docs.pdf"'
			}
		});
	}

	// For text preview, just join them
	const textPreview = moduleContents.map(m => m.markdown + m.html).join('');
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
		.replace(/&nbsp;/g, ' ')
		.trim();
}

async function generatePdf(modules: { markdown: string; html: string }[]): Promise<Uint8Array> {
	const pdfDoc = await PDFDocument.create();
	const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
	const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
	const fontMono = await pdfDoc.embedFont(StandardFonts.Courier);

	const margin = 50;
	const pageWidth = 595.28;
	const pageHeight = 841.89;
	const wrapWidth = pageWidth - margin * 2;

	const colors = {
		primary: rgb(30/255, 64/255, 175/255),
		accent: rgb(37/255, 99/255, 235/255),
		text: rgb(15/255, 23/255, 42/255),
		muted: rgb(100/255, 116/255, 139/255),
		border: rgb(226/255, 232/255, 240/255),
		codeBg: rgb(248/255, 250/255, 252/255),
		sectionBg: rgb(239/255, 246/255, 255/255)
	};

	let page = pdfDoc.addPage([pageWidth, pageHeight]);
	let y = pageHeight - margin;
	let pageNum = 1;

	const drawFooter = (p: PDFPage, n: number) => {
		p.drawText(`Kanaya Documentation • Page ${n}`, { x: margin, y: 25, size: 8, font: fontRegular, color: colors.muted });
		p.drawLine({ start: { x: margin, y: 35 }, end: { x: pageWidth - margin, y: 35 }, thickness: 0.5, color: colors.border });
	};
	drawFooter(page, pageNum);

	const checkOverflow = (needed: number) => {
		if (y < margin + needed) {
			page = pdfDoc.addPage([pageWidth, pageHeight]);
			pageNum++;
			y = pageHeight - margin;
			drawFooter(page, pageNum);
		}
	};

	const wrapText = (text: string, font: PDFFont, size: number, maxWidth: number) => {
		if (!text) return [];
		const words = text.split(/\s+/);
		const lines = [];
		let currentLine = '';
		for (const word of words) {
			const testLine = currentLine ? `${currentLine} ${word}` : word;
			if (font.widthOfTextAtSize(testLine, size) <= maxWidth) {
				currentLine = testLine;
			} else {
				if (currentLine) lines.push(currentLine);
				currentLine = word;
			}
		}
		if (currentLine) lines.push(currentLine);
		return lines;
	};

	// Create Parsers
	const mdProcessor = unified().use(remarkParse).use(remarkGfm).use(remarkRehype, { allowDangerousHtml: true }).use(rehypeRaw);
	const htmlProcessor = unified().use(rehypeParse, { fragment: true }).use(rehypeRaw);

	const mergedHast: any = { type: 'root', children: [] };

	for (const mod of modules) {
		const mdHast = await mdProcessor.run(mdProcessor.parse(mod.markdown));
		const htmlHast = await htmlProcessor.run(htmlProcessor.parse(mod.html));
		mergedHast.children.push(...(mdHast as any).children);
		mergedHast.children.push(...(htmlHast as any).children);
	}

	const walk = (node: any) => {
		if (node.type === 'text') {
			const text = sanitize(node.value);
			if (!text || text.trim() === '') return;
			const lines = wrapText(text, fontRegular, 10, wrapWidth);
			for (const l of lines) {
				checkOverflow(15);
				page.drawText(l, { x: margin, y, size: 10, font: fontRegular, color: colors.text });
				y -= 14;
			}
			return;
		}

		if (node.type === 'element') {
			switch (node.tagName) {
				case 'h1': case 'h2': case 'h3': case 'h4': case 'h5': case 'h6': {
					const level = parseInt(node.tagName[1]);
					const size = level === 1 ? 22 : level === 2 ? 18 : level === 3 ? 14 : 12;
					const text = sanitize(toText(node)).replace(/\n/g, ' '); // Headers must be single-line
					checkOverflow(size + 30);
					y -= (level === 1 ? 20 : 10);
					page.drawText(text, { x: margin, y, size, font: fontBold, color: level === 1 ? colors.primary : colors.text });
					if (level === 1) {
						y -= 8;
						page.drawLine({ start: { x: margin, y }, end: { x: margin + 40, y }, thickness: 3, color: colors.primary });
						y -= 10;
					}
					y -= size + 10;
					break;
				}
				case 'p': {
					if (node.children) node.children.forEach(walk);
					y -= 10;
					break;
				}
				case 'ul': case 'ol': {
					node.children.forEach((item: any) => {
						if (item.tagName === 'li') {
							const text = sanitize(toText(item));
							const lines = wrapText(text, fontRegular, 10, wrapWidth - 20);
							checkOverflow(15);
							page.drawCircle({ x: margin + 5, y: y + 3.5, size: 1.5, color: colors.accent });
							for (const l of lines) {
								checkOverflow(15);
								page.drawText(l, { x: margin + 15, y, size: 10, font: fontRegular, color: colors.text });
								y -= 14;
							}
						} else {
							walk(item);
						}
					});
					y -= 10;
					break;
				}
				case 'pre': case 'code': {
					const isBlock = node.tagName === 'pre';
					const text = sanitize(toText(node)).split('\n');
					for (const line of text) {
						const wrapped = wrapText(line, fontMono, 8, wrapWidth - 10);
						for (const l of wrapped) {
							checkOverflow(12);
							if (isBlock) {
								page.drawRectangle({ x: margin - 5, y: y - 2, width: wrapWidth + 10, height: 11, color: colors.codeBg });
							}
							page.drawText(l, { x: margin, y, size: 8, font: fontMono, color: colors.text });
							y -= 11;
						}
					}
					y -= 10;
					break;
				}
				case 'table': {
					renderTable(node);
					break;
				}
				case 'a': {
					if (node.children) node.children.forEach(walk);
					break;
				}
				case 'div': case 'section': case 'header': case 'nav': case 'span': {
					const text = sanitize(toText(node));
					if (text.startsWith('SECTION:')) {
						y -= 15; checkOverflow(40);
						page.drawRectangle({ x: margin - 5, y: y - 8, width: wrapWidth + 10, height: 26, color: colors.sectionBg });
						page.drawLine({ start: { x: margin - 5, y: y - 8 }, end: { x: margin - 5, y: y + 18 }, thickness: 4, color: colors.accent });
						page.drawText(text, { x: margin + 5, y, size: 12, font: fontBold, color: colors.primary });
						y -= 35;
						break;
					}
					if (node.children) node.children.forEach(walk);
					break;
				}
				case 'br': {
					y -= 14;
					break;
				}
				default: {
					if (node.children) node.children.forEach(walk);
				}
			}
		}
	};

	const renderTable = (table: any) => {
		const rows: string[][] = [];
		visit(table, 'element', (node) => {
			if (node.tagName === 'tr') {
				const row: string[] = [];
				node.children.forEach((cell: any) => {
					if (cell.tagName === 'th' || cell.tagName === 'td') {
						row.push(sanitize(toText(cell)).replace(/\n/g, ' ')); // Table cells must be single-line for width logic
					}
				});
				if (row.length > 0) rows.push(row);
			}
		});

		if (rows.length === 0) return;

		const colWidths: number[] = [];
		rows.forEach(row => {
			row.forEach((cell, i) => {
				const w = fontRegular.widthOfTextAtSize(cell, 9) + 15;
				colWidths[i] = Math.max(colWidths[i] || 0, w);
			});
		});

		const totalWidth = colWidths.reduce((a, b) => a + b, 0);
		const scale = totalWidth > wrapWidth ? wrapWidth / totalWidth : 1;
		const scaledWidths = colWidths.map(w => w * scale);

		y -= 10;
		rows.forEach((row, i) => {
			checkOverflow(25);
			let x = margin;
			const h = 18;
			if (i === 0) {
				page.drawRectangle({ x, y: y - 4, width: wrapWidth, height: h, color: colors.codeBg });
			}
			row.forEach((cell, j) => {
				const cw = scaledWidths[j];
				page.drawText(cell, { x: x + 5, y, size: 9, font: i === 0 ? fontBold : fontRegular, color: colors.text });
				page.drawLine({ start: { x, y: y - 4 }, end: { x: x + cw, y: y - 4 }, thickness: 0.2, color: colors.border });
				page.drawLine({ start: { x, y: y - 4 }, end: { x, y: y + h - 4 }, thickness: 0.2, color: colors.border });
				x += cw;
				if (j === row.length - 1) {
					page.drawLine({ start: { x, y: y - 4 }, end: { x, y: y + h - 4 }, thickness: 0.2, color: colors.border });
				}
			});
			if (i === 0) {
				page.drawLine({ start: { x: margin, y: y + h - 4 }, end: { x: margin + wrapWidth, y: y + h - 4 }, thickness: 0.2, color: colors.border });
			}
			y -= h;
		});
		y -= 10;
	};

	mergedHast.children.forEach(walk);

	function sanitize(text: string): string {
		if (!text) return '';
		return text
			.replace(/[^\x00-\x7F\u00A0-\u00FF\n]/g, '') // Keep ASCII, Extended Latin-1, and Newlines
			.replace(/\u2013|\u2014/g, '-') 
			.replace(/\u2018|\u2019/g, "'") 
			.replace(/\u201C|\u201D/g, '"') 
			.trim();
	}

	return pdfDoc.save();
}


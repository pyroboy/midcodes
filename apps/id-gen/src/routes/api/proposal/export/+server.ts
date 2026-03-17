import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from 'pdf-lib';
import type { RequestHandler } from './$types';
import { z } from 'zod';

const proposalSchema = z.object({
	clientName: z.string().min(1),
	clientOrg: z.string().min(1),
	contactPerson: z.string().optional().default(''),
	contactEmail: z.string().optional().default(''),
	contactPhone: z.string().optional().default(''),
	proposalDate: z.string().min(1),
	validityDays: z.number().min(1).default(15),
	downpaymentPercent: z.number().min(0).max(100).default(50),
	lineItems: z.array(
		z.object({
			description: z.string().min(1),
			detail: z.string().optional().default(''),
			qty: z.number().min(1),
			unitPrice: z.number().min(0),
			waived: z.boolean().default(false)
		})
	)
});

type ProposalData = z.infer<typeof proposalSchema>;

export const POST: RequestHandler = async ({ request }) => {
	const body = await request.json();
	const parsed = proposalSchema.safeParse(body);

	if (!parsed.success) {
		return new Response(JSON.stringify({ error: parsed.error.message }), {
			status: 400,
			headers: { 'content-type': 'application/json' }
		});
	}

	const data = parsed.data;
	const pdfBytes = await generateProposalPdf(data);
	const safeName = (data.clientOrg || 'client').replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();

	return new Response(pdfBytes as any, {
		headers: {
			'content-type': 'application/pdf',
			'content-disposition': `attachment; filename="kanaya-proposal-${safeName}-${data.proposalDate}.pdf"`
		}
	});
};

async function generateProposalPdf(data: ProposalData): Promise<Uint8Array> {
	const doc = await PDFDocument.create();
	const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);
	const fontRegular = await doc.embedFont(StandardFonts.Helvetica);

	const margin = 50;
	const pageWidth = 595.28; // A4
	const pageHeight = 841.89;
	const contentWidth = pageWidth - margin * 2;

	const colors = {
		primary: rgb(43 / 255, 108 / 255, 176 / 255), // #2b6cb0
		dark: rgb(26 / 255, 32 / 255, 44 / 255), // #1a202c
		muted: rgb(113 / 255, 128 / 255, 150 / 255), // #718096
		border: rgb(209 / 255, 213 / 255, 219 / 255),
		headerBg: rgb(31 / 255, 41 / 255, 55 / 255), // #1f2937
		rowAlt: rgb(243 / 255, 244 / 255, 246 / 255), // #f3f4f6
		red: rgb(220 / 255, 38 / 255, 38 / 255),
		white: rgb(1, 1, 1)
	};

	let page = doc.addPage([pageWidth, pageHeight]);
	let y = pageHeight - margin;
	let pageNum = 1;

	// --- Helpers ---
	const drawFooter = (p: PDFPage, n: number) => {
		p.drawText(`Kanaya Identity Solutions | Confidential Proposal | Page ${n}`, {
			x: margin,
			y: 25,
			size: 7,
			font: fontRegular,
			color: colors.muted
		});
		p.drawLine({
			start: { x: margin, y: 35 },
			end: { x: pageWidth - margin, y: 35 },
			thickness: 0.5,
			color: colors.border
		});
	};
	drawFooter(page, pageNum);

	const checkOverflow = (needed: number) => {
		if (y < margin + needed) {
			page = doc.addPage([pageWidth, pageHeight]);
			pageNum++;
			y = pageHeight - margin;
			drawFooter(page, pageNum);
		}
	};

	const wrapText = (text: string, font: PDFFont, size: number, maxWidth: number): string[] => {
		if (!text) return [];
		const words = text.split(/\s+/);
		const lines: string[] = [];
		let current = '';
		for (const word of words) {
			const test = current ? `${current} ${word}` : word;
			if (font.widthOfTextAtSize(test, size) <= maxWidth) {
				current = test;
			} else {
				if (current) lines.push(current);
				current = word;
			}
		}
		if (current) lines.push(current);
		return lines;
	};

	const drawText = (
		text: string,
		opts: { font?: PDFFont; size?: number; color?: ReturnType<typeof rgb>; x?: number; maxWidth?: number } = {}
	) => {
		const font = opts.font || fontRegular;
		const size = opts.size || 10;
		const color = opts.color || colors.dark;
		const x = opts.x || margin;
		const maxWidth = opts.maxWidth || contentWidth;

		const lines = wrapText(text, font, size, maxWidth);
		for (const line of lines) {
			checkOverflow(size + 4);
			page.drawText(line, { x, y, size, font, color });
			y -= size + 4;
		}
	};

	const drawHeading = (text: string, level: 1 | 2 | 3) => {
		const sizes = { 1: 22, 2: 16, 3: 12 };
		const size = sizes[level];
		const gap = level === 1 ? 25 : level === 2 ? 18 : 12;

		y -= gap;
		checkOverflow(size + gap + 10);

		if (level === 2) {
			// Blue left bar like the HTML version
			page.drawRectangle({ x: margin, y: y - 2, width: 4, height: size + 4, color: colors.primary });
			page.drawText(text, { x: margin + 14, y, size, font: fontBold, color: colors.dark });
		} else {
			page.drawText(text, { x: margin, y, size, font: fontBold, color: level === 1 ? colors.primary : colors.dark });
		}

		if (level === 1) {
			y -= 10;
			page.drawLine({ start: { x: margin, y }, end: { x: margin + 50, y }, thickness: 3, color: colors.primary });
		}
		y -= size + 8;
	};

	const drawBullet = (text: string) => {
		const lines = wrapText(text, fontRegular, 10, contentWidth - 20);
		checkOverflow(15);
		page.drawCircle({ x: margin + 5, y: y + 3, size: 2, color: colors.primary });
		for (const line of lines) {
			checkOverflow(15);
			page.drawText(line, { x: margin + 15, y, size: 10, font: fontRegular, color: colors.dark });
			y -= 14;
		}
	};

	const drawSpacer = (h: number = 10) => {
		y -= h;
	};

	// ===========================
	// PAGE 1: COVER / EXEC SUMMARY
	// ===========================

	// Header bar
	page.drawRectangle({ x: 0, y: pageHeight - 120, width: pageWidth, height: 120, color: colors.primary });
	page.drawText('KANAYA', { x: margin, y: pageHeight - 55, size: 32, font: fontBold, color: colors.white });
	page.drawText('IDENTITY SOLUTIONS', { x: margin, y: pageHeight - 75, size: 12, font: fontRegular, color: rgb(190 / 255, 227 / 255, 248 / 255) });
	page.drawText('Project Proposal', { x: margin, y: pageHeight - 100, size: 14, font: fontRegular, color: colors.white });
	page.drawText(data.proposalDate, { x: pageWidth - margin - fontRegular.widthOfTextAtSize(data.proposalDate, 10), y: pageHeight - 100, size: 10, font: fontRegular, color: rgb(190 / 255, 227 / 255, 248 / 255) });

	y = pageHeight - 150;

	// Client info block
	drawSpacer(10);
	drawText(`Prepared For: ${data.clientOrg}`, { font: fontBold, size: 14, color: colors.dark });
	if (data.contactPerson) {
		drawText(`Attention: ${data.contactPerson}`, { size: 11, color: colors.muted });
	}
	if (data.contactEmail) {
		drawText(`Email: ${data.contactEmail}`, { size: 10, color: colors.muted });
	}
	if (data.contactPhone) {
		drawText(`Phone: ${data.contactPhone}`, { size: 10, color: colors.muted });
	}
	drawText(`Prepared By: Kanaya Identity Solutions`, { font: fontBold, size: 11, color: colors.primary });
	drawSpacer(5);
	page.drawLine({ start: { x: margin, y }, end: { x: pageWidth - margin, y }, thickness: 1, color: colors.border });

	// Section 1: Executive Summary
	drawHeading('1. Executive Summary', 2);
	drawSpacer(5);

	drawText('THE CHALLENGE', { font: fontBold, size: 10, color: colors.muted });
	drawSpacer(3);
	drawText(
		`Current identification systems at ${data.clientOrg} are static, easily counterfeited, and disconnected from modern safety protocols. A lost ID poses a security risk and requires days to replace, leaving the facility vulnerable.`
	);
	drawSpacer(10);

	drawText('THE KANAYA SOLUTION', { font: fontBold, size: 10, color: colors.muted });
	drawSpacer(3);
	drawText(
		`We propose the implementation of the Kanaya Digital Identity Ecosystem. Unlike traditional PVC printing, our solution integrates physical durability with cloud-based verification:`
	);
	drawSpacer(5);
	drawBullet('Instant Verification: Guards can scan IDs via NFC/QR to verify active status.');
	drawBullet('Anti-Fraud: Proprietary "Ghost Image" and Encrypted Data layers.');
	drawBullet('Rapid Issuance: Lost cards replaced in under 2 hours.');

	// Section 2: Technical Specifications
	drawHeading('2. Technical Specifications', 2);
	drawSpacer(5);

	drawText('2.1 THE PHYSICAL CREDENTIAL', { font: fontBold, size: 10 });
	drawSpacer(5);

	// Spec table
	const specs = [
		['Material Construction', '3-Layer Fused PVC (Sandwich Type) - Non-fading'],
		['Dimensions', 'CR-80 (85.60 x 53.98 mm) - ISO Standard 7810'],
		['Smart Chip', 'NXP Mifare 1K EV1 (13.56 MHz) - Optional Upsell'],
		['Data Encoding', 'AES-128 Encrypted UID linked to Kanaya Cloud']
	];

	for (const [label, value] of specs) {
		checkOverflow(20);
		const labelWidth = contentWidth * 0.35;
		page.drawRectangle({ x: margin, y: y - 4, width: labelWidth, height: 18, color: colors.rowAlt });
		page.drawRectangle({ x: margin + labelWidth, y: y - 4, width: contentWidth - labelWidth, height: 18, color: colors.white });
		page.drawLine({ start: { x: margin, y: y - 4 }, end: { x: margin + contentWidth, y: y - 4 }, thickness: 0.3, color: colors.border });
		page.drawText(label, { x: margin + 5, y, size: 9, font: fontBold, color: colors.dark });
		page.drawText(value, { x: margin + labelWidth + 5, y, size: 9, font: fontRegular, color: colors.dark });
		y -= 18;
	}
	page.drawLine({ start: { x: margin, y: y + 14 }, end: { x: margin + contentWidth, y: y + 14 }, thickness: 0.3, color: colors.border });

	drawSpacer(10);
	drawText('2.2 THE DIGITAL PLATFORM (SaaS)', { font: fontBold, size: 10 });
	drawSpacer(3);
	drawText(`The contract includes access to the Kanaya Admin Dashboard, allowing ${data.clientOrg} to:`);
	drawSpacer(3);
	drawBullet('Deactivate lost/stolen cards instantly.');
	drawBullet('View real-time entry logs (if scanning is enabled).');
	drawBullet('Batch export student data for DepEd/CHED compliance.');

	// Section 3: Financial Proposal
	drawHeading('3. Financial Proposal', 2);
	drawSpacer(5);
	drawText('Option A: The "Secure Campus" Package (Recommended)', { font: fontBold, size: 11 });
	drawSpacer(8);

	// Calculate totals
	const subtotal = data.lineItems.reduce((sum, item) => sum + (item.waived ? 0 : item.qty * item.unitPrice), 0);
	const downpaymentAmount = Math.round(subtotal * (data.downpaymentPercent / 100));
	const balanceAmount = subtotal - downpaymentAmount;

	const formatPeso = (n: number) => `PHP ${n.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

	// Finance table header
	const colWidths = [contentWidth * 0.45, contentWidth * 0.12, contentWidth * 0.2, contentWidth * 0.23];
	const headerLabels = ['ITEM DESCRIPTION', 'QTY', 'UNIT PRICE', 'TOTAL'];
	checkOverflow(25);

	let tableX = margin;
	page.drawRectangle({ x: margin, y: y - 4, width: contentWidth, height: 20, color: colors.headerBg });
	for (let i = 0; i < headerLabels.length; i++) {
		page.drawText(headerLabels[i], { x: tableX + 5, y, size: 8, font: fontBold, color: colors.white });
		tableX += colWidths[i];
	}
	y -= 20;

	// Finance table rows
	for (const item of data.lineItems) {
		const rowHeight = item.detail ? 28 : 18;
		checkOverflow(rowHeight + 5);
		tableX = margin;

		page.drawLine({ start: { x: margin, y: y - 4 }, end: { x: margin + contentWidth, y: y - 4 }, thickness: 0.3, color: colors.border });

		// Description + detail
		page.drawText(item.description, { x: tableX + 5, y, size: 9, font: fontBold, color: colors.dark });
		if (item.detail) {
			page.drawText(item.detail, { x: tableX + 5, y: y - 12, size: 7, font: fontRegular, color: colors.muted });
		}
		tableX += colWidths[0];

		// Qty
		page.drawText(item.qty.toLocaleString(), { x: tableX + 5, y, size: 9, font: fontRegular, color: colors.dark });
		tableX += colWidths[1];

		// Unit Price
		page.drawText(formatPeso(item.unitPrice), { x: tableX + 5, y, size: 9, font: fontRegular, color: colors.dark });
		tableX += colWidths[2];

		// Total
		const lineTotal = item.qty * item.unitPrice;
		if (item.waived) {
			page.drawText(formatPeso(lineTotal), { x: tableX + 5, y, size: 9, font: fontRegular, color: colors.red });
			// Strikethrough line
			const textWidth = fontRegular.widthOfTextAtSize(formatPeso(lineTotal), 9);
			page.drawLine({
				start: { x: tableX + 5, y: y + 3 },
				end: { x: tableX + 5 + textWidth, y: y + 3 },
				thickness: 0.8,
				color: colors.red
			});
			page.drawText('WAIVED', { x: tableX + 5, y: y - 12, size: 8, font: fontBold, color: colors.primary });
		} else {
			page.drawText(formatPeso(lineTotal), { x: tableX + 5, y, size: 9, font: fontRegular, color: colors.dark });
		}

		y -= rowHeight;
	}

	// Grand Total row
	checkOverflow(25);
	page.drawRectangle({ x: margin, y: y - 4, width: contentWidth, height: 22, color: colors.rowAlt });
	page.drawLine({ start: { x: margin, y: y - 4 }, end: { x: margin + contentWidth, y: y - 4 }, thickness: 0.5, color: colors.border });
	page.drawText('GRAND TOTAL', { x: margin + 5, y, size: 10, font: fontBold, color: colors.dark });
	const totalX = margin + colWidths[0] + colWidths[1] + colWidths[2];
	page.drawText(formatPeso(subtotal), { x: totalX + 5, y, size: 10, font: fontBold, color: colors.dark });
	y -= 22;

	// Payment terms
	drawSpacer(15);
	drawText('Payment Terms', { font: fontBold, size: 11 });
	drawSpacer(5);
	drawBullet(`${data.downpaymentPercent}% Downpayment (${formatPeso(downpaymentAmount)}) required upon contract signing to commence production.`);
	drawBullet(`${100 - data.downpaymentPercent}% Balance (${formatPeso(balanceAmount)}) due upon delivery of the first batch (or Full Delivery).`);
	drawBullet(`Validity: This quote is valid for ${data.validityDays} days.`);

	// Section 4: Timeline
	drawHeading('4. Execution Timeline', 2);
	drawSpacer(5);

	const timeline = [
		{ day: 'Day 1', title: 'Contract Signing & Downpayment', desc: 'Mobilization of materials.' },
		{ day: 'Day 2-3', title: 'Data Capture / Photo Session', desc: 'On-site team takes student photos by section.' },
		{ day: 'Day 4-6', title: 'Production Phase (Batch 1)', desc: 'Printing, Laminating, and Curing.' },
		{ day: 'Day 7', title: 'Delivery & Turnover', desc: 'Testing of QR/NFC codes with School Admin.' }
	];

	for (const step of timeline) {
		checkOverflow(35);
		// Blue circle
		page.drawCircle({ x: margin + 8, y: y + 2, size: 5, color: colors.primary });
		page.drawCircle({ x: margin + 8, y: y + 2, size: 3, color: colors.white });
		// Day label
		page.drawText(step.day, { x: margin + 20, y, size: 10, font: fontBold, color: colors.primary });
		y -= 14;
		page.drawText(step.title, { x: margin + 20, y, size: 10, font: fontBold, color: colors.dark });
		y -= 13;
		page.drawText(step.desc, { x: margin + 20, y, size: 9, font: fontRegular, color: colors.muted });
		y -= 18;
		// Connecting line
		if (step !== timeline[timeline.length - 1]) {
			page.drawLine({ start: { x: margin + 8, y: y + 15 }, end: { x: margin + 8, y: y + 3 }, thickness: 1.5, color: colors.border });
		}
	}

	// Signature area
	drawSpacer(30);
	checkOverflow(80);
	page.drawLine({ start: { x: margin, y }, end: { x: pageWidth - margin, y }, thickness: 1, color: colors.border });
	y -= 20;
	drawText('CONFORME:', { font: fontBold, size: 10 });
	drawSpacer(25);

	// Two signature columns
	const sigWidth = (contentWidth - 40) / 2;
	page.drawLine({ start: { x: margin, y }, end: { x: margin + sigWidth, y }, thickness: 0.5, color: colors.dark });
	page.drawLine({ start: { x: margin + sigWidth + 40, y }, end: { x: margin + contentWidth, y }, thickness: 0.5, color: colors.dark });
	y -= 14;
	page.drawText(data.contactPerson || data.clientName, { x: margin, y, size: 9, font: fontBold, color: colors.dark });
	page.drawText('Arjo Magno, CEO', { x: margin + sigWidth + 40, y, size: 9, font: fontBold, color: colors.dark });
	y -= 12;
	page.drawText(data.clientOrg, { x: margin, y, size: 8, font: fontRegular, color: colors.muted });
	page.drawText('Kanaya Identity Solutions', { x: margin + sigWidth + 40, y, size: 8, font: fontRegular, color: colors.muted });

	return doc.save();
}

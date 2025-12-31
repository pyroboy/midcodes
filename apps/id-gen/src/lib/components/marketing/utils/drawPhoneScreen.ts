/**
 * drawPhoneScreen.ts
 *
 * Canvas drawing logic for the PhoneMesh screen texture.
 * Layout: 6 screens stacked vertically (512px each)
 *
 * Offset mapping (UV origin is bottom-left):
 * - 5/6 ≈ 0.833: QR Scanner View
 * - 4/6 ≈ 0.667: QR Success Badge
 * - 3/6 = 0.500: Home Screen
 * - 2/6 ≈ 0.333: Verifying Overlay
 * - 1/6 ≈ 0.167: Verified Screen
 * - 0/6 = 0.000: Profile Screen
 *
 * NFC Banner is a SEPARATE texture for overlay animation.
 *
 * Profile layout is determined by job title:
 * - CEO/CTO/Director/Manager: Executive theme (dark, professional)
 * - Developer/Engineer: Tech theme (blue gradient, modern)
 * - Designer: Creative theme (purple gradient)
 * - Analyst: Corporate theme (clean, white)
 */

import type { CardData } from '$lib/stores/encodeInput';

export const PHONE_TEX_W = 256;
export const PHONE_TEX_H = 3072; // 6 screens x 512 height
const SECTION_H = 512;

// Layout themes based on job title
type LayoutTheme = 'executive' | 'tech' | 'creative' | 'corporate';

function getThemeForTitle(title: string): LayoutTheme {
	const t = title.toLowerCase();
	if (t.includes('ceo') || t.includes('cto') || t.includes('director') || t.includes('manager')) {
		return 'executive';
	}
	if (t.includes('developer') || t.includes('engineer')) {
		return 'tech';
	}
	if (t.includes('designer')) {
		return 'creative';
	}
	return 'corporate'; // Analyst, etc.
}

// Separate NFC Banner texture dimensions
export const NFC_BANNER_W = 220;
export const NFC_BANNER_H = 80;

export function drawScreenContent(
	ctx: CanvasRenderingContext2D,
	cardData?: CardData
) {
	const TEX_W = PHONE_TEX_W;
	const data = cardData || { name: 'Unknown', title: 'Visitor' };
	const theme = getThemeForTitle(data.title);

	// Fill entire texture with fallback
	ctx.fillStyle = '#0f172a';
	ctx.fillRect(0, 0, TEX_W, PHONE_TEX_H);

	// === SCREEN 1 (Top): QR SCANNER VIEW ===
	drawQRScanner(ctx, 0);

	// === SCREEN 2: QR SUCCESS BADGE ===
	drawQRSuccess(ctx, SECTION_H);

	// === SCREEN 3: HOME SCREEN ===
	drawHomeScreen(ctx, SECTION_H * 2);

	// === SCREEN 4: VERIFYING OVERLAY ===
	drawVerifyingOverlay(ctx, SECTION_H * 3);

	// === SCREEN 5: VERIFIED SCREEN ===
	drawVerifiedScreen(ctx, SECTION_H * 4, data.name);

	// === SCREEN 6 (Bottom): PROFILE SCREEN ===
	drawProfileScreen(ctx, SECTION_H * 5, data, theme);
}

/**
 * Draw NFC Banner texture separately (for overlay plane animation)
 */
export function drawNFCBannerTexture(ctx: CanvasRenderingContext2D) {
	const W = NFC_BANNER_W;
	const H = NFC_BANNER_H;

	// Banner background (rounded pill)
	ctx.fillStyle = 'rgba(30, 41, 59, 0.95)';
	roundRect(ctx, 0, 0, W, H, 16);
	ctx.fill();

	// NFC icon circle
	ctx.beginPath();
	ctx.arc(40, H / 2, 22, 0, Math.PI * 2);
	ctx.fillStyle = '#3b82f6';
	ctx.fill();

	// NFC waves
	ctx.strokeStyle = '#ffffff';
	ctx.lineWidth = 2;
	ctx.beginPath();
	ctx.arc(40, H / 2, 8, -0.8, 0.8);
	ctx.stroke();
	ctx.beginPath();
	ctx.arc(40, H / 2, 14, -0.8, 0.8);
	ctx.stroke();

	// Text
	ctx.fillStyle = '#ffffff';
	ctx.font = 'bold 16px Inter, sans-serif';
	ctx.textAlign = 'left';
	ctx.fillText('NFC Tag Detected', 70, H / 2 - 8);

	ctx.fillStyle = '#94a3b8';
	ctx.font = '12px Inter, sans-serif';
	ctx.fillText('Tap to verify identity', 70, H / 2 + 10);
}

function drawQRScanner(ctx: CanvasRenderingContext2D, yOffset: number) {
	const W = PHONE_TEX_W;
	const H = SECTION_H;

	// Dark camera background
	ctx.fillStyle = '#0a0a0a';
	ctx.fillRect(0, yOffset, W, H);

	// Viewfinder brackets
	ctx.strokeStyle = '#ffffff';
	ctx.lineWidth = 4;
	const bracketSize = 40;
	const cx = W / 2;
	const cy = yOffset + H / 2;
	const boxSize = 120;

	// Top-left bracket
	ctx.beginPath();
	ctx.moveTo(cx - boxSize, cy - boxSize + bracketSize);
	ctx.lineTo(cx - boxSize, cy - boxSize);
	ctx.lineTo(cx - boxSize + bracketSize, cy - boxSize);
	ctx.stroke();

	// Top-right bracket
	ctx.beginPath();
	ctx.moveTo(cx + boxSize - bracketSize, cy - boxSize);
	ctx.lineTo(cx + boxSize, cy - boxSize);
	ctx.lineTo(cx + boxSize, cy - boxSize + bracketSize);
	ctx.stroke();

	// Bottom-left bracket
	ctx.beginPath();
	ctx.moveTo(cx - boxSize, cy + boxSize - bracketSize);
	ctx.lineTo(cx - boxSize, cy + boxSize);
	ctx.lineTo(cx - boxSize + bracketSize, cy + boxSize);
	ctx.stroke();

	// Bottom-right bracket
	ctx.beginPath();
	ctx.moveTo(cx + boxSize - bracketSize, cy + boxSize);
	ctx.lineTo(cx + boxSize, cy + boxSize);
	ctx.lineTo(cx + boxSize, cy + boxSize - bracketSize);
	ctx.stroke();

	// QR Code placeholder in center
	ctx.fillStyle = '#333333';
	ctx.fillRect(cx - 50, cy - 50, 100, 100);

	// "Scanning..." text
	ctx.fillStyle = '#ffffff';
	ctx.font = 'bold 24px Inter, sans-serif';
	ctx.textAlign = 'center';
	ctx.fillText('Scanning...', cx, cy + boxSize + 50);
}

function drawQRSuccess(ctx: CanvasRenderingContext2D, yOffset: number) {
	const W = PHONE_TEX_W;
	const H = SECTION_H;

	// Same dark background as scanner
	ctx.fillStyle = '#0a0a0a';
	ctx.fillRect(0, yOffset, W, H);

	// Viewfinder with yellow highlight
	const cx = W / 2;
	const cy = yOffset + H / 2;
	const boxSize = 120;

	// Yellow glow around QR
	ctx.fillStyle = '#fbbf24';
	ctx.globalAlpha = 0.3;
	ctx.fillRect(cx - boxSize - 10, cy - boxSize - 10, boxSize * 2 + 20, boxSize * 2 + 20);
	ctx.globalAlpha = 1;

	// Yellow border
	ctx.strokeStyle = '#fbbf24';
	ctx.lineWidth = 6;
	ctx.strokeRect(cx - boxSize, cy - boxSize, boxSize * 2, boxSize * 2);

	// QR Code
	ctx.fillStyle = '#333333';
	ctx.fillRect(cx - 50, cy - 50, 100, 100);

	// Yellow badge below
	ctx.fillStyle = '#fbbf24';
	ctx.beginPath();
	ctx.arc(cx, cy + boxSize + 40, 25, 0, Math.PI * 2);
	ctx.fill();

	// Checkmark in badge
	ctx.strokeStyle = '#000000';
	ctx.lineWidth = 4;
	ctx.lineCap = 'round';
	ctx.beginPath();
	ctx.moveTo(cx - 10, cy + boxSize + 40);
	ctx.lineTo(cx - 2, cy + boxSize + 48);
	ctx.lineTo(cx + 12, cy + boxSize + 32);
	ctx.stroke();
}

function drawHomeScreen(ctx: CanvasRenderingContext2D, yOffset: number) {
	const W = PHONE_TEX_W;
	const H = SECTION_H;

	// Gradient wallpaper
	const gradient = ctx.createLinearGradient(0, yOffset, 0, yOffset + H);
	gradient.addColorStop(0, '#1e3a5f');
	gradient.addColorStop(1, '#0f172a');
	ctx.fillStyle = gradient;
	ctx.fillRect(0, yOffset, W, H);

	// Status bar
	ctx.fillStyle = 'rgba(255,255,255,0.1)';
	ctx.fillRect(0, yOffset, W, 40);
	ctx.fillStyle = '#ffffff';
	ctx.font = 'bold 18px Inter, sans-serif';
	ctx.textAlign = 'center';
	ctx.fillText('9:41', W / 2, yOffset + 28);

	// App icon grid (4x5)
	const iconSize = 40;
	const padding = 12;
	const startX = 20;
	const startY = yOffset + 80;
	const cols = 4;
	const rows = 5;

	for (let row = 0; row < rows; row++) {
		for (let col = 0; col < cols; col++) {
			const x = startX + col * (iconSize + padding);
			const y = startY + row * (iconSize + padding + 10);

			// Icon background (rounded square)
			ctx.fillStyle = `hsl(${(row * cols + col) * 30}, 70%, 50%)`;
			roundRect(ctx, x, y, iconSize, iconSize, 10);
			ctx.fill();
		}
	}
}

function drawNFCNotification(ctx: CanvasRenderingContext2D, yOffset: number) {
	const W = PHONE_TEX_W;
	const H = SECTION_H;

	// First draw home screen as base
	drawHomeScreen(ctx, yOffset);

	// Notification banner at top
	const bannerY = yOffset + 50;
	const bannerH = 80;

	// Banner background (rounded)
	ctx.fillStyle = 'rgba(30, 41, 59, 0.95)';
	roundRect(ctx, 15, bannerY, W - 30, bannerH, 16);
	ctx.fill();

	// NFC icon circle
	ctx.beginPath();
	ctx.arc(55, bannerY + bannerH / 2, 22, 0, Math.PI * 2);
	ctx.fillStyle = '#3b82f6';
	ctx.fill();

	// NFC waves (simplified)
	ctx.strokeStyle = '#ffffff';
	ctx.lineWidth = 2;
	ctx.beginPath();
	ctx.arc(55, bannerY + bannerH / 2, 8, -0.8, 0.8);
	ctx.stroke();
	ctx.beginPath();
	ctx.arc(55, bannerY + bannerH / 2, 14, -0.8, 0.8);
	ctx.stroke();

	// Text
	ctx.fillStyle = '#ffffff';
	ctx.font = 'bold 18px Inter, sans-serif';
	ctx.textAlign = 'left';
	ctx.fillText('NFC Tag Detected', 85, bannerY + 35);

	ctx.fillStyle = '#94a3b8';
	ctx.font = '14px Inter, sans-serif';
	ctx.fillText('Tap to verify identity', 85, bannerY + 55);
}

function drawVerifyingOverlay(ctx: CanvasRenderingContext2D, yOffset: number) {
	const W = PHONE_TEX_W;
	const H = SECTION_H;

	// Dark overlay
	ctx.fillStyle = '#0f172a';
	ctx.fillRect(0, yOffset, W, H);

	// Spinner (static circle for now, animation via offset offset.y)
	const cx = W / 2;
	const cy = yOffset + H / 2 - 30;

	ctx.strokeStyle = '#3b82f6';
	ctx.lineWidth = 6;
	ctx.beginPath();
	ctx.arc(cx, cy, 40, 0, Math.PI * 1.5);
	ctx.stroke();

	// "Verifying..." text
	ctx.fillStyle = '#ffffff';
	ctx.font = 'bold 28px Inter, sans-serif';
	ctx.textAlign = 'center';
	ctx.fillText('Verifying...', cx, cy + 100);

	ctx.fillStyle = '#94a3b8';
	ctx.font = '20px Inter, sans-serif';
	ctx.fillText('Reading card data', cx, cy + 135);
}

function drawVerifiedScreen(ctx: CanvasRenderingContext2D, yOffset: number, name: string) {
	const W = PHONE_TEX_W;
	const H = SECTION_H;

	// Green background
	ctx.fillStyle = '#10b981';
	ctx.fillRect(0, yOffset, W, H);

	// Checkmark circle
	const cx = W / 2;
	const cy = yOffset + H * 0.35;

	ctx.beginPath();
	ctx.arc(cx, cy, 60, 0, Math.PI * 2);
	ctx.fillStyle = 'rgba(255,255,255,0.2)';
	ctx.fill();

	ctx.beginPath();
	ctx.arc(cx, cy, 42, 0, Math.PI * 2);
	ctx.fillStyle = '#ffffff';
	ctx.fill();

	// Checkmark
	ctx.strokeStyle = '#10b981';
	ctx.lineWidth = 7;
	ctx.lineCap = 'round';
	ctx.beginPath();
	ctx.moveTo(cx - 15, cy);
	ctx.lineTo(cx - 4, cy + 10);
	ctx.lineTo(cx + 18, cy - 15);
	ctx.stroke();

	// "Verified!" text
	ctx.fillStyle = '#ffffff';
	ctx.font = 'bold 40px Inter, sans-serif';
	ctx.textAlign = 'center';
	ctx.fillText('Verified!', cx, cy + 85);

	// Show name
	ctx.font = 'bold 24px Inter, sans-serif';
	ctx.fillStyle = 'rgba(255,255,255,0.95)';
	ctx.fillText(name, cx, cy + 125);

	ctx.font = '18px Inter, sans-serif';
	ctx.fillStyle = 'rgba(255,255,255,0.8)';
	ctx.fillText('Identity Confirmed', cx, cy + 155);
}

function drawProfileScreen(
	ctx: CanvasRenderingContext2D,
	yOffset: number,
	data: CardData,
	theme: LayoutTheme
) {
	const W = PHONE_TEX_W;
	const H = SECTION_H;
	const cx = W / 2;

	// Theme-based colors
	const themeConfig = {
		executive: {
			bg: '#0f172a',
			headerBg: '#1e293b',
			accent: '#fbbf24', // Gold
			text: '#ffffff',
			subtext: '#94a3b8',
			avatarBg: '#334155',
			rowBg: 'rgba(255,255,255,0.05)'
		},
		tech: {
			bg: '#0c1929',
			headerBg: '#1e3a5f',
			accent: '#3b82f6', // Blue
			text: '#ffffff',
			subtext: '#64748b',
			avatarBg: '#1e40af',
			rowBg: 'rgba(59,130,246,0.1)'
		},
		creative: {
			bg: '#1e1033',
			headerBg: '#2d1b4e',
			accent: '#a855f7', // Purple
			text: '#ffffff',
			subtext: '#a78bfa',
			avatarBg: '#6b21a8',
			rowBg: 'rgba(168,85,247,0.1)'
		},
		corporate: {
			bg: '#f9fafb',
			headerBg: '#ffffff',
			accent: '#10b981', // Green
			text: '#1e293b',
			subtext: '#64748b',
			avatarBg: '#cbd5e1',
			rowBg: 'rgba(0,0,0,0.03)'
		}
	};

	const colors = themeConfig[theme];

	// Background
	ctx.fillStyle = colors.bg;
	ctx.fillRect(0, yOffset, W, H);

	// Header gradient for executive/tech/creative
	if (theme !== 'corporate') {
		const headerGrad = ctx.createLinearGradient(0, yOffset, 0, yOffset + 140);
		headerGrad.addColorStop(0, colors.headerBg);
		headerGrad.addColorStop(1, colors.bg);
		ctx.fillStyle = headerGrad;
		ctx.fillRect(0, yOffset, W, 140);
	} else {
		ctx.fillStyle = colors.headerBg;
		ctx.fillRect(0, yOffset, W, 120);
	}

	// Avatar circle
	ctx.beginPath();
	ctx.arc(cx, yOffset + 85, 48, 0, Math.PI * 2);
	ctx.fillStyle = colors.avatarBg;
	ctx.fill();

	// Avatar accent ring
	ctx.strokeStyle = colors.accent;
	ctx.lineWidth = 3;
	ctx.stroke();

	// Initials in avatar
	const initials = data.name
		.split(' ')
		.map((n) => n[0])
		.join('')
		.toUpperCase()
		.slice(0, 2);
	ctx.fillStyle = colors.text;
	ctx.font = 'bold 32px Inter, sans-serif';
	ctx.textAlign = 'center';
	ctx.textBaseline = 'middle';
	ctx.fillText(initials, cx, yOffset + 88);
	ctx.textBaseline = 'alphabetic';

	// Name
	ctx.fillStyle = colors.text;
	ctx.font = 'bold 28px Inter, sans-serif';
	ctx.fillText(data.name, cx, yOffset + 165);

	// Title with badge style
	if (theme === 'executive') {
		// Gold badge for executives
		const titleWidth = ctx.measureText(data.title).width + 24;
		ctx.fillStyle = colors.accent;
		roundRect(ctx, cx - titleWidth / 2, yOffset + 178, titleWidth, 28, 6);
		ctx.fill();
		ctx.fillStyle = '#000000';
		ctx.font = 'bold 16px Inter, sans-serif';
		ctx.fillText(data.title, cx, yOffset + 197);
	} else {
		ctx.fillStyle = colors.subtext;
		ctx.font = '18px Inter, sans-serif';
		ctx.fillText(data.title, cx, yOffset + 195);
	}

	// Verified badge
	ctx.fillStyle = '#10b981';
	ctx.font = 'bold 14px Inter, sans-serif';
	ctx.fillText('✓ VERIFIED', cx, yOffset + 230);

	// Company name
	ctx.fillStyle = colors.subtext;
	ctx.font = '16px Inter, sans-serif';
	ctx.fillText('Kanaya', cx, yOffset + 255);

	// Data rows with theme styling
	const rowStart = yOffset + 290;
	const rowH = 50;
	const fields = ['Organization', 'Access', 'Status'];
	const values = ['Kanaya Corp', 'Full', 'Active'];

	for (let i = 0; i < fields.length; i++) {
		const y = rowStart + i * rowH;

		// Row background for dark themes
		if (theme !== 'corporate') {
			ctx.fillStyle = colors.rowBg;
			roundRect(ctx, 15, y - 18, W - 30, 38, 8);
			ctx.fill();
		}

		ctx.fillStyle = colors.subtext;
		ctx.font = '14px Inter, sans-serif';
		ctx.textAlign = 'left';
		ctx.fillText(fields[i], 25, y);

		ctx.fillStyle = colors.text;
		ctx.font = 'bold 14px Inter, sans-serif';
		ctx.textAlign = 'right';
		ctx.fillText(values[i], W - 25, y);

		// Divider for corporate theme
		if (theme === 'corporate') {
			ctx.fillStyle = '#e2e8f0';
			ctx.fillRect(15, y + 15, W - 30, 1);
		}
	}
}

// Helper for rounded rectangles
function roundRect(
	ctx: CanvasRenderingContext2D,
	x: number,
	y: number,
	w: number,
	h: number,
	r: number
) {
	ctx.beginPath();
	ctx.moveTo(x + r, y);
	ctx.lineTo(x + w - r, y);
	ctx.quadraticCurveTo(x + w, y, x + w, y + r);
	ctx.lineTo(x + w, y + h - r);
	ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
	ctx.lineTo(x + r, y + h);
	ctx.quadraticCurveTo(x, y + h, x, y + h - r);
	ctx.lineTo(x, y + r);
	ctx.quadraticCurveTo(x, y, x + r, y);
	ctx.closePath();
}

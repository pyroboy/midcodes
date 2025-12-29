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
 */

export const PHONE_TEX_W = 256;
export const PHONE_TEX_H = 3072; // 6 screens x 512 height
const SECTION_H = 512;

// Separate NFC Banner texture dimensions
export const NFC_BANNER_W = 220;
export const NFC_BANNER_H = 80;

export function drawScreenContent(ctx: CanvasRenderingContext2D) {
	const TEX_W = PHONE_TEX_W;

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
	drawVerifiedScreen(ctx, SECTION_H * 4);

	// === SCREEN 6 (Bottom): PROFILE SCREEN ===
	drawProfileScreen(ctx, SECTION_H * 5);
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

function drawVerifiedScreen(ctx: CanvasRenderingContext2D, yOffset: number) {
	const W = PHONE_TEX_W;
	const H = SECTION_H;

	// Green background
	ctx.fillStyle = '#10b981';
	ctx.fillRect(0, yOffset, W, H);

	// Checkmark circle
	const cx = W / 2;
	const cy = yOffset + H * 0.4;

	ctx.beginPath();
	ctx.arc(cx, cy, 70, 0, Math.PI * 2);
	ctx.fillStyle = 'rgba(255,255,255,0.2)';
	ctx.fill();

	ctx.beginPath();
	ctx.arc(cx, cy, 50, 0, Math.PI * 2);
	ctx.fillStyle = '#ffffff';
	ctx.fill();

	// Checkmark
	ctx.strokeStyle = '#10b981';
	ctx.lineWidth = 8;
	ctx.lineCap = 'round';
	ctx.beginPath();
	ctx.moveTo(cx - 18, cy);
	ctx.lineTo(cx - 5, cy + 12);
	ctx.lineTo(cx + 22, cy - 18);
	ctx.stroke();

	// "Verified!" text
	ctx.fillStyle = '#ffffff';
	ctx.font = 'bold 48px Inter, sans-serif';
	ctx.textAlign = 'center';
	ctx.fillText('Verified!', cx, cy + 100);

	ctx.font = '22px Inter, sans-serif';
	ctx.fillStyle = 'rgba(255,255,255,0.9)';
	ctx.fillText('Identity Confirmed', cx, cy + 135);
}

function drawProfileScreen(ctx: CanvasRenderingContext2D, yOffset: number) {
	const W = PHONE_TEX_W;
	const H = SECTION_H;

	// Light background
	ctx.fillStyle = '#f9fafb';
	ctx.fillRect(0, yOffset, W, H);

	// Header
	ctx.fillStyle = '#ffffff';
	ctx.fillRect(0, yOffset, W, 120);

	// Avatar
	const cx = W / 2;
	ctx.beginPath();
	ctx.arc(cx, yOffset + 90, 55, 0, Math.PI * 2);
	ctx.fillStyle = '#cbd5e1';
	ctx.fill();
	ctx.strokeStyle = '#ffffff';
	ctx.lineWidth = 6;
	ctx.stroke();

	// Name
	ctx.fillStyle = '#1e293b';
	ctx.font = 'bold 32px Inter, sans-serif';
	ctx.textAlign = 'center';
	ctx.fillText('Alex Morgan', cx, yOffset + 185);

	ctx.fillStyle = '#64748b';
	ctx.font = '18px Inter, sans-serif';
	ctx.fillText('Student • ID #2024-8821', cx, yOffset + 215);

	// Verified badge
	ctx.fillStyle = '#10b981';
	ctx.font = 'bold 16px Inter, sans-serif';
	ctx.fillText('✓ VERIFIED', cx, yOffset + 245);

	// Data rows
	const rowStart = yOffset + 290;
	const rowH = 50;
	const fields = ['Department', 'Valid Until', 'Access Level'];
	const values = ['Engineering', 'Dec 2025', 'Full'];

	for (let i = 0; i < fields.length; i++) {
		const y = rowStart + i * rowH;
		ctx.fillStyle = '#94a3b8';
		ctx.font = '16px Inter, sans-serif';
		ctx.textAlign = 'left';
		ctx.fillText(fields[i], 25, y);
		ctx.fillStyle = '#334155';
		ctx.textAlign = 'right';
		ctx.fillText(values[i], W - 25, y);
		ctx.fillStyle = '#e2e8f0';
		ctx.fillRect(15, y + 12, W - 30, 1);
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

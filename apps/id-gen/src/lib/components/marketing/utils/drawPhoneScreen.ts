/**
 * drawPhoneScreen.ts
 *
 * Canvas drawing logic for the PhoneMesh screen texture.
 * Layout: 3 screens stacked vertically
 * - Top (0.66-1.0): NFC Tap notification screen
 * - Middle (0.33-0.66): Verified success screen
 * - Bottom (0-0.33): Profile screen
 */

export const PHONE_TEX_W = 256;
export const PHONE_TEX_H = 1536; // 3x height for scrolling content

export function drawScreenContent(ctx: CanvasRenderingContext2D) {
	const TEX_W = PHONE_TEX_W;
	const TEX_H = PHONE_TEX_H;
	const SECTION_H = TEX_H / 3;

	// Fill background
	ctx.fillStyle = '#ffffff';
	ctx.fillRect(0, 0, TEX_W, TEX_H);

	// === TOP SECTION (0.66-1.0): NFC TAP NOTIFICATION ===
	const nfcOffset = 0;

	// Dark background (lock screen style)
	ctx.fillStyle = '#0f172a'; // Slate-900
	ctx.fillRect(0, nfcOffset, TEX_W, SECTION_H);

	// NFC notification banner
	const bannerY = nfcOffset + SECTION_H * 0.35;
	const bannerH = 140;

	// Banner background with rounded corners effect
	ctx.fillStyle = '#1e293b'; // Slate-800
	ctx.fillRect(20, bannerY, TEX_W - 40, bannerH);

	// NFC icon circle
	ctx.beginPath();
	ctx.arc(70, bannerY + bannerH / 2, 35, 0, Math.PI * 2);
	ctx.fillStyle = '#3b82f6'; // Blue-500
	ctx.fill();

	// NFC waves icon (simplified)
	ctx.strokeStyle = '#ffffff';
	ctx.lineWidth = 4;
	ctx.beginPath();
	ctx.arc(70, bannerY + bannerH / 2, 12, -0.8, 0.8);
	ctx.stroke();
	ctx.beginPath();
	ctx.arc(70, bannerY + bannerH / 2, 20, -0.8, 0.8);
	ctx.stroke();

	// Notification text
	ctx.fillStyle = '#ffffff';
	ctx.font = 'bold 28px Inter, sans-serif';
	ctx.textAlign = 'left';
	ctx.fillText('NFC Tag Detected', 115, bannerY + 50);

	ctx.fillStyle = '#94a3b8'; // Slate-400
	ctx.font = '22px Inter, sans-serif';
	ctx.fillText('Tap to verify identity', 115, bannerY + 85);

	// "Reading..." indicator
	ctx.fillStyle = '#3b82f6';
	ctx.font = 'bold 24px Inter, sans-serif';
	ctx.textAlign = 'center';
	ctx.fillText('Reading...', TEX_W / 2, bannerY + bannerH + 60);

	// === MIDDLE SECTION (0.33-0.66): VERIFIED SCREEN ===
	const verifiedOffset = SECTION_H;

	// Green Header / Status
	ctx.fillStyle = '#10b981'; // Green-500
	ctx.fillRect(0, verifiedOffset, TEX_W, SECTION_H);

	// Checkmark Circle
	ctx.beginPath();
	ctx.arc(TEX_W / 2, verifiedOffset + SECTION_H * 0.35, 80, 0, Math.PI * 2);
	ctx.fillStyle = 'rgba(255,255,255,0.2)';
	ctx.fill();
	ctx.beginPath();
	ctx.arc(TEX_W / 2, verifiedOffset + SECTION_H * 0.35, 60, 0, Math.PI * 2);
	ctx.fillStyle = '#ffffff';
	ctx.fill();

	// Checkmark Icon
	ctx.strokeStyle = '#10b981';
	ctx.lineWidth = 10;
	ctx.lineCap = 'round';
	ctx.beginPath();
	ctx.moveTo(TEX_W / 2 - 20, verifiedOffset + SECTION_H * 0.35);
	ctx.lineTo(TEX_W / 2 - 5, verifiedOffset + SECTION_H * 0.35 + 15);
	ctx.lineTo(TEX_W / 2 + 25, verifiedOffset + SECTION_H * 0.35 - 15);
	ctx.stroke();

	// Text "Verified"
	ctx.fillStyle = '#ffffff';
	ctx.font = 'bold 60px Inter, sans-serif';
	ctx.textAlign = 'center';
	ctx.fillText('Verified', TEX_W / 2, verifiedOffset + SECTION_H * 0.58);

	ctx.font = 'normal 30px Inter, sans-serif';
	ctx.fillStyle = 'rgba(255,255,255,0.9)';
	ctx.fillText('Identity Confirmed', TEX_W / 2, verifiedOffset + SECTION_H * 0.68);

	// === BOTTOM SECTION (0-0.33): PROFILE PAGE ===
	const profileOffset = SECTION_H * 2;

	ctx.fillStyle = '#f9fafb'; // Gray-50
	ctx.fillRect(0, profileOffset, TEX_W, SECTION_H);

	// Header Background
	ctx.fillStyle = '#ffffff';
	ctx.fillRect(0, profileOffset, TEX_W, 140);

	// Avatar
	ctx.beginPath();
	ctx.arc(TEX_W / 2, profileOffset + 100, 70, 0, Math.PI * 2);
	ctx.fillStyle = '#cbd5e1'; // Gray-300
	ctx.fill();
	ctx.strokeStyle = '#ffffff';
	ctx.lineWidth = 8;
	ctx.stroke();

	// Name
	ctx.fillStyle = '#1e293b'; // Slate-800
	ctx.font = 'bold 40px Inter, sans-serif';
	ctx.textAlign = 'center';
	ctx.fillText('Alex Morgan', TEX_W / 2, profileOffset + 220);

	ctx.fillStyle = '#64748b'; // Slate-500
	ctx.font = 'normal 24px Inter, sans-serif';
	ctx.fillText('Student • ID #2024-8821', TEX_W / 2, profileOffset + 255);

	// Verified badge
	ctx.fillStyle = '#10b981';
	ctx.font = 'bold 20px Inter, sans-serif';
	ctx.fillText('✓ VERIFIED', TEX_W / 2, profileOffset + 290);

	// Data Rows
	const rowStart = profileOffset + 340;
	const rowH = 60;
	const fields = ['Department', 'Valid Until', 'Access Level'];
	const values = ['Engineering', 'Dec 2025', 'Full'];

	for (let i = 0; i < fields.length; i++) {
		const y = rowStart + i * rowH;
		ctx.fillStyle = '#94a3b8';
		ctx.font = '22px Inter, sans-serif';
		ctx.textAlign = 'left';
		ctx.fillText(fields[i], 30, y);
		ctx.fillStyle = '#334155';
		ctx.textAlign = 'right';
		ctx.fillText(values[i], TEX_W - 30, y);
		ctx.fillStyle = '#e2e8f0';
		ctx.fillRect(20, y + 15, TEX_W - 40, 1);
	}
}

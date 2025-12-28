/**
 * drawPhoneScreen.ts
 *
 * Canvas drawing logic for the PhoneMesh screen texture.
 */

export const PHONE_TEX_W = 256;
export const PHONE_TEX_H = 1024; // 2x height for scrolling content, reduced from 2048

export function drawScreenContent(ctx: CanvasRenderingContext2D) {
	const TEX_W = PHONE_TEX_W;
	const TEX_H = PHONE_TEX_H;

	// Fill background
	ctx.fillStyle = '#ffffff';
	ctx.fillRect(0, 0, TEX_W, TEX_H);

	// --- TOP HALF: Verified Screen ---
	// Green Header / Status
	ctx.fillStyle = '#10b981'; // Green-500
	ctx.fillRect(0, 0, TEX_W, TEX_H * 0.5);

	// Checkmark Circle
	ctx.beginPath();
	ctx.arc(TEX_W / 2, TEX_H * 0.2, 80, 0, Math.PI * 2);
	ctx.fillStyle = 'rgba(255,255,255,0.2)';
	ctx.fill();
	ctx.beginPath();
	ctx.arc(TEX_W / 2, TEX_H * 0.2, 60, 0, Math.PI * 2);
	ctx.fillStyle = '#ffffff';
	ctx.fill();

	// Checkmark Icon (Simple paths)
	ctx.strokeStyle = '#10b981';
	ctx.lineWidth = 10;
	ctx.lineCap = 'round';
	ctx.beginPath();
	ctx.moveTo(TEX_W / 2 - 20, TEX_H * 0.2);
	ctx.lineTo(TEX_W / 2 - 5, TEX_H * 0.2 + 15);
	ctx.lineTo(TEX_W / 2 + 25, TEX_H * 0.2 - 15);
	ctx.stroke();

	// Text "Verified"
	ctx.fillStyle = '#ffffff';
	ctx.font = 'bold 60px Inter, sans-serif';
	ctx.textAlign = 'center';
	ctx.fillText('Verified', TEX_W / 2, TEX_H * 0.32);

	ctx.font = 'normal 30px Inter, sans-serif';
	ctx.fillStyle = 'rgba(255,255,255,0.9)';
	ctx.fillText('Identity Confirmed', TEX_W / 2, TEX_H * 0.36);

	// --- BOTTOM HALF: Profile Page ---
	const profileOffset = TEX_H * 0.5;
	ctx.fillStyle = '#f9fafb'; // Gray-50
	ctx.fillRect(0, profileOffset, TEX_W, TEX_H * 0.5);

	// Header Background
	ctx.fillStyle = '#ffffff';
	ctx.fillRect(0, profileOffset, TEX_W, 200);

	// Avatar
	ctx.beginPath();
	ctx.arc(TEX_W / 2, profileOffset + 150, 100, 0, Math.PI * 2);
	ctx.fillStyle = '#cbd5e1'; // Gray-300
	ctx.fill();
	ctx.strokeStyle = '#ffffff';
	ctx.lineWidth = 10;
	ctx.stroke();

	// Name
	ctx.fillStyle = '#1e293b'; // Slate-800
	ctx.font = 'bold 50px Inter, sans-serif';
	ctx.textAlign = 'center';
	ctx.fillText('Alex Morgan', TEX_W / 2, profileOffset + 320);

	ctx.fillStyle = '#64748b'; // Slate-500
	ctx.font = 'normal 30px Inter, sans-serif';
	ctx.fillText('Student • ID #2024-8821', TEX_W / 2, profileOffset + 360);

	// Data Rows
	const rowStart = profileOffset + 450;
	const rowH = 80;
	for (let i = 0; i < 4; i++) {
		const y = rowStart + i * rowH;
		// Label
		ctx.fillStyle = '#94a3b8';
		ctx.font = '30px Inter, sans-serif';
		ctx.textAlign = 'left';
		ctx.fillText('Field ' + (i + 1), 60, y);
		// Value
		ctx.fillStyle = '#334155';
		ctx.textAlign = 'right';
		ctx.fillText('Verified Data', TEX_W - 60, y);
		// Separator
		ctx.fillStyle = '#e2e8f0';
		ctx.fillRect(40, y + 20, TEX_W - 80, 2);
	}
}

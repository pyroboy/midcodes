/**
 * Exports the floor plan SVG to a PNG file.
 * Serializes the SVG element to a data URL, draws onto a 2x canvas, then triggers download.
 * Uses only native browser APIs — no external dependencies.
 */
export async function exportFloorPlanPng(
	svgEl: SVGSVGElement,
	filename: string = 'floorplan.png',
	scale: number = 2
): Promise<void> {
	const svgRect = svgEl.getBoundingClientRect();
	const w = svgRect.width * scale;
	const h = svgRect.height * scale;

	// 1. Serialize SVG to a blob URL
	const serializer = new XMLSerializer();
	let svgStr = serializer.serializeToString(svgEl);

	// Ensure the SVG has explicit width/height attributes for the Image renderer
	if (!svgEl.getAttribute('width') || svgEl.getAttribute('width') === '100%') {
		svgStr = svgStr.replace(
			/width="100%"/,
			`width="${svgRect.width}"`
		);
	}
	if (!svgEl.getAttribute('height') || svgEl.getAttribute('height') === '100%') {
		svgStr = svgStr.replace(
			/height="100%"/,
			`height="${svgRect.height}"`
		);
	}

	// Add xmlns if missing (required for standalone SVG rendering)
	if (!svgStr.includes('xmlns="http://www.w3.org/2000/svg"')) {
		svgStr = svgStr.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"');
	}

	const svgBlob = new Blob([svgStr], { type: 'image/svg+xml;charset=utf-8' });
	const svgUrl = URL.createObjectURL(svgBlob);

	// 2. Draw onto a canvas
	const canvas = document.createElement('canvas');
	canvas.width = w;
	canvas.height = h;
	const ctx = canvas.getContext('2d')!;

	// White background fill
	ctx.fillStyle = '#ffffff';
	ctx.fillRect(0, 0, w, h);

	await new Promise<void>((resolve, reject) => {
		const img = new Image();
		img.onload = () => {
			ctx.drawImage(img, 0, 0, w, h);
			URL.revokeObjectURL(svgUrl);
			resolve();
		};
		img.onerror = () => {
			URL.revokeObjectURL(svgUrl);
			reject(new Error('Failed to load SVG for PNG export'));
		};
		img.src = svgUrl;
	});

	// 3. Trigger download
	canvas.toBlob((blob) => {
		if (!blob) return;
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = filename;
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		URL.revokeObjectURL(url);
	}, 'image/png');
}

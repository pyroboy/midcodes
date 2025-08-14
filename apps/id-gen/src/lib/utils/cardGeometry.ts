import * as THREE from 'three';

export interface CardGeometry {
    frontGeometry: THREE.BufferGeometry;
    backGeometry: THREE.BufferGeometry;
    edgeGeometry: THREE.BufferGeometry;
}

let cachedGeometry: CardGeometry | null = null;

export function createRoundedRectCard(width = 2, height = 1.25, depth = 0.007, radius = 0.08): CardGeometry {
    // Return cached geometry if it exists
    if (cachedGeometry) {
        console.log('[CardGeometry] Using cached geometry');
        return cachedGeometry;
    }

    console.log('[CardGeometry] Creating new card geometry');
    const roundedRectShape = new THREE.Shape();
    
    const x = -width / 2;
    const y = -height / 2;
    const w = width;
    const h = height;
    const r = radius;

    roundedRectShape.moveTo(x + r, y);
    roundedRectShape.lineTo(x + w - r, y);
    roundedRectShape.bezierCurveTo(
        x + w - r / 2,
        y,
        x + w,
        y + r / 2,
        x + w,
        y + r
    );
    roundedRectShape.lineTo(x + w, y + h - r);
    roundedRectShape.bezierCurveTo(
        x + w,
        y + h - r / 2,
        x + w - r / 2,
        y + h,
        x + w - r,
        y + h
    );
    roundedRectShape.lineTo(x + r, y + h);
    roundedRectShape.bezierCurveTo(
        x + r / 2,
        y + h,
        x,
        y + h - r / 2,
        x,
        y + h - r
    );
    roundedRectShape.lineTo(x, y + r);
    roundedRectShape.bezierCurveTo(x, y + r / 2, x + r / 2, y, x + r, y);
    roundedRectShape.closePath();

    const extrudeSettings = {
        depth: depth,
        bevelEnabled: true,
        bevelThickness: 0.002,
        bevelSize: 0.002,
        bevelSegments: 2,
        steps: 1,
        curveSegments: 32
    };

    const geometry = new THREE.ExtrudeGeometry(roundedRectShape, extrudeSettings);

    const frontGeometry = new THREE.BufferGeometry();
    const backGeometry = new THREE.BufferGeometry();
    const edgeGeometry = new THREE.BufferGeometry();

    const position = geometry.getAttribute('position');
    const normal = geometry.getAttribute('normal');

    const frontPositions = [];
    const frontNormals = [];
    const frontUvs = [];
    const backPositions = [];
    const backNormals = [];
    const backUvs = [];
    const edgePositions = [];
    const edgeNormals = [];

    for (let i = 0; i < position.count; i++) {
        const normalZ = normal.getZ(i);
        const px = position.getX(i);
        const py = position.getY(i);
        const pz = position.getZ(i);
        const nx = normal.getX(i);
        const ny = normal.getY(i);
        const nz = normal.getZ(i);

        if (normalZ > 0.5) {
            frontPositions.push(px, py, pz);
            frontNormals.push(nx, ny, nz);
            frontUvs.push((px - x) / w, (py - y) / h);
        } else if (normalZ < -0.5) {
            backPositions.push(px, py, pz);
            backNormals.push(nx, ny, nz);
            backUvs.push(1 - (px - x) / w, (py - y) / h);
        } else {
            edgePositions.push(px, py, pz);
            edgeNormals.push(nx, ny, nz);
        }
    }

    frontGeometry.setAttribute('position', new THREE.Float32BufferAttribute(frontPositions, 3));
    frontGeometry.setAttribute('normal', new THREE.Float32BufferAttribute(frontNormals, 3));
    frontGeometry.setAttribute('uv', new THREE.Float32BufferAttribute(frontUvs, 2));

    backGeometry.setAttribute('position', new THREE.Float32BufferAttribute(backPositions, 3));
    backGeometry.setAttribute('normal', new THREE.Float32BufferAttribute(backNormals, 3));
    backGeometry.setAttribute('uv', new THREE.Float32BufferAttribute(backUvs, 2));

    edgeGeometry.setAttribute('position', new THREE.Float32BufferAttribute(edgePositions, 3));
    edgeGeometry.setAttribute('normal', new THREE.Float32BufferAttribute(edgeNormals, 3));

    // Cache the geometry for future use
    cachedGeometry = {
        frontGeometry,
        backGeometry,
        edgeGeometry
    };

    console.log('[CardGeometry] Card geometry created and cached successfully');
    return cachedGeometry;
}

export function getCardGeometry(): CardGeometry | null {
    return cachedGeometry;
}

export function preloadCardGeometry(): CardGeometry {
    return createRoundedRectCard();
}
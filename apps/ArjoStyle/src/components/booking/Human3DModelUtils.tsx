import * as THREE from 'three';
import { BodyPartMapping, BodyPartMappings } from '../../types/mapping';


// // Helper function to load mappings from localStorage
// export const loadStoredMappings = (): BodyPartMappings | null => {
//   try {
//     const storedMappings = localStorage.getItem('bodyPartMappings');
//     if (storedMappings) {
//       return JSON.parse(storedMappings);
//     }
//   } catch (error) {
//     console.error('Error loading stored mappings:', error);
//   }
//   return null;
// };

// Helper function to create coordinate text for debugging
export const createCoordinateText = ([x, y, z]: [number, number, number], label: string): THREE.Mesh => {
  const canvas = document.createElement('canvas');
  canvas.width = 100;
  canvas.height = 50;
  const context = canvas.getContext('2d');
  if (context) {
    context.fillStyle = 'white';
    context.font = '12px Arial';
    context.fillText(`${label}: ${x.toFixed(2)}, ${y.toFixed(2)}, ${z.toFixed(2)}`, 5, 20);
  }
  
  const texture = new THREE.CanvasTexture(canvas);
  const material = new THREE.MeshBasicMaterial({ map: texture, transparent: true });
  const geometry = new THREE.PlaneGeometry(0.1, 0.05);
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(x, y, z);
  
  return mesh;
};

// Simple debounce function
export function debounce<T extends (...args: unknown[]) => void>(
  func: T,
  wait: number
): (...args: unknown[]) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  return (...args: unknown[]) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => {
      func(...args);
    }, wait) as unknown as ReturnType<typeof setTimeout>; // Type assertion needed for Node.js vs browser types
  };
}

// Helper function to handle window resize

// Helper function to dispose of materials and their textures
export const disposeMaterial = (material: THREE.Material) => {
  // Dispose textures
  Object.keys(material).forEach(prop => {
    if (material[prop] && material[prop].isTexture) {
      material[prop].dispose();
    }
  });
  
  // Dispose material
  material.dispose();
};

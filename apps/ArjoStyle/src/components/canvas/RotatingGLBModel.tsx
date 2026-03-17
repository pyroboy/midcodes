import React, { useRef, Suspense, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Center, useGLTF, Environment, Stage } from '@react-three/drei';
import * as THREE from 'three';

// URL of your GLB model on Cloudinary
const MODEL_URL = 'https://res.cloudinary.com/dexcw6vg0/image/upload/v1745389267/namzbtue3hvhtht5lqi2.glb';

// Preload the model
useGLTF.preload(MODEL_URL);

// We're not using MeshReflectorMaterial due to TypeScript issues
// Instead, we'll use MeshStandardMaterial directly in the scene traversal

export function RotatingGLBModel() {
  const groupRef = useRef<THREE.Group>(null);
  const { scene } = useGLTF(MODEL_URL);
  
  // Apply chrome material to all meshes in the scene
  useEffect(() => {
    if (scene) {
      // Create a chrome-like material using MeshStandardMaterial
      // without the clearcoat property (which was causing TS errors)
      const chromeMaterial = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        metalness: 1.0,
        roughness: 0.1,
        envMapIntensity: 1.0
      });
      
      scene.traverse((child) => {
        // Type guard to check if the object is a mesh
        if (child instanceof THREE.Mesh) {
          child.material = chromeMaterial;
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });
    }
  }, [scene]);

  // Rotate the model
  useFrame((state, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.2;
    }
  });

  return (
    <>
      {/* Three-Point Lighting Setup */}
      {/* Key Light - Main illumination (typically from front-right) */}
      <directionalLight 
        position={[10, 10, 5]} 
        intensity={1} 
        color="#ffffff"
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />
      
      {/* Fill Light - Softens shadows (typically opposite of key light) */}
      <directionalLight 
        position={[-7, 5, -5]} 
        intensity={0.5} 
        color="#b0d8ff" 
      />
      
      {/* Back Light/Rim Light - Creates separation from background */}
      <directionalLight 
        position={[0, 8, -12]} 
        intensity={0.7} 
        color="#fffaf0" 
      />
      
      {/* Subtle ambient light to ensure nothing is too dark */}
      <ambientLight intensity={0.4} />

      {/* Environment map for realistic reflections */}
      <Environment preset="studio" />
      
      {/* Stage for better presentation */}
      <Stage 
        intensity={0.1} 
        shadows={true}
        environment="studio" 
        preset="rembrandt"
      >
        <group ref={groupRef}>
          <primitive 
            object={scene} 
            scale={0.04} 
            position={[0, -1, 0]} 
          />
        </group>
      </Stage>
    </>
  );
}

// Example Usage (You'd typically put this in your main App or Scene component)
/*
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';

function App() {
  return (
    <div style={{ width: '100%', height: '100vh' }}>
      <Canvas shadows camera={{ position: [0, 0, 10], fov: 45 }}>
        <color attach="background" args={['#1a1a1a']} />
        <fog attach="fog" args={['#1a1a1a', 10, 20]} />
        <Suspense fallback={null}>
          <RotatingGLBModel />
        </Suspense>
        <OrbitControls />
      </Canvas>
    </div>
  );
}

export default App;
*/
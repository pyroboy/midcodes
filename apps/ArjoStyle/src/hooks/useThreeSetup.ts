// src/hooks/useThreeSetup.ts (Simplified & More Robust)

import React, { useRef, useEffect, useState, useCallback } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
// Removed unused import: import { disposeMaterial } from "../components/booking/Human3DModelUtils";

export function useThreeSetup(
  containerRef: React.RefObject<HTMLDivElement>,
  editMode: boolean
): {
  sceneRef: React.MutableRefObject<THREE.Scene | null>;
  cameraRef: React.MutableRefObject<THREE.PerspectiveCamera | null>;
  rendererRef: React.MutableRefObject<THREE.WebGLRenderer | null>;
  controlsRef: React.MutableRefObject<OrbitControls | null>;
  // Removed resetPixelRatio and isResizing from return if not needed externally after simplification
} {
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const animationFrameRef = useRef<number>(0);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);

// Main setup effect
useEffect(() => {
  const logPrefix = "[useThreeSetup Effect]";
  // --- FIX: Capture containerRef.current early ---
  const container = containerRef.current;
  // ---------------------------------------------

  if (!container) { // Check the captured variable
    console.warn(`${logPrefix} Container ref not available yet.`);
    return;
  }
  let localRenderer: THREE.WebGLRenderer | null = null; // Use local variable for cleanup safety

  // --- Initialize Scene ---
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xf0f0f0); // Light grey background
  sceneRef.current = scene;
  console.log(`${logPrefix} Scene initialized.`);

  // --- Initialize Camera ---
  const camera = new THREE.PerspectiveCamera(
    45, // Field of View
    container.clientWidth / container.clientHeight, // Aspect Ratio
    0.1, // Near clipping plane
    100 // Far clipping plane (adjust if needed)
  );
  camera.position.set(0, 0.5, 3); // Positioned back, slightly up
  camera.lookAt(0, 0.5, 0); // Look slightly down towards origin center y=0.5
  cameraRef.current = camera;
  console.log(`${logPrefix} Camera initialized.`);

  // --- Initialize Renderer ---
  try {
      localRenderer = new THREE.WebGLRenderer({
        antialias: true, // Enable anti-aliasing
        // preserveDrawingBuffer: true, // Keep if screenshot needed, slight perf cost
      });
      localRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      localRenderer.setSize(container.clientWidth, container.clientHeight);
      localRenderer.outputColorSpace = THREE.SRGBColorSpace; // Correct colorspace
      // Use the captured 'container' variable for appending
      container.appendChild(localRenderer.domElement);
      rendererRef.current = localRenderer;
      console.log(`${logPrefix} Renderer initialized and appended.`);
  } catch (error) {
      console.error(`${logPrefix} Failed to initialize WebGL Renderer:`, error);
      return; // Stop setup if renderer fails
  }


  // --- Initialize Controls ---
  const controls = new OrbitControls(camera, localRenderer.domElement);
  controls.enablePan = !editMode; // Allow panning only if NOT in edit mode
  controls.enableDamping = true; // Smooth camera movement
  controls.dampingFactor = 0.1; // Adjust damping strength
  controls.minDistance = 0.5; // How close the camera can get
  controls.maxDistance = 10; // How far the camera can get
  controls.target.set(0, 0.5, 0); // Set target slightly above origin floor
  controls.update();
  controlsRef.current = controls;
  console.log(`${logPrefix} OrbitControls initialized.`);

  // --- Add Lights ---
  scene.add(new THREE.AmbientLight(0xffffff, 0.7)); // Softer ambient light
  const dirLight = new THREE.DirectionalLight(0xffffff, 1.0);
  dirLight.position.set(5, 10, 7.5); // Position light source
  scene.add(dirLight);
  console.log(`${logPrefix} Lights added.`);

  // --- Simple Resize Handling ---
  const handleResize = () => {
    // Use captured 'container' if needed, but refs are fine here for reading dimensions
    const currentContainer = containerRef.current;
    const currentCamera = cameraRef.current;
    const currentRenderer = rendererRef.current;

    if (!currentContainer || !currentCamera || !currentRenderer) return;

    const width = currentContainer.clientWidth;
    const height = currentContainer.clientHeight;

    if (width > 0 && height > 0) {
      console.log(`[handleResize] Resizing to ${width}x${height}`);
      currentCamera.aspect = width / height;
      currentCamera.updateProjectionMatrix();
      currentRenderer.setSize(width, height);
    } else {
       console.warn(`[handleResize] Invalid dimensions: ${width}x${height}. Skipping update.`);
    }
  };

  // Use ResizeObserver for efficient resize detection
  const observer = new ResizeObserver(handleResize);
  // Use the captured 'container' variable for observing
  observer.observe(container);
  resizeObserverRef.current = observer;
  console.log(`${logPrefix} ResizeObserver attached.`);

  // --- Animation Loop (Ensures continuous rendering) ---
  // let frameCount = 0; // Uncomment for logging
  const animate = () => {
    animationFrameRef.current = requestAnimationFrame(animate);

    const currentControls = controlsRef.current;
    const currentRenderer = rendererRef.current;
    const currentScene = sceneRef.current;
    const currentCamera = cameraRef.current;

    currentControls?.update(); // Update controls first

    if (currentRenderer && currentScene && currentCamera) {
      currentRenderer.render(currentScene, currentCamera); // Then render
    } else {
      console.error(`${logPrefix} Missing renderer, scene, or camera in animate loop! Stopping.`);
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    }

    // Optional: Log periodically to confirm loop is running
    // frameCount++;
    // if (frameCount % 300 === 0) { // e.g., Log every 5 seconds
    //   console.log('[useThreeSetup] Render loop running...');
    // }
  };

  // Call handleResize once initially to set correct size
  handleResize();
  // Start the animation loop
  animate();
  console.log(`${logPrefix} Initial resize executed and animation loop started.`);

  // --- Cleanup Function ---
  return () => {
    const cleanupPrefix = "[useThreeSetup Cleanup]";
    console.log(`${cleanupPrefix} Starting cleanup...`);

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = 0;
      console.log(`${cleanupPrefix} Animation frame cancelled.`);
    }

    if (resizeObserverRef.current) {
      resizeObserverRef.current.disconnect();
      resizeObserverRef.current = null;
      console.log(`${cleanupPrefix} ResizeObserver disconnected.`);
    }

    if (controlsRef.current) {
      controlsRef.current.dispose();
      controlsRef.current = null;
      console.log(`${cleanupPrefix} Controls disposed.`);
    }

    if (sceneRef.current) {
      while (sceneRef.current.children.length > 0) {
        const object = sceneRef.current.children[0];
        sceneRef.current.remove(object);
        if (object instanceof THREE.Mesh) {
          object.geometry?.dispose();
          if (Array.isArray(object.material)) {
            object.material.forEach((mat) => mat?.dispose());
          } else {
            object.material?.dispose();
          }
        }
      }
      sceneRef.current = null;
      console.log(`${cleanupPrefix} Scene contents cleared.`);
    }

    // Dispose renderer and remove canvas
    const rendererToDispose = rendererRef.current;
    // --- FIX: Use the captured 'container' variable in cleanup ---
    if (rendererToDispose && container) { // Check if captured container exists
        console.log(`${cleanupPrefix} Disposing renderer...`);
        rendererToDispose.dispose();
        // Use the 'container' variable here
        if (rendererToDispose.domElement.parentNode === container) {
            container.removeChild(rendererToDispose.domElement);
            console.log(`${cleanupPrefix} Renderer DOM element removed.`);
        } else {
             console.log(`${cleanupPrefix} Renderer DOM element already removed or parent changed.`);
        }
        rendererRef.current = null;
    }
    // ----------------------------------------------------------

    cameraRef.current = null;
    console.log(`${cleanupPrefix} Cleanup complete.`);
  };
  // Dependencies: editMode affects controls. containerRef needed for setup.
}, [containerRef, editMode]); // Simplified dependencies
  // Effect to specifically update controls based on editMode
  // This ensures controls.enablePan changes without tearing down the whole scene
  useEffect(() => {
    if (controlsRef.current) {
      controlsRef.current.enablePan = !editMode;
       console.log(`[useThreeSetup editMode Effect] Setting enablePan to: ${!editMode}`);
    }
  }, [editMode]);

  // Return only the refs needed externally now
  return {
    sceneRef,
    cameraRef,
    rendererRef,
    controlsRef,
  };
}
// src/components/three/HighlightSphere.tsx
import {
  useRef,
  useMemo,
  forwardRef,
  useImperativeHandle,
  useEffect,
} from "react";
import * as THREE from "three";
import { Text } from "@react-three/drei";
import { ThreeEvent, useFrame } from "@react-three/fiber";

// --- Interface Definition ---
interface HighlightSphereProps {
  highlightColor: THREE.Color;
  highlightOpacity: number;
  targetScale: number;
  debugTextPosition?: THREE.Vector3 | [number, number, number];
  debugTextScale?: number;
  editMode: boolean;
  lightIntensity?: number;
  onPointerDown?: (event: ThreeEvent<PointerEvent>) => void;
  onPointerMove?: (event: ThreeEvent<PointerEvent>) => void;
  onPointerUp?: (event: ThreeEvent<PointerEvent>) => void;
}

// --- Constants ---
const STYLE_SMOOTHING_FACTOR = 7.0;
const LERP_THRESHOLD = 0.01;
const DEFAULT_LIGHT_INTENSITY = 0.06;
const SPHERE_RADIUS = 0.5;
const MIN_VISIBLE_SCALE_SQ = 0.000001;

// --- Component Definition ---
export const HighlightSphere = forwardRef<THREE.Mesh, HighlightSphereProps>(
  (
    {
      highlightColor,
      highlightOpacity,
      targetScale,
      debugTextPosition,
      debugTextScale = 0,
      editMode,
      lightIntensity = DEFAULT_LIGHT_INTENSITY,
      onPointerDown,
      onPointerMove,
      onPointerUp,
    },
    ref
  ) => {
    const localRef = useRef<THREE.Mesh>(null!);
    const pointLightRef = useRef<THREE.PointLight>(null!);
    const materialRef = useRef<THREE.MeshBasicMaterial>(null!);
    const currentState = useRef({
      currentColor: new THREE.Color(),
      currentOpacity: 0,
      currentScale: 0,
      isInitialized: false
    });
    
    useImperativeHandle(ref, () => localRef.current);

    // --- Initial Setup ---
    useEffect(() => {
      if (!localRef.current) return;
      
      const mesh = localRef.current;
      const material = mesh.material as THREE.MeshBasicMaterial;
      materialRef.current = material;
      
      // Only do full initialization if not already initialized
      if (!currentState.current.isInitialized) {
        material.color.copy(highlightColor);
        material.opacity = highlightOpacity;
        material.transparent = highlightOpacity < 1.0;
        mesh.scale.setScalar(targetScale);
        mesh.visible = targetScale * targetScale > MIN_VISIBLE_SCALE_SQ;
        
        if (pointLightRef.current) {
          pointLightRef.current.color.copy(highlightColor);
          pointLightRef.current.intensity = lightIntensity * highlightOpacity;
          pointLightRef.current.distance = SPHERE_RADIUS * targetScale * 8;
        }
        
        // Store initial state
        currentState.current.currentColor.copy(highlightColor);
        currentState.current.currentOpacity = highlightOpacity;
        currentState.current.currentScale = targetScale;
        currentState.current.isInitialized = true;
      }
    }, [highlightColor, highlightOpacity, targetScale, lightIntensity]);

    // --- Frame Loop with Optimizations ---
    useFrame((state, delta) => {
      if (!localRef.current || !materialRef.current) return;
      
      const mesh = localRef.current;
      const material = materialRef.current;
      const current = currentState.current;
      
      // Skip processing if no updates needed
      const colorNeedsUpdate = !current.currentColor.equals(highlightColor);
      const opacityDiff = Math.abs(current.currentOpacity - highlightOpacity);
      const opacityNeedsUpdate = opacityDiff > Number.EPSILON;
      const scaleDiff = Math.abs(current.currentScale - targetScale);
      const scaleNeedsUpdate = scaleDiff > Number.EPSILON;
      
      // Skip frame if nothing needs updating
      if (!colorNeedsUpdate && !opacityNeedsUpdate && !scaleNeedsUpdate && current.isInitialized) {
        return;
      }
      
      // Optimize light positioning - only update when needed or every few frames
      if (pointLightRef.current && state.camera && (colorNeedsUpdate || opacityNeedsUpdate || scaleNeedsUpdate)) {
        const cameraDirection = new THREE.Vector3();
        cameraDirection.subVectors(state.camera.position, mesh.position).normalize();
        const currentRadius = SPHERE_RADIUS * mesh.scale.x;
        cameraDirection.multiplyScalar(currentRadius * 0.6);
        pointLightRef.current.position.copy(cameraDirection);
        
        // Only update light distance when scale changes
        if (scaleNeedsUpdate) {
          pointLightRef.current.distance = currentRadius * 8;
        }
      }

      // Calculate lerp factor once
      const dt = Math.min(delta, 0.05);
      const lerpAlpha = 1 - Math.exp(-STYLE_SMOOTHING_FACTOR * dt);

      // --- Color Interpolation (only when needed) ---
      if (colorNeedsUpdate) {
        material.color.lerp(highlightColor, lerpAlpha);
        const rDiff = material.color.r - highlightColor.r;
        const gDiff = material.color.g - highlightColor.g;
        const bDiff = material.color.b - highlightColor.b;
        const colorDistanceSq = rDiff * rDiff + gDiff * gDiff + bDiff * bDiff;
        
        if (colorDistanceSq < LERP_THRESHOLD * LERP_THRESHOLD) {
          material.color.copy(highlightColor);
        }
        
        if (pointLightRef.current) {
          pointLightRef.current.color.copy(material.color);
        }
        
        current.currentColor.copy(material.color);
      }

      // --- Opacity Interpolation (only when needed) ---
      if (opacityNeedsUpdate) {
        material.opacity = THREE.MathUtils.lerp(material.opacity, highlightOpacity, lerpAlpha);
        
        if (Math.abs(material.opacity - highlightOpacity) < LERP_THRESHOLD) {
          material.opacity = highlightOpacity;
        }
        
        const isTransparent = material.opacity < 1.0 - Number.EPSILON;
        if (material.transparent !== isTransparent) {
          material.transparent = isTransparent;
          material.needsUpdate = true;
        }
        
        if (pointLightRef.current) {
          pointLightRef.current.intensity = lightIntensity * material.opacity;
        }
        
        current.currentOpacity = material.opacity;
      }

      // --- Scale Interpolation (only when needed) ---
      if (scaleNeedsUpdate) {
        const newScale = THREE.MathUtils.lerp(mesh.scale.x, targetScale, lerpAlpha);
        
        if (Math.abs(newScale - targetScale) < LERP_THRESHOLD) {
          mesh.scale.setScalar(targetScale);
        } else {
          mesh.scale.setScalar(newScale);
        }
        
        // Only update visibility on significant scale changes
        const scaleSq = mesh.scale.x * mesh.scale.x;
        const shouldBeVisible = scaleSq > MIN_VISIBLE_SCALE_SQ;
        if (mesh.visible !== shouldBeVisible) {
          mesh.visible = shouldBeVisible;
        }
        
        current.currentScale = mesh.scale.x;
      }
    });

    // --- Debug Text Calculations ---
    const textDisplayPosition = useMemo(() => {
      if (!debugTextPosition) return new THREE.Vector3();
      
      const pos = new THREE.Vector3();
      if (debugTextPosition instanceof THREE.Vector3) {
        pos.copy(debugTextPosition);
      } else if (Array.isArray(debugTextPosition)) {
        pos.set(...debugTextPosition);
      }
      
      pos.y += SPHERE_RADIUS + 0.05;
      return pos;
    }, [debugTextPosition]);

    const positionTextString = useMemo(() => {
      if (!debugTextPosition) return "";
      
      const posArray =
        debugTextPosition instanceof THREE.Vector3
          ? debugTextPosition.toArray()
          : debugTextPosition;
          
      if (!Array.isArray(posArray)) return "";
      
      const scaleStr = typeof debugTextScale === 'number' ? ` | Scale: ${debugTextScale.toFixed(3)}` : '';
      return `Pos: [${posArray.map((p) => p.toFixed(2)).join(", ")}]${scaleStr}`;
    }, [debugTextPosition, debugTextScale]);

    // --- Render ---
    return (
      <group>
        <mesh
          ref={localRef}
          onPointerDown={editMode ? onPointerDown : undefined}
          onPointerMove={editMode ? onPointerMove : undefined}
          onPointerUp={editMode ? onPointerUp : undefined}
          renderOrder={999}
        >
          <sphereGeometry args={[SPHERE_RADIUS, 32, 16]} />
          <meshBasicMaterial
            depthTest={false}
            depthWrite={false}
            side={THREE.FrontSide}
          />
          <pointLight
            ref={pointLightRef}
            decay={2}
          />
        </mesh>

        {editMode && debugTextPosition && (
          <Text
            position={textDisplayPosition}
            fontSize={0.035}
            color="black"
            anchorX="center"
            anchorY="middle"
            outlineWidth={0.002}
            outlineColor="white"
            renderOrder={1000}
          >
            {positionTextString}
          </Text>
        )}
      </group>
    );
  }
);

HighlightSphere.displayName = "HighlightSphere";
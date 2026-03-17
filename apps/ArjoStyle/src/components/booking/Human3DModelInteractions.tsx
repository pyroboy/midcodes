import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { BodyPartMapping } from '../../types/mapping';

// Types for interaction handlers
interface InteractionHandlers {
  handleMouseDown: (event: MouseEvent) => void;
  handleMouseMove: (event: MouseEvent) => void;
  handleMouseUp: () => void;
}

// Types for interaction dependencies
interface InteractionDependencies {
  containerRef: React.RefObject<HTMLDivElement>;
  rendererRef: React.RefObject<THREE.WebGLRenderer | null>;
  cameraRef: React.RefObject<THREE.PerspectiveCamera | null>;
  controlsRef: React.RefObject<OrbitControls | null>;
  highlightRef: React.RefObject<THREE.Mesh | null>;
  modelRef: React.RefObject<THREE.Group | null>;
  isModelLoaded: boolean;
  editMode: boolean;
  selectedCategory: string;
  currentPlacement: string;
  bodyPartMapping: BodyPartMapping;
  onMappingUpdate?: (category: string, placement: string, mapping: BodyPartMapping) => void;
}

// Create interaction handlers
export const createInteractionHandlers = (
  deps: InteractionDependencies
): InteractionHandlers => {
  // Shared state for dragging operations
  let isDragging = false;
  let dragType: 'position' | 'rotation' | 'scale' | null = null;
  const dragStartPoint = new THREE.Vector3();
  const dragCurrentPoint = new THREE.Vector3();
  
  // Mouse raycaster for interaction
  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();

  // Handle mouse down
  const handleMouseDown = (event: MouseEvent) => {
    if (!deps.editMode || !deps.isModelLoaded || !deps.containerRef.current || 
        !deps.rendererRef.current || !deps.cameraRef.current || !deps.highlightRef.current) {
      return;
    }
    
    // Get container bounds
    const rect = deps.containerRef.current.getBoundingClientRect();
    
    // Calculate mouse position in normalized device coordinates (-1 to +1)
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    
    // Update the raycaster
    raycaster.setFromCamera(mouse, deps.cameraRef.current);
    
    // Check if we're interacting with the highlight mesh
    const intersects = raycaster.intersectObject(deps.highlightRef.current);
    
    if (intersects.length > 0) {
      // Determine drag type based on which part of the highlight was clicked
      const intersectionPoint = intersects[0].point;
      
      // Get the center of the highlight
      const highlightCenter = new THREE.Vector3();
      deps.highlightRef.current.getWorldPosition(highlightCenter);
      
      // Calculate distance from center
      const distFromCenter = intersectionPoint.distanceTo(highlightCenter);
      
      // If we're near the edge, we're scaling
      if (distFromCenter > deps.bodyPartMapping.scale * 0.8) {
        dragType = 'scale';
        document.body.style.cursor = 'nwse-resize';
      } 
      // If we're near the center, we're rotating
      else if (distFromCenter < deps.bodyPartMapping.scale * 0.3) {
        dragType = 'rotation';
        document.body.style.cursor = 'grab';
      } 
      // Otherwise we're moving
      else {
        dragType = 'position';
        document.body.style.cursor = 'move';
      }
      
      // Start dragging
      isDragging = true;
      
      // Store the start point
      dragStartPoint.copy(intersectionPoint);
      
      // Disable orbit controls while dragging
      if (deps.controlsRef.current) {
        deps.controlsRef.current.enabled = false;
      }
      
      event.preventDefault();
    }
  };

  // Handle mouse move
  const handleMouseMove = (event: MouseEvent) => {
    if (!isDragging || !dragType || !deps.editMode || !deps.isModelLoaded || 
        !deps.containerRef.current || !deps.rendererRef.current || 
        !deps.cameraRef.current || !deps.onMappingUpdate) {
      return;
    }
    
    // Get container bounds
    const rect = deps.containerRef.current.getBoundingClientRect();
    
    // Calculate mouse position in normalized device coordinates (-1 to +1)
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    
    // Update the raycaster
    raycaster.setFromCamera(mouse, deps.cameraRef.current);
    
    // Create a plane at the highlight position
    const planeNormal = new THREE.Vector3(0, 0, 1).applyQuaternion(deps.cameraRef.current.quaternion);
    const highlightPosition = new THREE.Vector3(
      deps.bodyPartMapping.position[0],
      deps.bodyPartMapping.position[1],
      deps.bodyPartMapping.position[2]
    );
    const plane = new THREE.Plane().setFromNormalAndCoplanarPoint(planeNormal, highlightPosition);
    
    // Find the intersection point with the plane
    const intersectionPoint = new THREE.Vector3();
    raycaster.ray.intersectPlane(plane, intersectionPoint);
    
    if (intersectionPoint) {
      // Update current drag point
      dragCurrentPoint.copy(intersectionPoint);
      
      // Clone the mapping to avoid direct mutation
      const mapping = { ...deps.bodyPartMapping };
      
      // Handle different drag types
      if (dragType === 'position') {
        // Calculate movement delta
        const delta = new THREE.Vector3().subVectors(dragCurrentPoint, dragStartPoint);
        
        // Update position
        mapping.position = [
          mapping.position[0] + delta.x,
          mapping.position[1] + delta.y,
          mapping.position[2] + delta.z
        ];
        
        // Update start point for next move
        dragStartPoint.copy(dragCurrentPoint);
      } else if (dragType === 'scale') {
        // Calculate scale delta based on distance from center
        const center = new THREE.Vector3(
          mapping.position[0],
          mapping.position[1],
          mapping.position[2]
        );
        
        const startDist = dragStartPoint.distanceTo(center);
        const currentDist = dragCurrentPoint.distanceTo(center);
        
        const scaleFactor = currentDist / startDist;
        
        // Update scale
        mapping.scale = Math.max(0.01, mapping.scale * scaleFactor);
        
        // Update start point for next move
        dragStartPoint.copy(dragCurrentPoint);
      }
      
      // Update the mapping
      deps.onMappingUpdate(deps.selectedCategory, deps.currentPlacement, mapping);
      
      event.preventDefault();
    }
  };
  
  // Handle mouse up
  const handleMouseUp = () => {
    if (isDragging) {
      // Stop dragging
      isDragging = false;
      
      // Reset cursor
      document.body.style.cursor = 'auto';
      
      // Re-enable orbit controls
      if (deps.controlsRef.current) {
        deps.controlsRef.current.enabled = true;
      }
    }
  };

  return {
    handleMouseDown,
    handleMouseMove,
    handleMouseUp
  };
};

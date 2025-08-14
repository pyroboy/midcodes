<script lang="ts">
	import { T } from '@threlte/core';
	import * as THREE from 'three';

	const uniforms = {
		time: { value: 0.0 },
		// Stroke width
		thickness: { value: 0.1 }
	};

	// Simple animation loop for the spinner
	let animationId: number | null = null;
	
	function animate() {
		uniforms.time.value += 0.016 * 2; // Assuming 60fps
		animationId = requestAnimationFrame(animate);
	}
	
	// Start animation
	$effect(() => {
		animate();
		return () => {
			if (animationId) {
				cancelAnimationFrame(animationId);
			}
		};
	});

	// GLSL for the spinner shader
	const fragmentShader = `
    uniform float time;
    uniform float thickness;
    varying vec2 vUv;

    #define PI 3.14159265359

    void main() {
        vec2 centerUv = vUv - 0.5;
        float radius = length(centerUv);
        float angle = atan(centerUv.y, centerUv.x);

        // Create a rotating "pac-man" cutout
        float angle_offset = (sin(time) + 1.0) * PI * 0.2;
        float start_angle = time;
        float end_angle = time + PI * 1.8;
        
        // Add a "breathing" effect to the cutout
        end_angle += angle_offset;

        // Check if the fragment is within the arc
        float in_arc = (angle > start_angle && angle < end_angle) || 
                       (angle + 2.0*PI > start_angle && angle + 2.0*PI < end_angle) ? 1.0 : 0.0;
        
        // Create the ring shape
        float ring = smoothstep(0.5 - thickness, 0.48 - thickness, radius) * smoothstep(0.48, 0.5, radius);

        float alpha = ring * in_arc;

        gl_FragColor = vec4(vec3(1.0), alpha);
    }
  `;
</script>

<T.Mesh>
	<T.PlaneGeometry />
	<T.ShaderMaterial
		{fragmentShader}
		vertexShader={`varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`}
		{uniforms}
		transparent={true}
		depthWrite={false}
	/>
</T.Mesh>

import React, {
  useState,
  useEffect,
  useMemo,
  useRef,
  useCallback,
} from "react";
import {
  Sparkles,
  Lock,
  Unlock,
  Zap,
  Palette,
  Atom,
  WandSparkles,
} from "lucide-react";

// --- Interfaces and Constants ---
interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  baseRadius: number;
  color: string;
  speedFactor: number;
}

interface CreativeFreedomSelectorProps {
  value: number;
  onChange: (val: number) => void;
  getFreedomDescription: (value: number) => string;
  className?: string;
}

// --- UNIFIED CONSTANTS ---
const PARTICLE_COUNT = 20;
const BASE_GRAVITY = 0.0000000000000000001;
const GRAVITY_INTENSITY_SCALE = 0.000056;
const BASE_AGITATION = 0;
const AGITATION_INTENSITY_SCALE = 0.3;
const MAX_SPEED_BASE = 0.3;
const MAX_SPEED_VAR = 0.9;
const FRICTION = 0.9999;
const BOUNCE_FACTOR = 0.7;
const MIN_DISTANCE_FOR_BOOST = 1;
const OUTWARD_BOOST_STRENGTH = 1000000;

// --- UPDATED MARKERS DATA ---
const markersData = [
  { value: 0, icon: <Lock className="w-4 h-4" />, label: "Strict" },
  { value: 33, icon: <Unlock className="w-4 h-4" />, label: "Balanced" },
  { value: 50, icon: <WandSparkles className="w-4 h-4" />, label: "Moderate" },
  { value: 66, icon: <Zap className="w-4 h-4" />, label: "Creative" },
  { value: 100, icon: <Palette className="w-4 h-4" />, label: "Unrestricted" },
];
const markerValues = markersData.map((m) => m.value); // Extract values for easier lookup

// --- Helper Function ---
const findClosestValue = (target: number, values: number[]): number => {
  return values.reduce((prev, curr) => {
    return Math.abs(curr - target) < Math.abs(prev - target) ? curr : prev;
  });
};

// --- Component ---
const CreativeFreedomSelector: React.FC<CreativeFreedomSelectorProps> = ({
  value,
  onChange,
  getFreedomDescription,
  className = "",
}) => {
  const [isAnimatingDescription, setIsAnimatingDescription] = useState(false);
  const [descriptionText, setDescriptionText] = useState("");
  const [svgDimensions, setSvgDimensions] = useState({ width: 0, height: 0 });
  const [center, setCenter] = useState({ x: 0, y: 0 });

  // --- Swipe and Slider State ---
  const [isSwiping, setIsSwiping] = useState(false);
  const [swipeProgress, setSwipeProgress] = useState(value); // Temp value during swipe
  const [initialSwipeValue, setInitialSwipeValue] = useState(value); // Value at swipe start

  const containerRef = useRef<HTMLDivElement>(null);
  const particleContainerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number | null>(null);
  const particlesRef = useRef<Particle[]>([]);
  const [particlesForRender, setParticlesForRender] = useState<Particle[]>([]);
  const justSwipedRef = useRef(false); // Flag to prevent click after swipe

  // --- Particle Color Calculation (Memoized - Unchanged) ---
  const getParticleColor = useCallback(
    (selectedValue: number, intensity: number = 1) => {
      const baseOpacity = 0.5;
      const finalOpacity = Math.min(1, baseOpacity + intensity * 0.5);
      if (selectedValue > 80)
        return `rgba(234, 179, 8, ${finalOpacity})`; // Yellow (for 100)
      else if (selectedValue > 60)
        return `rgba(249, 115, 22, ${finalOpacity})`; // Orange (for 66 Zap)
      else if (selectedValue > 40)
        return `rgba(168, 85, 247, ${finalOpacity})`; // Purple (for 50 Wand)
      else if (selectedValue > 20)
        return `rgba(59, 130, 246, ${finalOpacity})`; // Blue (for 33 Unlock)
      else return `rgba(99, 102, 241, ${finalOpacity})`; // Indigo (for 0 Lock)
    },
    []
  );
  // --- Initialize Particles (Effect unchanged) ---
  useEffect(() => {
    if (particlesRef.current.length === 0 && typeof window !== "undefined") {
      const newParticles: Particle[] = [];
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        newParticles.push({
          id: i,
          x: 0,
          y: 0,
          vx: 0,
          vy: 0,
          baseRadius: 1.5 + Math.random() * 10,
          color: getParticleColor(value, Math.random()),
          speedFactor: 0.8 + Math.random() * 0.4,
        });
      }
      particlesRef.current = newParticles;
    }
  }, [getParticleColor, value]); // Keep dependency on value for potential re-color on initial load

  // --- Resize Observer & Initial Positioning (Effect mostly unchanged) ---
  useEffect(() => {
    const particleContainer = particleContainerRef.current;
    if (!particleContainer || typeof window === "undefined") return;

    let initialPositionSet = false;
    let observer: ResizeObserver | null = null;

    const setupObserver = () => {
      if (observer) observer.disconnect();

      observer = new ResizeObserver((entries) => {
        for (const entry of entries) {
          const { width, height } = entry.contentRect;
          if (
            width > 0 &&
            height > 0 &&
            (width !== svgDimensions.width || height !== svgDimensions.height)
          ) {
            const newWidth = width;
            const newHeight = height;
            setSvgDimensions({ width: newWidth, height: newHeight });
            const newCenterX = newWidth / 2;
            const newCenterY = newHeight / 2;
            setCenter({ x: newCenterX, y: newCenterY });

            if (particlesRef.current.length > 0 && !initialPositionSet) {
              // Position particles only once on initial setup after resize
              particlesRef.current = particlesRef.current.map((p) => {
                const angle = Math.random() * Math.PI * 2;
                const initialOrbitRadius =
                  MIN_DISTANCE_FOR_BOOST +
                  Math.min(newCenterX, newCenterY) *
                    (0.05 + Math.random() * 0.3);
                return {
                  ...p,
                  x: newCenterX + Math.cos(angle) * initialOrbitRadius,
                  y: newCenterY + Math.sin(angle) * initialOrbitRadius,
                  color: getParticleColor(value, Math.random()), // Recolor based on initial value
                };
              });
              initialPositionSet = true; // Mark as positioned
              setParticlesForRender([...particlesRef.current]);
            } else if (initialPositionSet) {
              // If already positioned, maybe adjust slightly or just re-center logic
              // For now, we mainly rely on physics to keep them centered
            }
          }
        }
      });
      observer.observe(particleContainer);
    };

    // Initial check without observer (for first render)
    const initialRect = particleContainer.getBoundingClientRect();
    if (
      initialRect.width > 0 &&
      initialRect.height > 0 &&
      svgDimensions.width === 0 &&
      !initialPositionSet
    ) {
      const newWidth = initialRect.width;
      const newHeight = initialRect.height;
      setSvgDimensions({ width: newWidth, height: newHeight });
      const newCenterX = newWidth / 2;
      const newCenterY = newHeight / 2;
      setCenter({ x: newCenterX, y: newCenterY });

      if (particlesRef.current.length > 0) {
        particlesRef.current = particlesRef.current.map((p) => {
          const angle = Math.random() * Math.PI * 2;
          const initialOrbitRadius =
            MIN_DISTANCE_FOR_BOOST +
            Math.min(newCenterX, newCenterY) * (0.05 + Math.random() * 0.3);
          return {
            ...p,
            x: newCenterX + Math.cos(angle) * initialOrbitRadius,
            y: newCenterY + Math.sin(angle) * initialOrbitRadius,
            color: getParticleColor(value, Math.random()),
          };
        });
        initialPositionSet = true;
        setParticlesForRender([...particlesRef.current]);
      }
    }

    setupObserver(); // Set up the observer

    return () => {
      if (observer) observer.disconnect();
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
    };
  }, [value, getParticleColor, svgDimensions.height, svgDimensions.width]); // Re-run if value changes (for color) or getParticleColor changes

  // --- Animation Loop (Effect logic mostly unchanged) ---
  useEffect(() => {
    if (
      svgDimensions.width === 0 ||
      svgDimensions.height === 0 ||
      center.x === 0 ||
      particlesRef.current.length === 0 ||
      typeof window === "undefined"
    ) {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
      return;
    }

    // Ensure initial particles are ready for render before starting animation
    if (
      particlesForRender.length === 0 &&
      particlesRef.current.length > 0 &&
      center.x > 0
    ) {
      // This might happen if ResizeObserver runs before the initial particle setup effect finishes updating state
      setParticlesForRender([...particlesRef.current]);
      return; // Let the effect re-run once state is updated
    }
    if (particlesForRender.length === 0) return; // Don't start animation if no particles to render

    const intensity = value / 100;
    const invertedIntensity = 1.0 - intensity;
    let isActive = true;

    const animateParticles = () => {
      if (!isActive || typeof window === "undefined") return;

      const currentParticles = particlesRef.current;
      const nextParticlesState: Particle[] = [];

      // --- Particle physics calculations ---
      for (let i = 0; i < currentParticles.length; i++) {
        const p = { ...currentParticles[i] };
        const dx = center.x - p.x;
        const dy = center.y - p.y;
        const distSq = Math.max(1, dx * dx + dy * dy); // Avoid division by zero if exactly at center
        const dist = Math.sqrt(distSq);

        // Gravity (pulls towards center, stronger when value is low)
        const gravityForce =
          (BASE_GRAVITY + invertedIntensity * GRAVITY_INTENSITY_SCALE) /
          (distSq / 1000 + 1); // Normalize distance effect
        let forceX = (dx / dist) * gravityForce * svgDimensions.width; // Scale force relative to width/height
        let forceY = (dy / dist) * gravityForce * svgDimensions.height;

        // Agitation (random outward force, stronger when value is high)
        const agitationForce =
          BASE_AGITATION + intensity * AGITATION_INTENSITY_SCALE;
        forceX += (Math.random() - 0.5) * agitationForce;
        forceY += (Math.random() - 0.5) * agitationForce;

        // Apply forces to velocity, dampened by friction
        let newVx = (p.vx + forceX) * FRICTION;
        let newVy = (p.vy + forceY) * FRICTION;

        // Outward Boost (strong push if too close to center, scaled by intensity)
        if (dist < MIN_DISTANCE_FOR_BOOST && dist > 0) {
          const boostDirX = -dx / dist; // Opposite direction from center
          const boostDirY = -dy / dist;
          const currentBoost = OUTWARD_BOOST_STRENGTH * intensity; // Stronger boost at higher freedom
          newVx += boostDirX * currentBoost * p.speedFactor;
          newVy += boostDirY * currentBoost * p.speedFactor;
          // Move particle slightly outside boost radius immediately to prevent sticking
          p.x = center.x + boostDirX * (MIN_DISTANCE_FOR_BOOST + 0.1);
          p.y = center.y + boostDirY * (MIN_DISTANCE_FOR_BOOST + 0.1);
        }

        // Max Speed Limit (scaled by intensity)
        const currentMaxSpeed = MAX_SPEED_BASE + intensity * MAX_SPEED_VAR;
        const speed = Math.sqrt(newVx * newVx + newVy * newVy);
        if (speed > currentMaxSpeed && speed > 0) {
          const speedRatio = currentMaxSpeed / speed;
          newVx *= speedRatio;
          newVy *= speedRatio;
        }

        // Update position based on velocity and individual speed factor
        let newX = p.x + newVx * p.speedFactor;
        let newY = p.y + newVy * p.speedFactor;

        // Boundary Bouncing
        const radius = p.baseRadius;
        if (newX - radius < 0) {
          newX = radius;
          newVx *= -BOUNCE_FACTOR;
        } else if (newX + radius > svgDimensions.width) {
          newX = svgDimensions.width - radius;
          newVx *= -BOUNCE_FACTOR;
        }
        if (newY - radius < 0) {
          newY = radius;
          newVy *= -BOUNCE_FACTOR;
        } else if (newY + radius > svgDimensions.height) {
          newY = svgDimensions.height - radius;
          newVy *= -BOUNCE_FACTOR;
        }

        // Appearance Update (Color based on value & speed)
        const colorIntensity = Math.min(
          1,
          speed / Math.max(0.1, currentMaxSpeed)
        );
        const newColor = getParticleColor(value, colorIntensity);

        nextParticlesState.push({
          ...p,
          x: newX,
          y: newY,
          vx: newVx,
          vy: newVy,
          color: newColor,
        });
      }
      // --- End Particle Physics ---

      particlesRef.current = nextParticlesState;
      setParticlesForRender(nextParticlesState); // Update state for rendering
      animationRef.current = requestAnimationFrame(animateParticles);
    };

    if (!animationRef.current) {
      // Start animation only if not already running
      animationRef.current = requestAnimationFrame(animateParticles);
    }

    return () => {
      isActive = false; // Signal loop to stop
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
    };
  }, [
    value,
    svgDimensions,
    center,
    getParticleColor,
    particlesForRender.length, // Re-run if particles become available/unavailable
  ]);

  // --- Animate Description Text Fade ---
  useEffect(() => {
    setIsAnimatingDescription(true);
    const desc = getFreedomDescription(value);
    setDescriptionText(desc);
    const timer = setTimeout(() => setIsAnimatingDescription(false), 300); // Match duration
    return () => clearTimeout(timer);
  }, [value, getFreedomDescription]);

  // --- Click Handler ---
  const handleClick = () => {
    if (justSwipedRef.current) {
      justSwipedRef.current = false;
      return; // Ignore click right after swipe
    }
    const currentIndex = markerValues.indexOf(value);
    const nextIndex = (currentIndex + 1) % markerValues.length;
    onChange(markerValues[nextIndex]);
  };

  // --- Calculate Active Marker Label (for accessibility) ---
  const activeMarker = useMemo(() => {
    return markersData.find((marker) => marker.value === value);
  }, [value]);

  // --- RENDER ---
  return (
    <div className={`my-6 ${className} touch-pan-y`}>
      {" "}
      {/* Allow vertical scroll outside component */}
      {/* Header Section (Value Display) */}
      <div className="flex flex-col mb-2">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 flex items-center gap-2">
          Artist's Creative Freedom {value}%
        </h3>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Controls how closely the artist follows reference materials
        </p>
      </div>
      {/* === Main Interaction Container === */}
      <div
        ref={containerRef}
        onClick={handleClick} // Apply click handler
        className={`relative h-32 sm:h-36 flex flex-col bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 transition-all duration-300 hover:shadow-xl overflow-hidden cursor-grab active:cursor-grabbing`} // Increased height, Added cursor feedback
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={value}
        aria-valuetext={`${value}%, ${activeMarker?.label || descriptionText}`}
        aria-label="Creative Freedom Selector"
        tabIndex={0} // Make it focusable
        onKeyDown={(e) => {
          const currentIndex = markerValues.indexOf(value);
          let nextIndex = currentIndex; // Initialize to current
          if (e.key === "ArrowRight" || e.key === "ArrowUp") {
            nextIndex = Math.min(markerValues.length - 1, currentIndex + 1);
          } else if (e.key === "ArrowLeft" || e.key === "ArrowDown") {
            nextIndex = Math.max(0, currentIndex - 1);
          } else if (e.key === "Home") {
            nextIndex = 0;
          } else if (e.key === "End") {
            nextIndex = markerValues.length - 1;
          }
          if (currentIndex !== nextIndex) onChange(markerValues[nextIndex]);
        }}
      >
        {/* Particle Container */}
        <div
          ref={particleContainerRef}
          className="absolute inset-0 z-0 pointer-events-none" // Position behind overlay, allow clicks/swipes through
        >
          <svg
            width="100%"
            height="100%"
            preserveAspectRatio="none"
            className="absolute top-0 left-0" // SVG takes full space
            aria-hidden="true"
          >
            {/* Render particles only when ready */}
            {svgDimensions.width > 0 &&
              svgDimensions.height > 0 &&
              particlesForRender.length > 0 &&
              particlesForRender.map((p) => (
                <circle
                  key={p.id}
                  cx={p.x}
                  cy={p.y}
                  r={Math.max(0, p.baseRadius)} // Ensure non-negative radius
                  fill={p.color}
                />
              ))}
          </svg>
        </div>

        {/* === Centered Description Overlay === */}
        <div
          className={`absolute inset-0 z-10 flex items-center justify-center p-4 pointer-events-none`}
          aria-hidden="true" // Description is part of aria-valuetext
        >
          <div className="text-center py-2 px-8 rounded-md backdrop-blur-sm">
            <p className="text-3xl sm:text-4xl font-light text-gray-900 dark:text-white">
              {descriptionText}
            </p>
          </div>
        </div>

        {/* === Added instruction text at the bottom right === */}
        <div className="absolute bottom-2 left-2 z-20 pointer-events-none">
          <p className="text-lg text-gray-600 dark:text-gray-400 opacity-80">
            Click to change creative freedom
          </p>
        </div>
      </div>
    </div>
  );
};

export default CreativeFreedomSelector;
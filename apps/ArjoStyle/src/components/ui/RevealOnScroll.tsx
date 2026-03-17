// src/components/ui/RevealOnScroll.tsx

import { useEffect, useRef, useState, ReactNode } from 'react';
import { cn } from '@/lib/utils'; // Assuming you have this utility

// Added slide-in options
type AnimationType =
  | 'fade-in'
  | 'fade-in-up'
  | 'fade-in-down'
  | 'zoom-in'
  | 'slide-in-left'
  | 'slide-in-right';

interface RevealOnScrollProps {
  /** Content to reveal */
  children: ReactNode;
  /** Type of animation to apply */
  animation?: AnimationType;
  /** Delay in milliseconds before the animation starts */
  delay?: number;
  /** Duration of the animation in milliseconds */
  duration?: number;
  /** Intersection Observer threshold (0 to 1) - how much of the element needs to be visible */
  threshold?: number;
  /** Custom class names to merge */
  className?: string;
  /** If true, the animation only runs once when the element becomes visible */
  once?: boolean;
  /** Tailwind CSS easing class (e.g., 'ease-out', 'ease-in-out', 'ease-linear') */
  easing?: `ease-${string}`; // More specific type for easing classes
  /** Adjust the trigger point. Negative values trigger earlier (e.g., '0px 0px -50px 0px') */
  rootMargin?: string;
}

export function RevealOnScroll({
  children,
  animation = 'fade-in-up', // Default animation
  delay = 0,
  duration = 100, // Sensible default duration
  threshold = 0.1, // Default threshold
  className,
  once = true, // Default to animating only once
  easing = 'ease-out', // Default easing
  rootMargin = '0px 0px -10px 0px', // Trigger slightly before fully visible
}: RevealOnScrollProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isInitiallyRendered, setIsInitiallyRendered] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Mount with initial opacity to prevent blank/empty state
  useEffect(() => {
    // This makes the content immediately visible with reduced opacity 
    // before scroll animation takes effect
    setIsInitiallyRendered(true);
  }, []);

  useEffect(() => {
    const currentRef = ref.current;
    if (!currentRef) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        // Check if the element is intersecting
        if (entry.isIntersecting) {
          setIsVisible(true);
          // If 'once' is true, disconnect the observer after the first reveal
          if (once) {
            observer.unobserve(currentRef);
            observer.disconnect();
          }
        } else if (!once) {
          // If 'once' is false, allow the element to become hidden again
          setIsVisible(false);
        }
      },
      {
        threshold, // How much of the element should be visible to trigger
        rootMargin, // Adjust the bounding box
      }
    );

    observer.observe(currentRef);

    // Cleanup function to unobserve when the component unmounts
    return () => {
      // Check if observer and currentRef exist before trying to unobserve/disconnect
      // This prevents errors during fast unmounts or if ref is somehow null
      if (observer && currentRef) {
        observer.unobserve(currentRef);
      }
      if (observer) {
        observer.disconnect();
      }
    };
    // Dependencies for the effect
  }, [threshold, rootMargin, once]);

  //
  // --- Animation Start State Classes ---
  // These classes define the element's appearance *before* the animation starts (when !isVisible)
  const getAnimationStartClasses = (anim: AnimationType): string => {
    switch (anim) {
      case 'fade-in':
        return 'opacity-0';
      case 'fade-in-up':
        return 'opacity-0 translate-y-5'; // Start lower
      case 'fade-in-down':
        return 'opacity-0 -translate-y-5'; // Start higher
      case 'zoom-in':
        return 'opacity-0 scale-90'; // Start smaller
      case 'slide-in-left':
        return 'opacity-0 -translate-x-8'; // Start further left
      case 'slide-in-right':
        return 'opacity-0 translate-x-8'; // Start further right
      default:
        return 'opacity-0'; // Default to fade-in
    }
  };

  // --- Base transition classes applied always ---
  // We apply the transition properties always, but they only take effect
  // when the opacity/transform changes based on `isVisible`.
  const baseTransitionClasses = 'transition-all transform';

  return (
    <div
      ref={ref}
      className={cn(
        baseTransitionClasses, // Apply base transition properties
        easing, // Apply the selected easing function
        // Apply START state classes only when NOT visible
        !isVisible && getAnimationStartClasses(animation),
        // Apply END state classes (fully visible) only when visible
        // These reset opacity and transforms to their default visible state.
        isVisible && 'opacity-100 translate-y-0 translate-x-0 scale-100',
        className // Merge any additional classes from props
      )}
      style={{
        // Apply dynamic duration and delay using inline styles
        // as Tailwind classes (e.g., duration-700) are static.
        transitionDuration: `${duration}ms`,
        transitionDelay: `${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}
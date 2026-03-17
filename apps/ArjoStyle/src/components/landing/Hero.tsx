import React from "react"; // Import React
import { Button } from "@/components/ui/button";
import { ChevronDown } from "lucide-react";
import { Canvas } from '@react-three/fiber'; // <--- Import Canvas
import { RotatingGLBModel } from '@/components/canvas/RotatingGLBModel'; // <--- Import your 3D component

// --- Add prop type definition ---
interface HeroProps {
  onOpenBookingModal: () => void; // Function passed from parent to open the modal
}

export function Hero({ onOpenBookingModal }: HeroProps) { // <-- Accept prop

  const scrollToPortfolio = () => {
    const portfolioSection = document.getElementById("portfolio");
    if (portfolioSection) {
      const headerOffset = 80;
      const elementPosition =
        portfolioSection.getBoundingClientRect().top + window.pageYOffset;
      const offsetPosition = elementPosition - headerOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth",
      });
    }
  };

  return (
    // Make the section relative to position the canvas inside it
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">

      {/* === React Three Fiber Canvas === */}
      {/* Position it absolutely to fill the section, behind the content */}
      <div className="absolute inset-0 z-0"> {/* Use z-0 to place behind content */}
        <Canvas
           camera={{ position: [0, 0, 10], fov: 10 }} // Adjust camera position/fov if needed
           style={{ background: 'transparent' }} // Make canvas background transparent
           gl={{ antialias: true }} // Enable anti-aliasing
        >
          {/* Suspense is good practice for async loading (like fonts) */}
          <React.Suspense fallback={null}>
            <RotatingGLBModel />
          </React.Suspense>
        </Canvas>
      </div>
      {/* ============================== */}

      {/* Semi-transparent overlay behind content for better contrast */}
      <div className="absolute inset-0 bg-background/30  z-1"></div>

      {/* Background with subtle gradient (Now potentially behind the canvas, ensure canvas is transparent) */}
      <div className="absolute inset-0 bg-gradient-to-b from-background to-background/80 dark:from-gray-950 dark:to-gray-950/80 z-[-1]"></div> {/* Lower z-index */}

      {/* Abstract background shapes (Adjust z-index if needed) */}
      <div className="absolute inset-0 overflow-hidden z-[-1]"> {/* Lower z-index */}
        <div className="absolute top-1/4 -left-20 w-80 h-80 rounded-full bg-primary/5 dark:bg-purple-900/10 opacity-50 blur-3xl"></div>
        <div className="absolute bottom-1/4 -right-20 w-96 h-96 rounded-full bg-primary/5 dark:bg-purple-900/10 opacity-50 blur-3xl"></div>
      </div>

      {/* Content container - Ensure it has a higher z-index than the canvas */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 py-24 text-center">
        {/* Text Badge with enhanced shadow */}
        {/* <div className="inline-block px-4 py-1.5 mb-8 text-sm italic font-medium tracking-wide uppercase bg-background/80 backdrop-blur-2xl rounded-full border border-border/50 shadow-lg dark:bg-gray-800/50 dark:border-gray-700/50">
          <span className="drop-shadow-md">𝕐𝕠𝕦𝕣 𝕍𝕚𝕤𝕚𝕠𝕟, 𝕆𝕦𝕣 𝕀𝕟𝕜</span>
        </div> */}

        {/* Heading with text shadow for better separation from the 3D model */}
        <h1 className="text-4xl md:text-6xl lg:text-7xl font-medium tracking-tight mb-6 text-gray-900 dark:text-white drop-shadow-xl text-shadow-lg">
          <span className="text-shadow-dark">Timeless Tattoos</span>
          <br className="inline" /> 
          <span className="text-shadow-dark">Artistry Without Limits.</span>
        </h1>

        {/* Paragraph with subtle text shadow */}
        <p className="text-base md:text-lg text-muted-foreground  mx-auto mb-10 drop-shadow-md">
          Unleash your vision where I transform your vision with ink.
        </p>

        {/* Buttons with enhanced shadow on hover */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button
            className="bg-primary hover:bg-primary/90 min-w-[180px] h-12 text-base transition-all duration-300 hover:shadow-xl text-primary-foreground shadow-md" // Added shadow-md
            onClick={onOpenBookingModal}
          >
            Book Now
          </Button>
          <Button
            variant="outline"
            className="min-w-[180px] h-12 text-base border-border hover:border-border/80 transition-all duration-300 bg-background/50 hover:bg-background/80 dark:bg-gray-800/30 dark:hover:bg-gray-800/50 dark:border-gray-700 shadow-md hover:shadow-lg" // Added shadows
            onClick={scrollToPortfolio}
          >
            View Portfolio
          </Button>
        </div>

        {/* Scroll down indicator with shadow */}
        {/* <button
          onClick={scrollToPortfolio}
          className="absolute bottom-10 left-1/2 transform -translate-x-1/2 flex flex-col items-center text-muted-foreground hover:text-foreground transition-colors drop-shadow-md"
          aria-label="Scroll down to portfolio"
        >
          <span className="text-sm mb-2">Discover more</span>
          <ChevronDown />
        </button> */}
      </div>

    </section>
  );
}

/* Add these custom text shadow utilities to your global CSS file */
/*
@layer utilities {
  .text-shadow-dark {
    text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5), 0 0 10px rgba(0, 0, 0, 0.25);
  }
  
  .text-shadow-lg {
    text-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
  }
}
*/
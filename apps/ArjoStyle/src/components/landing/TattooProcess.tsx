import React, { useState, useEffect, useRef, useCallback } from 'react';
import { CalendarCheck, SprayCan, PenTool, ShieldCheck, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// --- Data for Each Process Step ---
const processStepsData = [
  {
    id: "1",
    icon: <CalendarCheck className="w-12 h-12 md:w-14 md:h-14" strokeWidth={1.5} />,
    title: "Online Booking & Consultation",
    duration: "Online + 30-60 min",
    content: (
      <>
        <p className="mb-3">Your journey starts here:</p>
        <ul className="list-disc list-inside space-y-2 pl-2">
          <li>
            <strong>Book Online:</strong> Easily select your preferred artist, service, date, and time through our secure online portal.
          </li>
          <li>
            <strong>Deposit:</strong> A deposit may be required to secure your appointment slot.
          </li>
          <li>
            <strong>Consultation:</strong> Discuss your ideas, references, placement, and sizing with your chosen artist (can be in-person or virtual).
          </li>
          <li>
            <strong>Design Refinement:</strong> We provide expert advice to ensure your design is perfect for tattooing.
          </li>
          <li>Address any questions about the process.</li>
        </ul>
        <div className="mt-4 p-3 bg-gray-700/40 rounded-lg border border-gray-700">
          <p className="text-sm text-gray-300 font-medium mb-2">What you'll need:</p>
          <p className="text-xs text-gray-300">
            Have your ideas, reference images (if any), and preferred placement ready. Be prepared to discuss your budget and schedule.
          </p>
        </div>
      </>
    ),
  },
  {
    id: "2",
    icon: <SprayCan className="w-12 h-12 md:w-14 md:h-14" strokeWidth={1.5} />,
    title: "Preparation & Stencil",
    duration: "30-45 minutes",
    content: (
      <>
        <p className="mb-3">Setting the stage for precision:</p>
        <ul className="list-none space-y-3 pl-0">
          <li>
            <span className="block text-gray-300 font-medium mb-1">Sterile Setup</span>
            <span className="text-gray-300">Your artist prepares a fully sterilized workstation with single-use needles and equipment.</span>
          </li>
          <li>
            <span className="block text-gray-300 font-medium mb-1">Skin Prep</span>
            <span className="text-gray-300">The tattoo area is carefully cleaned, disinfected, and shaved (if necessary).</span>
          </li>
          <li>
            <span className="block text-gray-300 font-medium mb-1">Stencil Placement</span>
            <span className="text-gray-300">Your approved design is applied as a stencil, allowing final checks on placement and flow.</span>
          </li>
        </ul>
         <div className="mt-4 p-3 bg-gray-700/40 rounded-lg border border-gray-700">
          <p className="text-sm text-gray-300 font-medium mb-2">Final Check:</p>
          <p className="text-xs text-gray-300">
            This is your last chance to confirm you're 100% happy with the size and placement before the needle starts!
          </p>
        </div>
      </>
    ),
  },
  {
    id: "3",
    icon: <PenTool className="w-12 h-12 md:w-14 md:h-14" strokeWidth={1.5} />,
    title: "Tattoo Creation",
    duration: "1-8+ hours",
    content: (
      <>
        <p className="mb-3">Where art meets skin:</p>
        <ul className="list-none space-y-3 pl-0">
          <li>
            <span className="block text-gray-300 font-medium mb-1">Linework</span>
            <span className="text-gray-300">The foundational outlines are applied with precision.</span>
          </li>
          <li>
            <span className="block text-gray-300 font-medium mb-1">Shading & Detail</span>
            <span className="text-gray-300">Depth, texture, and gradients are skillfully added.</span>
          </li>
          <li>
            <span className="block text-gray-300 font-medium mb-1">Color/Fill (if applicable)</span>
            <span className="text-gray-300">Pigments are carefully packed for vibrant, lasting results.</span>
          </li>
           <li>
            <span className="block text-gray-300 font-medium mb-1">Breaks</span>
            <span className="text-gray-300">Regular breaks are taken for longer sessions to ensure comfort and quality.</span>
          </li>
        </ul>
        <div className="mt-4 p-3 bg-gray-700/40 rounded-lg border border-gray-700">
          <p className="text-sm text-gray-300 font-medium mb-2">Session Comfort:</p>
          <p className="text-xs text-gray-300">
            Eat well before, stay hydrated, wear comfy clothes, and communicate with your artist if you need a break. Distractions like music or podcasts can help!
          </p>
        </div>
      </>
    ),
  },
  {
    id: "4",
    icon: <ShieldCheck className="w-12 h-12 md:w-14 md:h-14" strokeWidth={1.5} />,
    title: "Aftercare & Healing",
    duration: "2-4 weeks+",
    content: (
      <>
        <p className="mb-3">Protecting your new investment:</p>
        <ul className="list-none space-y-3 pl-0">
          <li>
            <span className="block text-gray-300 font-medium mb-1">Initial Wrap</span>
            <span className="text-gray-300">Your tattoo is cleaned and covered with a protective bandage (e.g., plastic wrap or medical-grade film).</span>
          </li>
          <li>
            <span className="block text-gray-300 font-medium mb-1">Cleaning Routine</span>
            <span className="text-gray-300">Follow specific instructions for gentle washing and drying.</span>
          </li>
          <li>
            <span className="block text-gray-300 font-medium mb-1">Moisturizing</span>
            <span className="text-gray-300">Apply recommended aftercare lotion sparingly to keep the skin hydrated without suffocating it.</span>
          </li>
           <li>
            <span className="block text-gray-300 font-medium mb-1">Protection</span>
            <span className="text-gray-300">Avoid sun exposure, soaking (baths, swimming), and tight clothing over the healing tattoo.</span>
          </li>
        </ul>
        <div className="mt-4 p-3 bg-gray-700/40 rounded-lg border border-gray-700">
          <p className="text-sm text-gray-300 font-medium mb-2">Follow Up:</p>
          <p className="text-xs text-gray-300">
            Contact us with any healing concerns. A complimentary touch-up may be offered within a specific timeframe if needed.
          </p>
        </div>
      </>
    ),
  },
];

// --- CombinedProcessCard Component Definition ---
function CombinedProcessCard() {
  const [activeStepId, setActiveStepId] = useState(processStepsData[0].id);
  const [isAutoToggling, setIsAutoToggling] = useState(true);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const activeStepIndex = processStepsData.findIndex(step => step.id === activeStepId);
  // Fallback in case activeStepId somehow becomes invalid (shouldn't happen with modulo logic)
  const activeStepData = processStepsData[activeStepIndex] || processStepsData[0];

  // Function to advance to the next step
  const advanceStep = useCallback(() => {
    const currentIdx = processStepsData.findIndex(step => step.id === activeStepId);
    const nextIndex = (currentIdx + 1) % processStepsData.length;
    setActiveStepId(processStepsData[nextIndex].id);
  }, [activeStepId]); // Dependency: activeStepId needed to find current index

  // Function to stop timer and pause auto-toggle
  const pauseAndClearInterval = useCallback(() => {
    setIsAutoToggling(false); // Pause auto-toggle on any manual interaction
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []); // No dependencies needed

  // Function to handle manual step selection via HEADER BUTTONS
  const handleStepClick = (stepId: string, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent click from bubbling to the card's onClick
    setActiveStepId(stepId);
    pauseAndClearInterval();
  };

  // Function to handle clicking ANYWHERE ELSE on the card
  const handleCardClick = () => {
    // Don't need stopPropagation here
    advanceStep(); // Go to the next step
    pauseAndClearInterval(); // Pause timer
  };

  // Effect for auto-toggling
  useEffect(() => {
    // Only start interval if auto-toggling is enabled
    if (isAutoToggling) {
      // Clear previous interval just in case
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      intervalRef.current = setInterval(advanceStep, 5000); // Use the memoized advanceStep
    } else {
      // Clear interval if auto-toggling is turned off
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    // Cleanup function: clear interval when component unmounts or dependencies change
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isAutoToggling, advanceStep]); // Rerun effect if isAutoToggling or advanceStep changes


  // Animation variants for the content swapping
  const contentVariants = {
    hidden: { opacity: 0, y: 20, transition: { duration: 0.3 } },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4, delay: 0.1 } },
    exit: { opacity: 0, y: -20, transition: { duration: 0.3 } },
  };

  // Animation variants for the icon swapping
  const iconVariants = {
      initial: { scale: 0.8, opacity: 0 },
      animate: { scale: 1, opacity: 1, transition: { type: "spring", stiffness: 300, damping: 15, delay: 0.2 } },
      exit: { scale: 0.8, opacity: 0, transition: { duration: 0.2 } }
  };


  return (
    <motion.div
      layout // Animates layout changes smoothly (e.g., height changes)
      onClick={handleCardClick} // Attach card click handler
      className="bg-gray-800/90 backdrop-blur-sm rounded-xl shadow-lg border border-gray-700/50 overflow-hidden max-w-3xl mx-auto cursor-pointer" // Added cursor-pointer
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.5 }} // Delay card entrance slightly after header
    >
      {/* --- Header with Step Numbers --- */}
      <div className="flex justify-around items-center p-4 bg-gray-900/50 border-b border-gray-700/50 relative">
        {processStepsData.map((step) => (
          <div key={step.id} className="text-center relative">
            {/* Update button onClick to pass the event and call handleStepClick */}
            <button
              onClick={(e) => handleStepClick(step.id, e)}
              className={`relative z-10 text-xl md:text-2xl font-bold transition-colors duration-300 ${
                activeStepId === step.id ? 'text-gray-400' : 'text-gray-500 hover:text-gray-300'
              }`}
              aria-label={`Go to step ${step.id}: ${step.title}`} // Accessibility improvement
            >
              {step.id}
            </button>
            {/* Animated underline/highlight for active step */}
            {activeStepId === step.id && (
              <motion.div
                className="absolute -bottom-4 left-0 right-0 h-1 bg-gray-500 rounded-full"
                layoutId="activeStepHighlight" // Shared layout ID for smooth animation
                initial={false} // Don't animate on initial render
                transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                aria-hidden="true" // Hide decorative element from screen readers
              />
            )}
             {/* Text Label below number */}
             <span className={`mt-1 text-xs block transition-colors duration-300 ${
               activeStepId === step.id ? 'text-gray-300' : 'text-gray-500'
             }`} aria-hidden="true">
               Step {step.id}
             </span>
          </div>
        ))}
      </div>

      {/* --- Content Area --- */}
      {/* Added pointer-events-none here so clicks pass through to the main card handler */}
      <div className="p-6 md:p-8 min-h-[400px] md:min-h-[450px] flex flex-col md:flex-row md:items-start gap-6 pointer-events-none">
        {/* Icon Column (Animated Presence for Icon Swap) */}
         <div className="flex-shrink-0 mx-auto md:mx-0 mb-4 md:mb-0 md:mr-6 text-gray-400">
             <AnimatePresence mode="popLayout">
                <motion.div
                    key={activeStepId + "-icon"} // Unique key for icon animation
                    variants={iconVariants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                >
                    {activeStepData.icon}
                </motion.div>
             </AnimatePresence>
         </div>

        {/* Text Content Column (Animated Presence for Content Swap) */}
        <div className="flex-grow">
          <AnimatePresence mode="wait">
             {/* Add unique key based on activeStepId for AnimatePresence to detect changes */}
            <motion.div
              key={activeStepId} // Unique key for content animation
              variants={contentVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="space-y-4" // Add spacing within the animated content block
            >
              <h3 className="text-2xl font-bold text-white">
                {activeStepData.title}
              </h3>
              {activeStepData.duration && (
                 <div className="flex items-center gap-2 text-sm bg-gray-700/50 rounded-full px-3 py-1 text-gray-300 w-fit">
                   <Clock size={14} className="mr-1 flex-shrink-0" />
                   <span>{activeStepData.duration}</span>
                 </div>
               )}
              <div className="text-gray-300 text-base leading-relaxed">
                {activeStepData.content}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}


// --- TattooProcess Section Component (Main Structure) ---
export function TattooProcess() {
  // Intersection Observer state
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = React.useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        // Trigger visibility only once
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.15 } // Trigger when 15% of the element is visible
    );

    const currentSection = sectionRef.current; // Capture ref value
    if (currentSection) {
      observer.observe(currentSection);
    }

    // Cleanup function
    return () => {
      if (currentSection) {
        observer.unobserve(currentSection);
      }
    };
  }, []); // Empty dependency array ensures this runs only once on mount

  // Animation variants for the section title/description
   const titleVariants = {
    hidden: { y: -20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { duration: 0.6, ease: "easeOut" } }
  };
  const descVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { duration: 0.6, delay: 0.2, ease: "easeOut" } }
  };
   const progressVariants = {
    hidden: { scaleX: 0, originX: 0 },
    visible: { scaleX: 1, transition: { duration: 1, delay: 0.4, ease: "easeInOut" } }
  };


  return (
    // Added ref to the section for the observer
    <section ref={sectionRef} id="process" className="py-24 md:py-32 bg-gradient-to-b from-gray-900 to-gray-950 relative overflow-hidden">
      {/* Decorative elements */}
      {/* <div className="absolute top-0 left-0 w-full h-20 bg-gradient-to-b from-gray-800/30 to-transparent pointer-events-none" aria-hidden="true"></div> */}
      {/* <div className="absolute top-40 right-0 w-72 h-72 bg-gray-900/10 rounded-full blur-3xl pointer-events-none -z-10" aria-hidden="true"></div> */}
      {/* <div className="absolute bottom-40 left-10 w-64 h-64 bg-gray-600/5 rounded-full blur-3xl pointer-events-none -z-10" aria-hidden="true"></div> */}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <motion.h2
          className="text-4xl md:text-5xl font-bold text-center mb-4 text-white"
          variants={titleVariants}
          initial="hidden"
          animate={isVisible ? "visible" : "hidden"}
        >
          Your <span className="text-gray-400">Tattoo Journey</span> Explained
        </motion.h2>

        <motion.div
          className="h-px w-full bg-gray-600 mx-auto mb-6"
          variants={progressVariants}
          initial="hidden"
          animate={isVisible ? "visible" : "hidden"}
           aria-hidden="true"
        />

        {/* <motion.p
          className="text-gray-300 text-lg text-center max-w-3xl mx-auto mb-16"
          variants={descVariants}
          initial="hidden"
          animate={isVisible ? "visible" : "hidden"}
        >
          From initial concept to healed masterpiece, here's our professional process for bringing your vision to life on skin, step by step. Click the card to advance or select a step number.
        </motion.p> */}

        {/* --- Render the Combined Process Card --- */}
        {/* Render card only when section is visible to start animations/timers */}
        {isVisible && <CombinedProcessCard />}

      </div>

      
    </section>
  );
}
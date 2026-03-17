// src/components/Portfolio.tsx

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { cn } from '@/lib/utils'; // Assuming you have this utility (e.g., from shadcn/ui)
import { Play, Pause, ChevronLeft, ChevronRight, ImageOff, VideoOff } from 'lucide-react';
import { portfolioItems } from '../../data/portfolioData'
import type { PortfolioItem, PortfolioImageItem, PortfolioVideoItem } from '../../types/portfolioTypes'; // Import types

// --- Configuration Constant ---
// Set this to true to show the video section, false to hide it.
const ENABLE_VIDEO_SECTION: boolean = false;

// --- Component-Specific Types ---
interface PortfolioProps {
    onOpenBookingModal: () => void; // Function passed from parent to open the modal
}

// Helper type for video controls state
type VideoControlState = {
    [key: number]: {
        isPlaying: boolean;
        error: boolean; // Track loading errors per video
    }
};

// --- Static Data ---
// Categories specific to how this component displays them
const portfolioCategories = [
    { id: 'all', name: 'All Works' },
    { id: 'blackwork', name: 'Blackwork' },
    { id: 'minimalist', name: 'Minimalist' },
    { id: 'geometric', name: 'Geometric' },
    { id: 'traditional', name: 'Traditional' },
    { id: 'florals', name: 'Florals & Nature' },
    { id: 'japanese', name: 'Japanese' },
    { id: 'custom', name: 'Custom Designs' },
];

// Fallback image path (ensure this exists, e.g., in public folder or accessible URL)
const FALLBACK_IMAGE_SRC = 'https://images.unsplash.com/photo-1544867885-2333f61544ad?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80'; // Example fallback

// --- Component ---
export function Portfolio({ onOpenBookingModal }: PortfolioProps) {
    const [activeCategory, setActiveCategory] = useState('all');
    const [videoControls, setVideoControls] = useState<VideoControlState>({});
    const [currentFeaturedIndex, setCurrentFeaturedIndex] = useState(0);

    // --- Memoize Derived Data ---
    const videoItems = useMemo(() => {
        if (!ENABLE_VIDEO_SECTION) return [];
        // Ensure items are correctly typed as PortfolioVideoItem for filtering
        return portfolioItems.filter((item): item is PortfolioVideoItem => item.type === 'video' && !!item.videoSrc);
    }, []); // Dependency array is empty because ENABLE_VIDEO_SECTION is const and portfolioItems is stable import

    const imageItems = useMemo(() => {
         // Ensure items are correctly typed as PortfolioImageItem for filtering
        return portfolioItems.filter((item): item is PortfolioImageItem => item.type === 'image' && !!item.image);
    }, []); // Dependency: portfolioItems import stability

    // --- State Initialization Effect for Videos ---
    useEffect(() => {
        // Only run if the video section is enabled and there are videos
        if (!ENABLE_VIDEO_SECTION || videoItems.length === 0) {
            setVideoControls({}); // Clear controls if disabled or no videos
            return;
        }

        const initialControls: VideoControlState = {};
        videoItems.forEach(item => {
            // Initialize state for each video item
            initialControls[item.id] = { isPlaying: false, error: false }; // Default to paused, no error
        });
        setVideoControls(initialControls);
        setCurrentFeaturedIndex(0); // Reset index when video items change

    }, [videoItems]); // Rerun if the computed videoItems array changes reference

    // --- Filtered Images based on Active Category ---
    const filteredImageItems = useMemo(() => {
        if (activeCategory === 'all') return imageItems;
        return imageItems.filter(item => item.category === activeCategory);
    }, [activeCategory, imageItems]);

    // --- Refs for Video Elements ---
    const videoRefs = useRef<{ [key: number]: HTMLVideoElement | null }>({});

    // --- Callback Handlers ---

    // Toggle play/pause state for a specific video
    const toggleVideoPlay = useCallback((id: number) => {
        const videoElement = videoRefs.current[id];
        const currentControlState = videoControls[id];

        if (!videoElement || !currentControlState || currentControlState.error) {
            console.warn(`Video element not found, state missing, or in error state for id: ${id}`);
            return;
        }

        const wasPlaying = currentControlState.isPlaying;
        const actionPromise = wasPlaying ? videoElement.pause() : videoElement.play();

        // Handle potential errors during play() - pause() doesn't return a promise
        if (!wasPlaying && actionPromise && typeof (actionPromise as Promise<void>).catch === 'function') {
            (actionPromise as Promise<void>).catch(err => {
                console.error("Error attempting to play video:", err);
                // If play fails, revert the state back to paused
                setVideoControls(prev => ({
                    ...prev,
                    [id]: { ...prev[id], isPlaying: false }
                }));
            });
        }

        // Optimistically update the state
        setVideoControls(prev => ({
            ...prev,
            [id]: { ...currentControlState, isPlaying: !wasPlaying }
        }));

    }, [videoControls]); // Dependency: videoControls state

    // Handle errors loading a video source
    const handleVideoError = useCallback((id: number) => {
        const videoSrc = videoItems.find(v => v.id === id)?.videoSrc;
        console.error(`Failed to load video with id: ${id}. Source: ${videoSrc}`);
        setVideoControls(prev => ({
            ...prev,
            // Ensure the state exists for the ID before updating
            [id]: { ...(prev[id] || { isPlaying: false }), error: true, isPlaying: false } // Mark as error, ensure paused
        }));
    }, [videoItems]); // Dependency: videoItems to find the source URL for logging

    // Handle errors loading an image source, replace with fallback
    const handleImageError = useCallback((event: React.SyntheticEvent<HTMLImageElement, Event>) => {
        const target = event.currentTarget;
        if (target.src === FALLBACK_IMAGE_SRC) {
             console.warn(`Fallback image itself failed to load or is the same as original: ${target.src}`);
             // Potentially hide the image or show a placeholder icon if fallback fails
             target.style.display = 'none'; // Example: hide if fallback fails
             return; // Avoid infinite loop if fallback is also broken or same URL
        }
        console.warn(`Failed to load image, using fallback. Original src: ${target.src}`);
        target.onerror = null; // Prevent infinite loop if fallback also fails
        target.src = FALLBACK_IMAGE_SRC;
        target.srcset = ""; // Clear srcset if it exists
        target.style.objectFit = 'contain'; // Adjust fit for placeholder potentially
        target.classList.add('opacity-50'); // Optionally style the fallback
    }, []); // No dependencies needed if FALLBACK_IMAGE_SRC is const

    // Navigate to the next video in the carousel
    const goToNextFeatured = useCallback(() => {
        if (videoItems.length === 0) return;
        setCurrentFeaturedIndex(prev => (prev + 1) % videoItems.length);
    }, [videoItems.length]);

    // Navigate to the previous video in the carousel
    const goToPrevFeatured = useCallback(() => {
        if (videoItems.length === 0) return;
        setCurrentFeaturedIndex(prev => (prev - 1 + videoItems.length) % videoItems.length);
    }, [videoItems.length]);


    // --- Current Video Data for Rendering ---
    // Ensure index is valid and section is enabled before accessing
    const currentVideo = ENABLE_VIDEO_SECTION && videoItems.length > 0 ? videoItems[currentFeaturedIndex] : null;
    const currentVideoState = currentVideo ? videoControls[currentVideo.id] : undefined;

    // --- Render ---
    return (
        <section id="portfolio" className="py-16 bg-gradient-to-b from-gray-950 to-gray-900 text-gray-200">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">

                {/* --- Featured Video Carousel (Conditionally Rendered) --- */}
                {ENABLE_VIDEO_SECTION && (
                    <>
                        {videoItems.length > 0 && currentVideo ? (
                            <div className="mb-28"> {/* Container for the video section */}
                                <div className="relative mx-auto max-w-4xl">
                                    {/* Video Player Area */}
                                    <div className="aspect-video relative overflow-hidden rounded-xl shadow-2xl border border-gray-800 bg-black flex items-center justify-center">
                                        {currentVideoState?.error ? (
                                            // Error State Display
                                            <div className="text-center text-gray-500 p-4">
                                                <VideoOff size={48} className="mx-auto mb-2" />
                                                <span>Video unavailable</span>
                                                <p className='text-xs mt-1'>ID: {currentVideo.id}</p>
                                            </div>
                                        ) : (
                                            // Video Element
                                            <video
                                                ref={el => { if (el && currentVideo) videoRefs.current[currentVideo.id] = el; }}
                                                key={currentVideo.id} // Key helps React remount if src changes drastically
                                                src={currentVideo.videoSrc}
                                                poster={currentVideo.poster}
                                                className="w-full h-full object-cover"
                                                // Controlled play state; muted often required for autoplay policies
                                                // autoPlay={currentVideoState?.isPlaying ?? false} // Let toggleVideoPlay handle play/pause
                                                loop
                                                muted // Muted is crucial for potential autoplay scenarios
                                                playsInline // Important for mobile browsers
                                                onError={() => handleVideoError(currentVideo.id)} // Handle loading errors
                                                onPlay={() => { // Sync state if played externally (less common here)
                                                   if (!currentVideoState?.isPlaying && videoControls[currentVideo.id]) {
                                                       setVideoControls(prev => ({...prev, [currentVideo.id]: {...prev[currentVideo.id], isPlaying: true}}));
                                                   }
                                                }}
                                                onPause={() => { // Sync state if paused externally
                                                    if (currentVideoState?.isPlaying && videoControls[currentVideo.id]) {
                                                        setVideoControls(prev => ({...prev, [currentVideo.id]: {...prev[currentVideo.id], isPlaying: false}}));
                                                    }
                                                }}
                                            />
                                        )}

                                        {/* Video Info Overlay (only if no error) */}
                                        {!currentVideoState?.error && currentVideo && (
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent flex flex-col justify-end p-4 md:p-6 pointer-events-none">
                                                <h4 className="text-white text-lg md:text-xl font-bold mb-1">
                                                    {currentVideo.title}
                                                </h4>
                                                <p className="text-gray-300 text-sm md:text-base mb-2 line-clamp-2">
                                                    {currentVideo.description}
                                                </p>
                                                <div className="flex items-center text-gray-300 text-xs md:text-sm">
                                                    <span>Artist: {currentVideo.artist}</span>
                                                </div>
                                            </div>
                                        )}

                                        {/* Play/Pause button (positioned absolutely, only if no error) */}
                                        {!currentVideoState?.error && currentVideo && (
                                            <button
                                                className="absolute top-3 right-3 md:top-4 md:right-4 bg-black/50 hover:bg-black/70 p-2 rounded-full text-white transition-all z-10 cursor-pointer"
                                                onClick={(e) => {
                                                    e.stopPropagation(); // Prevent potential parent clicks
                                                    toggleVideoPlay(currentVideo.id);
                                                }}
                                                aria-label={currentVideoState?.isPlaying ? "Pause video" : "Play video"}
                                                type="button"
                                            >
                                                {currentVideoState?.isPlaying
                                                    ? <Pause size={20} />
                                                    : <Play size={20} />
                                                }
                                            </button>
                                        )}
                                    </div>

                                    {/* Navigation arrows & Dots (only if more than 1 video) */}
                                    {videoItems.length > 1 && (
                                        <>
                                            <button
                                                onClick={goToPrevFeatured}
                                                className="absolute top-1/2 -translate-y-1/2 -left-6 md:-left-10 bg-gray-600 hover:bg-gray-700 p-2 md:p-3 rounded-full shadow-lg text-white transition-all z-10"
                                                aria-label="Previous video"
                                                type="button"
                                            >
                                                <ChevronLeft size={18} />
                                            </button>
                                            <button
                                                onClick={goToNextFeatured}
                                                className="absolute top-1/2 -translate-y-1/2 -right-6 md:-right-10 bg-gray-600 hover:bg-gray-700 p-2 md:p-3 rounded-full shadow-lg text-white transition-all z-10"
                                                aria-label="Next video"
                                                type="button"
                                            >
                                                <ChevronRight size={18} />
                                            </button>

                                            {/* Dots indicator */}
                                            <div className="flex justify-center mt-4 space-x-2">
                                                {videoItems.map((_, idx) => (
                                                    <button
                                                        key={`dot-${videoItems[idx].id}`} // Use stable ID for key
                                                        onClick={() => setCurrentFeaturedIndex(idx)}
                                                        className={cn(
                                                            "w-2 h-2 rounded-full transition-all duration-300",
                                                            currentFeaturedIndex === idx
                                                                ? "bg-gray-500 scale-125" // Active dot
                                                                : "bg-gray-600 hover:bg-gray-500" // Inactive dot
                                                        )}
                                                        aria-label={`Go to video ${idx + 1}`}
                                                        type="button"
                                                    />
                                                ))}
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        ) : (
                            // Message shown if video section is enabled but no videos are available
                             <div className="text-center text-gray-500 mb-16 py-8 border border-dashed border-gray-700 rounded-lg">
                                No video sessions available to display.
                            </div>
                        )}
                    </>
                )} {/* --- End of ENABLE_VIDEO_SECTION Check --- */}


                {/* --- Image Gallery Section --- */}
                <div>
                    <h3 className="text-2xl md:text-3xl font-semibold text-center mb-6 text-gray-100">
                        Tattoo <span className="text-white">Gallery</span>
                    </h3>

                    {/* Category filter buttons */}
                    <div className="flex flex-wrap justify-center gap-2 md:gap-3 mb-12">
                        {portfolioCategories.map((category) => (
                            <button
                                key={category.id}
                                onClick={() => setActiveCategory(category.id)}
                                className={cn(
                                    'px-3 py-1.5 md:px-4 md:py-2 text-sm font-medium rounded-md transition-all duration-300 border',
                                    activeCategory === category.id
                                        ? 'bg-gray-700 text-white border-gray-600 shadow-lg shadow-gray-900/30' // Active style
                                        : 'bg-gray-900 text-gray-300 border-gray-800 hover:bg-gray-800 hover:border-gray-700' // Inactive style
                                )}
                                type="button"
                            >
                                {category.name}
                            </button>
                        ))}
                    </div>

                    {/* Portfolio Image grid or "No Designs" Message */}
                    {filteredImageItems.length > 0 ? (
                        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                            {filteredImageItems.map((item) => ( // item is correctly inferred as PortfolioImageItem
                                <div
                                    key={item.id}
                                    className="group relative overflow-hidden rounded-lg shadow-lg bg-gray-900 border border-gray-800 hover:border-gray-800/50 transition-all duration-300 hover:shadow-gray-900/20 hover:shadow-xl"
                                >
                                    {/* Image container with aspect ratio and fallback centering */}
                                    <div className="aspect-[4/5] w-full overflow-hidden bg-gray-800 flex items-center justify-center text-gray-600">
                                        <img
                                            src={item.image}
                                            alt={item.title || `Portfolio image ${item.id}`} // Provide descriptive alt text
                                            className="w-full h-full object-cover object-center transition-transform duration-700 ease-in-out group-hover:scale-105"
                                            loading="lazy" // Lazy load images below the fold
                                            onError={handleImageError} // Add error handler
                                        />
                                        {/* Placeholder icon (could be shown via CSS if img fails) */}
                                         <ImageOff size={32} className="absolute hidden" />
                                    </div>

                                    {/* Enhanced overlay shown on hover */}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-3 md:p-4 pointer-events-none">
                                        <span className="inline-block px-2 py-0.5 text-xs font-semibold bg-gray-600/90 rounded-full text-white mb-2 self-start">
                                            {/* Find category name, fallback to ID */}
                                            {portfolioCategories.find(cat => cat.id === item.category)?.name || item.category}
                                        </span>
                                        <h4 className="text-white text-sm md:text-base font-bold mb-1 truncate">{item.title}</h4>
                                        <p className="text-gray-200 text-xs md:text-sm">Artist: {item.artist}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        // Message shown when no designs match the active filter
                        <div className="text-center py-16 bg-gray-900/50 rounded-xl border border-dashed border-gray-700">
                            <p className="text-gray-400 mb-3 text-lg">
                                No designs found in the "{portfolioCategories.find(cat => cat.id === activeCategory)?.name}" category.
                            </p>
                            <button
                                onClick={() => setActiveCategory('all')} // Button to reset filter
                                className="text-gray-400 hover:text-gray-300 font-medium hover:underline"
                                type="button"
                            >
                                View all designs instead
                            </button>
                        </div>
                    )}

                    {/* Call to action button below the gallery */}
                    <div className="mt-16 text-center">
                        <p className="text-gray-300 mb-6 text-lg">
                            Inspired? Let's create your next piece.
                        </p>
                        <button
                            type="button" // Explicitly set button type
                            onClick={onOpenBookingModal} // Trigger modal from parent
                            className="inline-block px-8 py-3 bg-gray-600 hover:bg-gray-700 text-white font-semibold rounded-lg shadow-lg hover:shadow-gray-900/30 transition-all duration-300 transform hover:scale-105"
                        >
                            Book Your Consultation
                        </button>
                    </div>
                </div>
            </div>
        </section>
    );
}

// --- Helper function cn (if not globally available or in utils) ---
// Usually placed in a separate utils file (e.g., src/lib/utils.ts)
// import { clsx, type ClassValue } from "clsx";
// import { twMerge } from "tailwind-merge";
//
// export function cn(...inputs: ClassValue[]) {
//   return twMerge(clsx(inputs));
// }
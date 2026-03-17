import React, { useEffect, useRef, useState, useCallback } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
// Optional: Install 'clsx' or use your project's 'cn' utility for cleaner class merging
// import clsx from 'clsx';
// import { cn } from '@/lib/utils'; // If using shadcn/ui utils

interface FileSubmissionGuideOverlayProps {
  open: boolean;
  onClose: () => void;
  placement?: string;
}

// Utility function to detect Safari (excluding Chromium variants)
function isSafariBrowser() {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent;
  return /Safari/i.test(ua) && !/Chrome|Chromium|Edg|OPR|Brave/i.test(ua);
}

const FileSubmissionGuideOverlay: React.FC<FileSubmissionGuideOverlayProps> = ({
  open,
  onClose,
  placement,
}) => {
  const [activeSlide, setActiveSlide] = useState(0);
  const overlayRef = useRef<HTMLDivElement>(null);
  const autoplayRef = useRef<NodeJS.Timeout | null>(null);
  const [isSafari, setIsSafari] = useState(false); // State to hold detection result

  // Run detection once on mount
  useEffect(() => {
    setIsSafari(isSafariBrowser());
  }, []);

  const slides = [
     {
      title: "Placement Photo",
      image:
        "https://res.cloudinary.com/dexcw6vg0/image/upload/v1745568419/odoepvhgbpmagfqo0gip.webp",
      description: `A clear, straight-on photo of the ${
        placement || "body part"
      } where you want the tattoo. Good lighting helps!`,
    },
    {
      title: "Reference Images",
      image:
        "https://res.cloudinary.com/dexcw6vg0/image/upload/v1745568419/h1dsfjqsjhhjydgdykpn.webp",
      description:
        "Examples of tattoos, art, photos, or styles you like that convey your desired aesthetic.",
    },
    {
      title: "Sketches (Optional)",
      image:
        "https://res.cloudinary.com/dexcw6vg0/image/upload/v1745568419/aypdxeb6ep6qdhftdcnr.webp",
      description:
        "If you have a rough drawing or sketch of your idea, feel free to include it.",
    },
  ];

  const nextSlide = useCallback(() => {
    setActiveSlide((prev) => (prev === slides.length - 1 ? 0 : prev + 1));
  }, [slides.length]);

  const prevSlide = useCallback(() => {
    setActiveSlide((prev) => (prev === 0 ? slides.length - 1 : prev - 1));
  }, [slides.length]);

  // --- Other Effects (autoplay, click outside, body scroll) remain the same ---
  useEffect(() => {
    if (!open) return;
    autoplayRef.current = setInterval(nextSlide, 5000);
    return () => { if (autoplayRef.current) clearInterval(autoplayRef.current); };
  }, [open, nextSlide]);

  useEffect(() => {
    if (autoplayRef.current) clearInterval(autoplayRef.current);
    if (open) { autoplayRef.current = setInterval(nextSlide, 5000); }
    return () => { if (autoplayRef.current) clearInterval(autoplayRef.current); };
  }, [activeSlide, open, nextSlide]);

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (overlayRef.current && !overlayRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => { document.removeEventListener("mousedown", handleClickOutside); };
  }, [open, onClose]);

  useEffect(() => {
    if (open) { document.body.style.overflow = 'hidden'; }
    else { document.body.style.overflow = ''; }
    return () => { document.body.style.overflow = ''; };
  }, [open]);
  // --- End Other Effects ---

  if (!open) return null;

  // Define classes based on browser detection
  const safariOuterClasses = "flex justify-center items-start px-4 pb-4 pt-[300px]";
  const safariInnerClasses = "mb-8";
  const chromeOuterClasses = "p-4";
  const chromeInnerClasses = "mx-auto mb-8";

  return (
    <div
      className={`fixed inset-0 bg-black/70 z-50 backdrop-blur-sm transition-all duration-300 overflow-y-auto ${
        isSafari ? safariOuterClasses : chromeOuterClasses // Conditionally apply outer classes
      }`}
    >
      <div
        ref={overlayRef}
        className={`relative max-w-lg w-full bg-gray-900 text-white rounded-xl p-6 shadow-xl border border-gray-700 ${
          isSafari ? safariInnerClasses : chromeInnerClasses // Conditionally apply inner classes
        }`}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors z-10"
          aria-label="Close Guide"
        >
          <X size={24} />
        </button>

        {/* Modal Title */}
        <h3 className="text-2xl font-bold mb-6 text-center">
          Reference Submission Guide
        </h3>

        {/* Carousel Container */}
        <div
          className="relative overflow-hidden rounded-lg mb-8"
          style={{ minHeight: "340px" }}
        >
          {/* Slides mapping */}
          <div className="relative w-full h-full">
            {slides.map((slide, index) => (
              <div
                key={index}
                className={`absolute inset-0 flex flex-col transition-opacity duration-500 ${
                  activeSlide === index
                    ? "opacity-100 z-10" // Active slide is visible
                    : "opacity-0 z-0 pointer-events-none" // Inactive slide is hidden
                }`}
                // --- Apply animation style only to the active slide ---
         
                // --- End animation style ---
              >
                {/* Slide Content */}
                <div className="flex justify-center mb-6">
                  <img
                    src={slide.image}
                    alt={slide.title}
                    className="w-48 h-48 rounded-lg object-cover mt-4"
                    loading="lazy"
                    style={
                      activeSlide === index
                        ? {
                            animation:
                              "glowPulse 3s infinite ease-in-out, rotateBrightSpot 0.5s infinite linear",
                          }
                        : undefined // No inline style for inactive slides
                    }
                  />
                </div>
                <h4 className="text-xl font-bold text-center text-blue-400 mb-3">
                  {slide.title}
                </h4>
                <p className="text-center text-gray-300 px-8">
                  {index === 0 && placement ? (
                    <>
                      A clear, straight-on photo of the{" "}
                      <span className="font-bold text-white">{placement}</span>{" "}
                      where you want the tattoo. Good lighting helps!
                    </>
                  ) : (
                    slide.description
                  )}
                </p>
              </div>
            ))}
          </div>

          {/* Carousel Controls */}
          <button
            onClick={prevSlide}
            className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full z-20 transition-colors"
            aria-label="Previous Slide"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            onClick={nextSlide}
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full z-20 transition-colors"
            aria-label="Next Slide"
          >
            <ChevronRight size={20} />
          </button>
          <div className="absolute bottom-0 left-0 right-0 flex justify-center gap-2 pb-2 z-20">
            {slides.map((_, index) => (
              <button
                key={index}
                onClick={() => setActiveSlide(index)}
                className={`w-2 h-2 rounded-full transition-colors ${
                  activeSlide === index ? "bg-blue-500" : "bg-gray-500 hover:bg-gray-400"
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        </div> {/* End Carousel Container */}


        {/* Confirmation Button */}
        <div className="flex justify-center">
          <button
            onClick={onClose}
            className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors font-medium"
          >
            Got It
          </button>
        </div>

      </div> {/* End Inner container (modal box) */}
    </div> // End Outer container
  );
};

export default FileSubmissionGuideOverlay;
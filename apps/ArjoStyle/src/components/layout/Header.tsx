import React, { useState, useEffect } from 'react'; // Import React and hooks
import { Menu, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Link, useNavigate } from 'react-router-dom';
// REMOVE BookingModal import - it's handled by the parent now
// import { BookingModal } from '@/components/booking/BookingModal';

// --- Define Props for State Lifting ---
interface HeaderProps {
  onOpenBookingModal: () => void; // Function passed from parent to open modal
}

export function Header({ onOpenBookingModal }: HeaderProps) { // <-- Accept prop
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  // --- REMOVE local state for booking modal ---
  // const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50); // Threshold for header change
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const headerTextColor = "text-white"; // Consistent light text for contrast

  // --- Use the passed-in prop to open the modal ---
  // const openBookingModal = () => {
  //   onOpenBookingModal();
  // }; // Can call prop directly

  // --- Updated mobile handler to use prop ---
  const handleMobileBookNowClick = () => {
      setIsMenuOpen(false);
      onOpenBookingModal(); // Call prop passed from parent
  };

  // --- Function to handle navigation and scrolling ---
  const handleNavClick = (hash: string, isMobile: boolean = false) => {
    if (isMobile) {
      setIsMenuOpen(false);
    }
    // If we are already on the home page ('/'), just scroll smoothly
    if (window.location.pathname === '/') {
        const element = document.getElementById(hash.substring(1)); // Remove #
        if (element) {
            // Add slight offset if header is fixed and might cover the section title
            const headerOffset = 80; // Adjust this value based on your header height
            const elementPosition = element.getBoundingClientRect().top + window.pageYOffset;
            const offsetPosition = elementPosition - headerOffset;

            window.scrollTo({
                top: offsetPosition,
                behavior: "smooth"
            });
        } else {
            console.warn(`Element with ID ${hash} not found on home page.`);
            // Optionally navigate to '/' just in case, though should already be there
            navigate('/');
        }
    } else {
        // Navigate to home page first, appending the hash
        // The target page ('/') needs logic to handle scrolling to the hash on load
        navigate(`/${hash}`);
    }
  };

  return (
    // --- REMOVED Fragment, Header is the only top-level element ---
      <header
        className={cn(
          'fixed top-0 left-0 right-0 z-50 px-6',
          'transition-all duration-700 ease-out', // Slower animation, ease-out
          isScrolled
            // --- UPDATED: Scrolled state with Subtle Dark Slate Fade ---
            ? 'py-3 bg-gradient-to-b from-slate-900/90 to-transparent'
            : 'py-6 bg-transparent'
        )}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link
            to="/"
            onClick={() => setIsMenuOpen(false)}
            className={cn(
              "text-2xl font-medium tracking-tight hover:opacity-80",
              "transition-colors duration-300",
              headerTextColor
            )}
          >
<div className="text-lg sm:text-3xl font-bold text-center leading-[1]">
  <span className="uppercase tracking-[0.25em]">
    <span className="text-[1.1em]">A</span>RJO
    <span className="text-[1.1em]">S</span>TYLE
  </span>
  <br />
  <span className="tracking-[0.6em] uppercase font-light">
    TATTOO
  </span>
</div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6 lg:space-x-8">
            {/* --- Use NavLink component that calls handleNavClick --- */}
            <NavLink href="#portfolio" textColor={headerTextColor} onClick={() => handleNavClick('#portfolio')}>Portfolio</NavLink>
            <NavLink href="#studio" textColor={headerTextColor} onClick={() => handleNavClick('#studio')}>Studio</NavLink>
            <NavLink href="#process" textColor={headerTextColor} onClick={() => handleNavClick('#process')}>Process</NavLink>
            <NavLink href="#faq" textColor={headerTextColor} onClick={() => handleNavClick('#faq')}>FAQ</NavLink>

            {/* --- Book Now always visible, calls prop --- */}
            <Button
              size="sm"
              className={cn( "transition-colors duration-300 ease-in-out", "bg-white/10 hover:bg-white/20 text-white border border-white/20" )}
              onClick={onOpenBookingModal} // Call prop passed from parent
            >
              Book Now
            </Button>
          </nav>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className={cn( "md:hidden p-2 focus:outline-none", "transition-colors duration-300", headerTextColor )}
            aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
          >
            {isMenuOpen ? ( <X className="w-6 h-6" /> ) : ( <Menu className="w-6 h-6" /> )}
          </button>
        </div>

        {/* Mobile Menu */}
        <div
          className={cn( "md:hidden absolute top-full left-0 right-0 shadow-lg transition-all duration-500 ease-in-out overflow-hidden", isMenuOpen ? "max-h-96 border-b border-gray-200/50 bg-white dark:bg-gray-900" : "max-h-0 border-b-0" )}
         >
          <div className={cn("transition-opacity duration-300 ease-in-out", isMenuOpen ? "opacity-100" : "opacity-0")}>
            <nav className="flex flex-col p-6 space-y-4">
              {/* --- Use MobileNavLink component that calls handleNavClick --- */}
              <MobileNavLink href="#portfolio" onClick={() => handleNavClick('#portfolio', true)}>Portfolio</MobileNavLink>
              <MobileNavLink href="#studio" onClick={() => handleNavClick('#studio', true)}>Studio</MobileNavLink>
              <MobileNavLink href="#process" onClick={() => handleNavClick('#process', true)}>Process</MobileNavLink>
              <MobileNavLink href="#faq" onClick={() => handleNavClick('#faq', true)}>FAQ</MobileNavLink>
                <div className="pt-4">
                    {/* Book Now always visible */}
                    <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90" onClick={handleMobileBookNowClick} > Book Now </Button>
                </div>
            </nav>
          </div>
        </div>
      </header>
    // --- REMOVED BookingModal rendering from here ---
    //</> // Fragment no longer needed if modal isn't rendered here
  );
}

// --- Updated NavLink to use button/onClick ---
function NavLink({ href, children, textColor, onClick }: { href: string; children: React.ReactNode; textColor: string; onClick: () => void; }) {
  return (
    <button // Changed to button as it triggers an action (navigate + scroll)
      onClick={onClick}
      className={cn(
        "text-sm font-medium hover:opacity-80",
        "transition-colors duration-300",
        textColor
      )}
    >
      {children}
    </button>
  );
}

// --- Updated MobileNavLink similarly ---
function MobileNavLink({ href, onClick, children }: { href: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className="text-lg text-left font-medium text-gray-900 dark:text-gray-100 hover:text-primary dark:hover:text-primary transition-colors duration-300" // Use text-left for button alignment
    >
      {children}
    </button>
  );
}
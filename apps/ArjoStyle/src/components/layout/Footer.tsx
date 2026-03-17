import React, { useState } from 'react';
import { Facebook, Instagram, Twitter } from 'lucide-react';
import { Link } from 'react-router-dom';
// Import your SignInModal component here
import { SignInModal } from '@/components/auth/SignInModal'; // Example path

export function Footer() {
  const currentYear = new Date().getFullYear();
  const [isSignInModalOpen, setIsSignInModalOpen] = useState(false);

  // Placeholder Studio Info
  const studioName = "ArjoStyle Tattoo";
  const studioSlogan = "Premium tattoo artistry focused on minimalist designs and client experience.";
  const instagramLink = "https://www.instagram.com/arjostyle";
  const facebookLink = "https://www.facebook.com/arjoStyleTattoo";
  const studioAddressLine1 = "043 Maria Clara St.";
  const studioAddressLine2 = "2nd Floor, D.A. Tirol Building";
  const studioCity = "Tagbilaran City, 6300";
  const studioProvince = "Bohol, Philippines";
  const studioEmail = "arjomagno@gmail.com";
  const studioPhone = "09273072909";
  // End Placeholders

  return (
    <>
      <footer className="bg-gray-100 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700/50 text-gray-600 dark:text-gray-400">
        <div className="max-w-7xl mx-auto py-12 px-6 md:py-16">
          {/* Main Footer Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-10">

            {/* Studio Info & Socials */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{studioName}</h3>
              <p className="text-sm max-w-xs">{studioSlogan}</p>
              <div className="flex items-center space-x-3">
                <SocialLink href={instagramLink} icon={<Instagram className="w-5 h-5" />} />
                <SocialLink href={facebookLink} icon={<Facebook className="w-5 h-5" />} />
                {/* <SocialLink href={twitterLink} icon={<Twitter className="w-5 h-5" />} /> */}
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="text-sm font-medium uppercase tracking-wider text-gray-500 dark:text-gray-500 mb-4">Quick Links</h4>
              <ul className="space-y-3">
                <FooterLink href="#portfolio">Portfolio</FooterLink>
                <FooterLink href="#process">Process</FooterLink>
                <FooterLink href="#faq">FAQ</FooterLink>
                {/* --- ADDED Aftercare Link --- */}
                <FooterLink href="/aftercare">Aftercare</FooterLink>
                <FooterLink href="/contact">Contact Us</FooterLink>
              </ul>
            </div>

            {/* Legal Links */}
            <div>
              <h4 className="text-sm font-medium uppercase tracking-wider text-gray-500 dark:text-gray-500 mb-4">Legal</h4>
              <ul className="space-y-3">
                 {/* Use React Router Link for internal pages */}
                <li><Link to="/privacy" className="text-sm hover:text-gray-900 dark:hover:text-white transition-colors duration-200">Privacy Policy</Link></li>
                <li><Link to="/terms" className="text-sm hover:text-gray-900 dark:hover:text-white transition-colors duration-200">Terms of Service</Link></li>
                <li><Link to="/cookies" className="text-sm hover:text-gray-900 dark:hover:text-white transition-colors duration-200">Cookie Policy</Link></li>
              </ul>
            </div>

            {/* Contact Details */}
            <div>
              <h4 className="text-sm font-medium uppercase tracking-wider text-gray-500 dark:text-gray-500 mb-4">Contact</h4>
              <ul className="space-y-2 text-sm">
                <li className="leading-snug">{studioAddressLine1}</li>
                <li className="leading-snug">{studioAddressLine2}</li>
                <li className="leading-snug">{studioCity}</li>
                <li className="leading-snug">{studioProvince}</li>
                <li className="pt-2"><a href={`mailto:${studioEmail}`} className="hover:text-gray-900 dark:hover:text-white transition-colors duration-200">{studioEmail}</a></li>
                <li><a href={`tel:${studioPhone}`} className="hover:text-gray-900 dark:hover:text-white transition-colors duration-200">{studioPhone}</a></li>
              </ul>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="border-t border-gray-200 dark:border-gray-700/50 mt-10 md:mt-12 pt-8 flex flex-col md:flex-row items-center justify-between text-xs">
            <p>&copy; {currentYear} {studioName}. All rights reserved.</p>
            <div className="flex items-center space-x-4 mt-4 md:mt-0">
               {/* Use React Router Links */}
              <Link to="/privacy" className="hover:text-gray-900 dark:hover:text-white transition-colors">Privacy</Link>
              <Link to="/terms" className="hover:text-gray-900 dark:hover:text-white transition-colors">Terms</Link>
              <Link to="/contact" className="hover:text-gray-900 dark:hover:text-white transition-colors">Contact</Link>
              <button onClick={() => setIsSignInModalOpen(true)} className="hover:text-gray-900 dark:hover:text-white transition-colors font-medium" > Sign In </button>
            </div>
          </div>
        </div>
      </footer>

      {/* Render SignInModal */}
       <SignInModal
         open={isSignInModalOpen}
         onOpenChange={setIsSignInModalOpen}
       />
    </>
  );
}

// FooterLink helper component
function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  const isInternalPage = href.startsWith('/'); // Simple check for page links vs # links
  const isAnchorLink = href.startsWith('#');

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
      if (isAnchorLink) {
          e.preventDefault(); // Prevent default anchor jump
          const elementId = href.substring(1);
          const element = document.getElementById(elementId);
          if (element) {
              const headerOffset = 80; // Adjust based on your fixed header height
              const elementPosition = element.getBoundingClientRect().top + window.pageYOffset;
              const offsetPosition = elementPosition - headerOffset;
              window.scrollTo({ top: offsetPosition, behavior: "smooth" });
          } else {
               // Optional: Navigate to home if element not found (maybe it's on home page)
               // window.location.href = `/${href}`; // Simple redirect
          }
      }
      // Internal page links handled by React Router's Link component
  };

  return (
    <li>
      {isInternalPage ? (
         <Link to={href} className="text-sm hover:text-gray-900 dark:hover:text-white transition-colors duration-200"> {children} </Link>
      ) : (
        <a href={href} onClick={isAnchorLink ? handleClick : undefined} className="text-sm hover:text-gray-900 dark:hover:text-white transition-colors duration-200">
          {children}
        </a>
      )}
    </li>
  );
}


// SocialLink helper component
function SocialLink({ href, icon }: { href: string; icon: React.ReactNode }) {
  return ( <a href={href} target="_blank" rel="noopener noreferrer" className="p-1 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors duration-200" aria-label={href.includes('instagram') ? 'Instagram' : href.includes('facebook') ? 'Facebook' : href.includes('twitter') ? 'Twitter' : 'Social Media'} > {icon} </a> );
}
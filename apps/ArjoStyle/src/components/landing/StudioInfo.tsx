import React from 'react';
import { MapPin, Clock, Award, ExternalLink } from 'lucide-react';
import { RevealOnScroll } from '@/components/ui/RevealOnScroll'; // Adjust path if necessary

// --- InfoCard Component Definition (Updated with Dark Theme) ---
interface InfoCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  children?: React.ReactNode; // Optional children
}

function InfoCard({ icon, title, description, children }: InfoCardProps) {
  return (
    // Apply dark theme styles from ProcessStepCard
    <div className="bg-gray-800 rounded-lg p-6 shadow-md hover:shadow-lg transition-shadow duration-300 h-full flex flex-col border border-gray-700">
      {/* Icon Wrapper - Keep original color props for distinction */}
      <div className="mb-3">
        {icon}
      </div>
      {/* Title - Light text color */}
      <h3 className="text-gray-100 text-xl font-semibold mb-2">{title}</h3>
      {/* Description - Lighter gray text color */}
      <p className="text-gray-300 mb-4">{description}</p>
      {/* Children - Ensure nested text has appropriate dark theme colors */}
      {children && <div className="mt-4">{children}</div>}
    </div>
  );
}


// --- StudioInfo Section Component (Updated with Embedded Map) ---
export function StudioInfo() {
  // Link for the InfoCard - keep this
  const googleMapsLinkUrl = "https://www.google.com/maps/place/D.A.+Tirol+Bldg/@9.6512593,123.8537407,19.75z/data=!4m6!3m5!1s0x33aa4dbb1136b19b:0x59321559759e6b6b!8m2!3d9.6513249!4d123.8539888!16s%2Fg%2F11gbdwz9z9?entry=ttu"; // Example URL - replace if needed

  // *** Google Maps Embed Src URL (Get this from Google Maps Embed Tab) ***
  // IMPORTANT: Replace this placeholder 'src' with the actual 'src' from the <iframe> code you copied from Google Maps!
  const googleMapsEmbedSrc = "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d982.9484490944885!2d123.85338552840756!3d9.651259341481402!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x33aa4dbb1136b19b%3A0x59321559759e6b6b!2sD.A.%20Tirol%20Bldg!5e0!3m2!1sen!2sph!4v1714321548139!5m2!1sen!2sph"; // Replace this example!

  return (
    // Apply dark section background, matching TattooProcess
    <section id="studio" className="py-24 bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"> {/* Adjusted padding like TattooProcess */}
        {/* Section Header - Adjusted text colors for dark background */}
        <RevealOnScroll>
          <h2 className="text-3xl md:text-4xl font-semibold text-center mb-4 text-gray-100">
            My Studio
          </h2>
        </RevealOnScroll>
        <RevealOnScroll delay={100}>
          <p className="text-gray-400 text-lg text-center max-w-3xl mx-auto mb-10"> {/* Use lighter gray */}
            An elegant space designed for comfort and creativity, where art meets perfection.
          </p>
        </RevealOnScroll>

        {/* Studio Images & Map */}
        <RevealOnScroll delay={200}>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-16">

            {/* --- Google Map Embed Area --- */}
            <div className="lg:col-span-8 rounded-lg overflow-hidden h-[400px] bg-gray-700"> {/* Container for map */}
              {googleMapsEmbedSrc ? (
                <iframe
                  src={googleMapsEmbedSrc} // Use the embed src URL
                  width="100%"              // Fill container width
                  height="100%"             // Fill container height
                  className="border-0"      // Use Tailwind for no border
                  allowFullScreen={true}    // Use camelCase for React prop
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="Studio Location on Google Maps" // Added title for accessibility
                ></iframe>
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  Map loading error or SRC missing...
                </div>
              )}
            </div>
            {/* --- End Google Map Embed Area --- */}

            <div className="lg:col-span-4 grid grid-rows-2 gap-6">
              <div className="rounded-lg overflow-hidden h-[188px] bg-gray-700"> {/* Slightly darker placeholder bg */}
                <img
                  src="https://res.cloudinary.com/dexcw6vg0/image/upload/v1745826257/r8h4fpmjdecybf1txnmh.jpg" // Replace with your image
                  alt="Tattoo station"
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
              <div className="rounded-lg overflow-hidden h-[188px] bg-gray-700"> {/* Slightly darker placeholder bg */}
                <img
                  src="https://res.cloudinary.com/dexcw6vg0/image/upload/v1745826252/pzppd1yspyct2yvvdmlx.jpg" // Replace with your image
                  alt="Tattoo equipment"
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
            </div>
          </div>
        </RevealOnScroll>

        {/* Studio Info Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8"> {/* Added lg:gap-8 like TattooProcess */}

          {/* Location Card */}
          <RevealOnScroll delay={300}>
            <InfoCard
              icon={<MapPin className="w-8 h-8 text-blue-600" />} // Icon color kept for distinction
              title="Location"
              description="Located in the heart of Tagbilaran City, our space is designed for comfort and privacy during your tattoo experience."
            >
              {/* Adjusted text colors for dark theme */}
              <div className="text-sm space-y-3">
                <div>
                  <p className="font-medium text-gray-200">Address:</p> {/* Lighter gray */}
                  <address className="not-italic text-gray-300 leading-relaxed"> {/* Lighter gray */}
                    043 Maria Clara St.<br />
                    2nd Floor, D.A. Tirol Building<br />
                    Tagbilaran City, 6300<br />
                    Bohol, Philippines
                  </address>
                </div>
                <div>
                  <p className="font-medium text-gray-200">Landmarks:</p> {/* Lighter gray */}
                  <p className="text-gray-400 leading-relaxed"> {/* Lighter gray */}
                    Above Paeng's Fried Chicken<br />
                    Across from University of Bohol
                  </p>
                </div>
                {/* Link now uses the googleMapsLinkUrl */}
                 <a
                  href={googleMapsLinkUrl} // Use the separate link URL here
                  target="_blank"
                  rel="noopener noreferrer"
                  // Adjusted link color for dark theme
                  className="pt-3 inline-flex items-center font-medium text-blue-400 hover:text-blue-300 hover:underline transition-colors"
                >
                  View on Google Maps
                  <ExternalLink className="w-4 h-4 ml-1.5" />
                </a>
              </div>
            </InfoCard>
          </RevealOnScroll>

          {/* Hours Card (Updated) */}
          <RevealOnScroll delay={400}>
            <InfoCard
              icon={<Clock className="w-8 h-8 text-purple-600" />} // Icon color kept
              title="Hours"
              description="We operate by appointment only to ensure every client receives our full attention and care."
            >
              {/* Adjusted text colors for dark theme */}
               <p className="text-sm font-medium text-gray-300 italic mb-4"> {/* Lighter gray */}
                 By Appointment Only
               </p>
              <div className="text-sm space-y-2">
                 <div className="flex justify-between text-gray-300"> {/* Lighter gray */}
                   <span>Tuesday - Friday:</span>
                   <span className="font-medium">11AM - 7PM</span>
                 </div>
                 <div className="flex justify-between text-gray-300"> {/* Lighter gray */}
                   <span>Saturday:</span>
                   <span className="font-medium">10AM - 6PM</span>
                 </div>
                 <div className="flex justify-between text-gray-500"> {/* Dimmer gray for closed */}
                   <span>Sunday - Monday:</span>
                   <span className="font-medium">Closed</span>
                 </div>
              </div>
            </InfoCard>
          </RevealOnScroll>

          {/* Standards Card (Updated) */}
          <RevealOnScroll delay={500}>
            <InfoCard
              icon={<Award className="w-8 h-8 text-green-600" />} // Icon color kept
              title="Our Standards"
              description="We prioritize safety, hygiene, and artistic excellence in every tattoo we create."
            >
              {/* Adjusted text colors for dark theme */}
              <ul className="space-y-2 text-sm text-gray-300"> {/* Lighter gray */}
                <li className="flex items-center">
                  {/* Bullet color kept matching icon */}
                  <span className="w-1.5 h-1.5 bg-green-600 rounded-full mr-2.5 flex-shrink-0"></span>
                  Single-use needles
                </li>
                <li className="flex items-center">
                  <span className="w-1.5 h-1.5 bg-green-600 rounded-full mr-2.5 flex-shrink-0"></span>
                  Hospital-grade sterilization
                </li>
                <li className="flex items-center">
                   <span className="w-1.5 h-1.5 bg-green-600 rounded-full mr-2.5 flex-shrink-0"></span>
                   Premium inks and equipment
                </li>
                <li className="flex items-center">
                   <span className="w-1.5 h-1.5 bg-green-600 rounded-full mr-2.5 flex-shrink-0"></span>
                   Certified professional artists
                </li>
              </ul>
            </InfoCard>
          </RevealOnScroll>

        </div> {/* End Grid */}
      </div> {/* End Container */}
    </section>
  );
}
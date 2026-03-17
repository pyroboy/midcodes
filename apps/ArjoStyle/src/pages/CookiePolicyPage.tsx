// src/pages/CookiePolicyPage.tsx (Example path)
import { useState } from 'react';
import { Header } from "@/components/layout/Header"; // Adjust path if needed
import { Footer } from "@/components/layout/Footer"; // Adjust path if needed
import { Link } from 'react-router-dom'; // If using React Router for Privacy Policy link

export function CookiePolicyPage() {
  // Get current date for "Last Updated"
  const lastUpdatedDate = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
  });
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const handleOpenBookingModal = () => {
      setBookingModalOpen(true);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header onOpenBookingModal={handleOpenBookingModal} />
      <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        <h1 className="text-3xl md:text-4xl font-bold text-center mb-8 text-gray-900 dark:text-gray-100">
          Cookie Policy
        </h1>
        <div className="prose dark:prose-invert prose-sm sm:prose-base lg:prose-lg max-w-4xl mx-auto space-y-6 text-gray-700 dark:text-gray-300">
          <p className="text-xs text-center text-muted-foreground">
            Last Updated: {lastUpdatedDate}
          </p>

          <section>
            <h2 className="text-xl font-semibold">1. What Are Cookies?</h2>
            <p>
              Cookies are small text files stored on your device (computer, tablet, mobile phone) when you visit certain websites. They are widely used to make websites work, or work more efficiently, as well as to provide information to the owners of the site. Cookies help us recognize your device and remember information about your visit, like your preferences or actions over time.
            </p>
            <p>
               This policy also covers similar technologies like local storage, which we use for functionalities like remembering your theme preference.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">2. How We Use Cookies</h2>
            <p>
              ArjoStyle Tattoo uses cookies and similar technologies for limited purposes to ensure our website functions correctly and to improve your experience. We currently use or may use cookies for:
            </p>
            <ul>
              <li>
                <strong>Essential Operations:</strong> Some cookies may be necessary for the basic technical operation of our website, such as navigation and security. These are often session cookies that expire when you close your browser.
              </li>
              <li>
                <strong>Functionality:</strong> We use local storage (similar to cookies but stores more data locally without sending it back to the server automatically) to remember your preferences, such as your chosen theme (light/dark).
              </li>
              <li>
                <strong>Performance and Analytics (Optional - Requires Consent):</strong> [MODIFY OR REMOVE THIS SECTION BASED ON ACTUAL USE] We may use analytics cookies (e.g., via Google Analytics) to understand how visitors interact with our website (e.g., which pages are popular, how long visitors stay). This helps us improve the site. These cookies collect information anonymously. We will only place these cookies on your device if you provide your explicit consent through our cookie consent mechanism.
              </li>
            </ul>
             <p>
               We **do not** use cookies for targeted advertising purposes.
             </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">3. Types of Cookies We May Use</h2>
            <p>
              Here's a breakdown of the types of cookies that websites commonly use, and which ones may apply to our site:
            </p>
            <ul>
              <li>
                <strong>Strictly Necessary Cookies:</strong> These are essential for the website to function properly and cannot be switched off in our systems. They are usually only set in response to actions made by you which amount to a request for services, such as navigating pages or basic security functions. You can set your browser to block these cookies, but some parts of the site may not work then.
              </li>
              <li>
                 <strong>Functionality Technologies (Local Storage):</strong> As mentioned, we use local storage to remember your theme preference. This is stored in your browser and is not automatically sent to our server.
              </li>
              <li>
                <strong>Performance / Analytics Cookies:</strong> [MODIFY OR REMOVE] These allow us to count visits and traffic sources so we can measure and improve the performance of our site. They help us know which pages are the most and least popular and see how visitors move around the site. All information these cookies collect is aggregated and therefore anonymous. If you do not allow these cookies (via our consent tool), we will not know when you have visited our site.
              </li>
              <li>
                <strong>Targeting / Advertising Cookies:</strong> We **do not** use these types of cookies on our website. These cookies are typically used by advertising networks to build a profile of your interests and show you relevant adverts on other sites.
              </li>
            </ul>
          </section>

           <section>
            <h2 className="text-xl font-semibold">4. Third-Party Cookies</h2>
            <p>
               Our website may contain links to social media platforms (like Instagram, Facebook) or embedded content (like Google Maps). These third-party services may set their own cookies on your device when you interact with them or visit pages containing their content. We do not control the setting of these cookies. Please review the respective privacy and cookie policies of these third-party services for more information.
            </p>
           </section>

          <section>
            <h2 className="text-xl font-semibold">5. Your Choices and Managing Cookies</h2>
             <p>
                In compliance with the Data Privacy Act of 2012, we seek your consent before placing non-essential cookies (like Analytics cookies, if used) on your device. You can manage your preferences through the cookie consent banner or tool provided on our website [REMOVE/MODIFY IF NO BANNER/TOOL IS IMPLEMENTED YET - you may need to add one].
             </p>
            <p>
              Most web browsers allow some control of most cookies through the browser settings. You can usually find these settings in the 'Options' or 'Preferences' menu of your browser. To find out more about cookies, including how to see what cookies have been set and how to manage and delete them, visit <a href="https://www.aboutcookies.org" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">www.aboutcookies.org</a> or <a href="https://www.allaboutcookies.org" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">www.allaboutcookies.org</a>.
            </p>
            <p>
              Please note that blocking strictly necessary cookies may impact the functionality of our website. Blocking local storage will prevent preferences like theme selection from being saved.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">6. Changes to This Cookie Policy</h2>
            <p>
              We may update this Cookie Policy from time to time. Any changes will be posted on this page with an updated "Last Updated" date. We encourage you to review this policy periodically.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">7. Contact Us</h2>
            <p>
              If you have any questions about our use of cookies, please refer to our <Link to="/privacy-policy" className="text-primary hover:underline">Privacy Policy</Link> or contact us at:
            </p>
             <ul>
               <li><strong>Email:</strong> [Your Studio Email]</li>
               <li><strong>Phone:</strong> [Your Studio Phone]</li>
             </ul>
          </section>

           <hr/>

           <p className="text-sm text-center text-muted-foreground">
             <strong>Legal Disclaimer:</strong> This Cookie Policy is provided for informational purposes. For specific legal advice regarding cookie compliance in the Philippines, please consult with a qualified legal professional.
           </p>

        </div>
      </main>
      <Footer />
    </div>
  );
}

export default CookiePolicyPage; // Uncomment if using default export
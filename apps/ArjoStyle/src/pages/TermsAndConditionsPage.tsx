// src/pages/TermsAndConditionsPage.tsx (Example path)

import React from 'react';
import { Header } from "@/components/layout/Header"; // Adjust path if needed
import { Footer } from "@/components/layout/Footer"; // Adjust path if needed

export function TermsAndConditionsPage() {
  // Get current date for "Last Updated"
  const lastUpdatedDate = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
  });

  return (
    <div className="min-h-screen flex flex-col">
      <Header onOpenBookingModal={() => {}} />
      <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        <h1 className="text-3xl md:text-4xl font-bold text-center mb-8 text-gray-900 dark:text-gray-100">
          Terms and Conditions
        </h1>
        {/* Apply prose classes for typography styling */}
        <div className="prose dark:prose-invert prose-sm sm:prose-base lg:prose-lg max-w-4xl mx-auto space-y-6 text-gray-700 dark:text-gray-300">
          <p className="text-xs text-center text-muted-foreground">
            Last Updated: {lastUpdatedDate}
          </p>

          <p>
            Welcome to ArjoStyle Tattoo ("Studio", "we", "us", "our"). These Terms and Conditions ("Terms") govern your use of our website, booking services, and tattoo services provided at our studio located in Tagbilaran City, Bohol, Philippines. By booking an appointment or receiving services from us, you ("Client", "you", "your") agree to be bound by these Terms. Please read them carefully.
          </p>

          <section>
            <h2 className="text-xl font-semibold">1. Eligibility and Age Requirement</h2>
            <p>
              You must be at least <strong>18 years of age</strong> to receive a tattoo at our Studio, in compliance with Philippine law. Valid, government-issued photo identification (e.g., Passport, Driver's License, UMID, Postal ID) proving your age is mandatory and will be checked at the time of your appointment. We reserve the right to refuse service to anyone who cannot provide valid proof of age.
            </p>
            <p>
              We reserve the right to refuse service to any individual who appears to be under the influence of alcohol or drugs, exhibits inappropriate behavior, or has a medical condition that may compromise the safety of the tattoo procedure or healing process.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">2. Booking Process</h2>
            <p>
              All tattoo services are strictly <strong>by appointment only</strong>. Appointments must be initiated through our online Booking Form available on our website.
            </p>
            <p>
              The booking process generally involves:
            </p>
            <ul>
              <li>Submitting the online Booking Form with your personal details, design ideas, placement preferences, estimated size, reference images, and scheduling preferences.</li>
              <li>An initial consultation (via your preferred contact method) with the artist or studio representative to discuss and finalize the design, placement, estimated duration, number of sessions (if applicable), and final price.</li>
              <li>Payment of a non-refundable deposit to secure your appointment slot.</li>
              <li>Confirmation of your appointment once the deposit is received.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold">3. Deposits</h2>
            <p>
              A <strong>non-refundable deposit</strong>, typically 50% of the estimated tattoo cost (minimum deposit amount may apply), is required to secure your booking. The exact deposit amount will be communicated during the consultation process.
            </p>
            <p>
              This deposit confirms your commitment to the appointment and compensates the artist for their time spent on consultation, design preparation, and holding the appointment slot. The deposit amount will be deducted from the final price of your tattoo, payable upon completion of the session.
            </p>
            <p>
              Deposits are forfeited if you cancel your appointment, do not show up, or reschedule with less than the required notice (see Section 5).
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">4. Pricing and Payment</h2>
            <p>
              The price estimate provided by the online Tattoo Calculator is an initial approximation based on the information you provide. The <strong>final price</strong> will be determined by the artist during the consultation based on the final design's size, complexity, detail, placement, and estimated time required.
            </p>
            <p>
              The remaining balance (total price minus deposit) is due in full immediately upon completion of your tattoo session. We primarily accept cash for the final payment. Accepted methods for the deposit (e.g., GCash, Bank Transfer) will be confirmed during the booking process.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">5. Cancellations and Rescheduling</h2>
            <p>
              We understand that unforeseen circumstances can arise. If you need to reschedule your appointment, we require at least <strong>48-72 hours notice</strong> prior to your scheduled appointment time.
            </p>
            <p>
              With sufficient notice (48-72 hours or more), we can typically transfer your deposit to a new appointment date once. Rescheduling is subject to artist availability.
            </p>
            <p>
              Failure to provide the required notice for rescheduling, or cancelling your appointment altogether, will result in the <strong>forfeiture of your non-refundable deposit</strong>. Not showing up for your appointment without any prior notice will also result in deposit forfeiture.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">6. Design and Artwork</h2>
            <p>
              We welcome your ideas, reference images, and sketches. You can upload these via the booking form. The artist will work with you during the consultation to refine the design for optimal tattooing results and placement.
            </p>
            <p>
              Minor adjustments to the design are often possible during the consultation. However, significant changes to the concept, size, or placement submitted in the initial booking form may require re-estimation of price and time, and potentially rescheduling the appointment (which may affect your deposit if insufficient notice is given for the original date).
            </p>
            <p>
              The artist reserves the right to refuse any design or placement they deem inappropriate, unsafe, technically unsuitable for tattooing, or outside their artistic style or capability.
            </p>
            <p>
              All custom artwork and designs created by our artists specifically for your tattoo remain the intellectual property of the artist and ArjoStyle Tattoo unless otherwise agreed upon in writing. Reproductions of the custom design require explicit permission.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">7. Health, Safety, and Consent</h2>
            <p>
              Your health and safety are paramount. We adhere to strict hygiene protocols, using single-use, pre-sterilized needles and grips for every client. All reusable equipment is cleaned and sterilized using hospital-grade methods. Work surfaces are disinfected before and after each client.
            </p>
            <p>
              While completing the online booking form, you will be asked to confirm your understanding of the need to disclose relevant medical information. We do not collect detailed medical conditions through the online form for privacy reasons.
            </p>
            <p>
              However, prior to starting any tattoo procedure at the studio, you will be required to complete and sign a **Medical Disclosure and Consent Form**. This form will ask specific questions about pre-existing medical conditions, allergies (including latex, inks, ointments), skin conditions (eczema, psoriasis, etc.), medications (especially blood thinners), and other factors that might affect the tattoo process or healing (e.g., diabetes, epilepsy, heart conditions, bleeding disorders, pregnancy, breastfeeding).
            </p>
            <p>
               <strong>It is your sole responsibility to provide accurate and complete information on this in-person form.</strong> Failure to disclose relevant conditions could jeopardize your safety or the outcome of the tattoo, and may result in refusal of service or complications for which the Studio is not liable. Please discuss any concerns with your artist during the consultation or before signing the consent form.
            </p>
            <p>
              By proceeding with the tattoo after signing the consent form, you acknowledge the inherent risks associated with tattooing (including but not limited to pain, infection, scarring, allergic reactions) and confirm you are undertaking the procedure voluntarily.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">8. Aftercare and Touch-Ups</h2>
            <p>
              Proper aftercare is crucial for the healing and final appearance of your tattoo. Your artist will provide detailed verbal and written aftercare instructions upon completion of your session.
            </p>
            <p>
              You are responsible for following these instructions diligently. Failure to follow aftercare instructions can lead to poor healing, infection, color loss, or scarring, for which the Studio is not responsible.
            </p>
            <p>
              We typically offer one complimentary touch-up session within 2-3 months of the original appointment, provided the tattoo has healed and proper aftercare was followed. Touch-ups address minor imperfections that may occur during the natural healing process. Touch-ups required due to negligent aftercare (e.g., sun exposure, picking, soaking) may incur a fee. Eligibility for a free touch-up is at the discretion of the artist.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">9. Limitation of Liability</h2>
            <p>
              You agree that ArjoStyle Tattoo and its artists shall not be liable for any unforeseen reactions or complications arising from the tattoo procedure or your failure to follow aftercare instructions. Our liability is limited to the cost of the service provided. We are not liable for any indirect or consequential damages.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">10. Privacy</h2>
            <p>
              We collect personal information during the booking process solely for the purpose of scheduling, communication, and providing our services. We respect your privacy. Please refer to our [Link to Privacy Policy - ADD LINK HERE IF YOU HAVE ONE] for details on how we handle your data.
            </p>
          </section>

           <section>
            <h2 className="text-xl font-semibold">11. Governing Law</h2>
            <p>
              These Terms and Conditions shall be governed by and construed in accordance with the laws of the Republic of the Philippines. Any disputes arising shall be subject to the exclusive jurisdiction of the courts of Tagbilaran City, Bohol.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">12. Amendments</h2>
            <p>
              We reserve the right to modify these Terms and Conditions at any time. Changes will be effective immediately upon posting on our website. Your continued use of our services after changes are posted constitutes your acceptance of the revised Terms.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">13. Contact</h2>
            <p>
              If you have any questions about these Terms, please contact us at [Your Studio Email] or [Your Studio Phone].
            </p>
          </section>

          <hr/>

          <p className="text-sm text-center text-muted-foreground">
            <strong>Legal Disclaimer:</strong> The information provided in these Terms and Conditions is for general informational purposes only and does not constitute legal advice. ArjoStyle Tattoo is not a law firm. You should consult with a qualified legal professional in the Philippines to address your specific legal needs and ensure compliance with all applicable laws and regulations.
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default TermsAndConditionsPage; // Uncomment if using default export
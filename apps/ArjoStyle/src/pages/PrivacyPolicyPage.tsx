// src/pages/PrivacyPolicyPage.tsx (Example path)

import React from 'react';
import { Header } from "@/components/layout/Header"; // Adjust path if needed
import { Footer } from "@/components/layout/Footer"; // Adjust path if needed

export function PrivacyPolicyPage() {
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
          Privacy Policy
        </h1>
        <div className="prose dark:prose-invert prose-sm sm:prose-base lg:prose-lg max-w-4xl mx-auto space-y-6 text-gray-700 dark:text-gray-300">
          <p className="text-xs text-center text-muted-foreground">
            Last Updated: {lastUpdatedDate}
          </p>

          <section>
            <h2 className="text-xl font-semibold">1. Introduction</h2>
            <p>
              ArjoStyle Tattoo ("Studio", "we", "us", "our") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, store, and protect your personal information in compliance with the Republic Act No. 10173, also known as the Data Privacy Act of 2012 (DPA), its Implementing Rules and Regulations (IRR), and other relevant issuances by the National Privacy Commission (NPC).
            </p>
            <p>
              This policy applies to all personal information collected through our website, online booking form, communications, and during your visits to our studio in Tagbilaran City, Bohol, Philippines.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">2. Information We Collect</h2>
            <p>
              We collect information necessary to provide you with our tattoo services, manage bookings, ensure safety, and communicate effectively. This may include:
            </p>
            <ul>
              <li>
                <strong>Personal Information:</strong> Your full name, email address, phone number, date of birth (for age verification), referral source, artist preference, preferred contact method, optional social media handles (Instagram/Facebook if provided), appointment details (date, time, urgency).
              </li>
              <li>
                <strong>Tattoo-Related Information:</strong> Requested size, placement details, color preferences, descriptions of your idea, specific requirements, must-have elements, reference images you upload, creative freedom level, placement notes, cover-up status.
              </li>
              <li>
                <strong>Sensitive Personal Information (Collected Primarily In-Person):</strong> While our online form asks you to confirm your intent to disclose, specific health information relevant to the tattoo procedure (such as allergies, skin conditions, certain medical conditions like diabetes or bleeding disorders, pregnancy status, medications) is collected primarily through a mandatory, separate Medical Disclosure and Consent Form completed and signed **at the studio** before your procedure begins. Your explicit consent will be obtained for processing this sensitive information via that form.
              </li>
               <li>
                 <strong>Agreement Confirmations:</strong> Records of your agreement to our Terms and Conditions, Medical Disclosure Confirmation, and Age Confirmation via checkboxes in the booking process.
               </li>
               <li>
                 <strong>Website Usage Data (if applicable):</strong> We may collect non-identifiable data about your website visit through cookies or analytics tools (e.g., pages visited, browser type) to improve user experience. [REMOVE OR MODIFY IF NOT USING COOKIES/ANALYTICS].
               </li>
            </ul>
          </section>

           <section>
            <h2 className="text-xl font-semibold">3. Basis and Purpose of Processing</h2>
            <p>
              We collect and process your personal information based on the following legal grounds and for specific purposes:
            </p>
            <ul>
                <li><strong>Consent:</strong> By submitting the online booking form and agreeing to our Terms and Conditions (including this Privacy Policy), you consent to the collection and processing of your personal information for the purposes outlined below. Separate explicit consent is obtained for sensitive health information via the in-person form.</li>
                <li><strong>Contractual Necessity:</strong> Processing your booking details (name, contact, appointment time, tattoo details) is necessary to fulfill our agreement to provide you with consultation and tattoo services.</li>
                <li><strong>Legitimate Interests:</strong> We process data like referral source or optional social media handles to understand our clientele and potentially view artistic style references (only if provided by you). Age verification is processed based on legitimate interest and legal obligation.</li>
                 <li><strong>Legal Obligation:</strong> We process age verification data and maintain records as may be required by local ordinances or DOH guidelines related to tattoo establishments.</li>
                 <li><strong>Vital Interests:</strong> In rare emergency situations occurring at the studio, we may process relevant health information to protect your vital interests or those of another person.</li>
            </ul>
             <p>The purposes for processing your data include:</p>
             <ul>
                <li>Managing your booking request and scheduling appointments.</li>
                <li>Communicating with you regarding your appointment, design consultation, and aftercare.</li>
                <li>Assessing your eligibility and suitability for a tattoo procedure (age, health factors for safety).</li>
                <li>Providing the tattoo service requested.</li>
                <li>Maintaining internal records for business operations and potential future appointments or touch-ups.</li>
                <li>Ensuring compliance with health, safety, and legal regulations.</li>
                <li>Improving our services and website experience [REMOVE IF NOT APPLICABLE].</li>
             </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold">4. Data Storage, Security, and Retention</h2>
            <p>
              We implement reasonable and appropriate organizational, physical, and technical security measures to protect your personal information against unauthorized access, disclosure, alteration, or destruction.
            </p>
            <ul>
                <li>Online data submitted via the form is processed through secure channels [VERIFY AND SPECIFY - e.g., HTTPS].</li>
                <li>Access to personal information is limited to authorized personnel (studio owner, artist involved, booking staff if any) who need the information for legitimate business purposes.</li>
                <li>Physical forms (like the Medical Disclosure and Consent Form) are stored securely [SPECIFY HOW - e.g., in locked cabinets].</li>
                <li>Digital records are stored on secure systems with access controls [SPECIFY IF APPLICABLE - e.g., password-protected computers/cloud storage].</li>
            </ul>
            <p>
              We will retain your personal information only for as long as necessary to fulfill the purposes for which it was collected, including for the duration of our client relationship, providing potential future services (like touch-ups), and complying with legal, accounting, or reporting requirements (e.g., record-keeping mandated by local ordinances or BIR). After this period, your personal information will be securely disposed of (e.g., shredding physical documents, securely deleting electronic files).
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">5. Data Sharing and Disclosure</h2>
            <p>
              We do not sell, trade, or rent your personal information to third parties. Your information may be shared internally with the specific artist assigned to your appointment for the purpose of consultation and service provision.
            </p>
            <p>
              We will only disclose your personal information to external third parties in the following limited circumstances:
            </p>
            <ul>
              <li>With your explicit consent.</li>
              <li>If required by law, regulation, or legal process (e.g., court order, government inquiry).</li>
              <li>To protect the rights, property, or safety of ArjoStyle Tattoo, our artists, clients, or the public, as required or permitted by law.</li>
              <li>[IF USING THIRD-PARTY BOOKING/PAYMENT SYSTEMS: Add a clause about sharing necessary data with those service providers, ensuring they also comply with data privacy.]</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold">6. Your Rights as a Data Subject</h2>
            <p>
              Under the Data Privacy Act of 2012, you have the following rights regarding your personal information:
            </p>
            <ul>
              <li><strong>Right to be Informed:</strong> To know how your data is collected and processed.</li>
              <li><strong>Right to Access:</strong> To request access to the personal information we hold about you.</li>
              <li><strong>Right to Object:</strong> To object to the processing of your personal data in certain cases.</li>
              <li><strong>Right to Rectification:</strong> To correct any inaccurate or incomplete personal data.</li>
              <li><strong>Right to Erasure or Blocking:</strong> To request the suspension, withdrawal, blocking, removal, or destruction of your personal data under certain conditions.</li>
              <li><strong>Right to Damages:</strong> To claim compensation if you suffered damages due to inaccurate, incomplete, outdated, false, unlawfully obtained, or unauthorized use of personal data.</li>
              <li><strong>Right to Data Portability:</strong> To obtain a copy of your data in an electronic format for further use (where processing is electronic).</li>
              <li><strong>Right to Lodge a Complaint:</strong> To file a complaint with the National Privacy Commission (NPC) if you believe your data privacy rights have been violated.</li>
            </ul>
            <p>
              To exercise any of these rights, please contact us using the details provided in Section 8. We will respond to your request in accordance with the DPA.
            </p>
          </section>

           <section>
            <h2 className="text-xl font-semibold">7. Changes to This Privacy Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. Any changes will be posted on this page with an updated "Last Updated" date. We encourage you to review this policy periodically. Your continued use of our services after changes are posted constitutes your acceptance of the revised policy.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">8. Contact Us / Data Protection Officer</h2>
            <p>
              If you have any questions about this Privacy Policy, wish to exercise your data subject rights, or have concerns about your privacy, please contact us:
            </p>
            <ul>
               <li><strong>Email:</strong> [Your Studio Email]</li>
               <li><strong>Phone:</strong> [Your Studio Phone]</li>
               <li><strong>In Person:</strong> [Your Studio Address, Tagbilaran City, Bohol]</li>
               {/* Optional: Add DPO contact if formally designated */}
               {/* <li><strong>Data Protection Officer:</strong> [Name/Role and Contact Details of DPO]</li> */}
            </ul>
          </section>

          <hr/>

           <p className="text-sm text-center text-muted-foreground">
             <strong>Legal Disclaimer:</strong> This Privacy Policy is provided for informational purposes. For specific legal advice regarding data privacy compliance in the Philippines, please consult with a qualified legal professional.
           </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default PrivacyPolicyPage; // Uncomment if using default export
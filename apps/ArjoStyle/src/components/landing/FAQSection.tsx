// src/components/landing/FAQSection.tsx (Full Code with Highlighting)

import React, { useState, useMemo, useRef } from 'react'; // Import React for Fragment/FC
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { RevealOnScroll } from '@/components/ui/RevealOnScroll';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

// --- FAQ Data ---
const faqData = [
    // Existing FAQs (kept)
    {
      question: "Do you accept walk-ins?",
      answer: "We operate strictly by appointment only to ensure each client receives dedicated time and attention from the artist. Please use our online booking form to schedule your consultation and tattoo session.",
    },
    {
      question: "How do I book an appointment?",
      answer: "You can start the process by filling out our online Booking Form. Provide your details, design ideas, placement, and references. We'll contact you to discuss everything and arrange the deposit.",
    },
     {
      question: "Is the consultation separate from the tattoo appointment?",
      answer: "Often, yes. After you submit your booking request, we'll contact you for an initial consultation (via your preferred method) to finalize the design, price, and duration. The actual tattoo session is scheduled separately once the deposit is paid. For smaller, straightforward pieces, consultation might happen right before the session, but this is determined case-by-case.",
    },
     // --- NEW FAQs based on Booking Process ---
    {
        question: "How do I book multiple tattoos or placements?",
        answer: "Our online booking form currently provides an estimate for one tattoo placement at a time. If you're interested in multiple tattoos in one session or different placements, please mention this clearly in the 'Specific Requirements' section of the form. The artist will discuss the feasibility, combined pricing, and potential session planning with you during the consultation."
    },
     {
        question: "Is the price from the 'Tattoo Estimate' step final?",
        answer: "No, the price shown in the 'Tattoo Estimate' step is an initial estimate based on the information you provide (size, placement, complexity, color, cover-up). The final price will be confirmed by the artist during the consultation after discussing your specific design, details, and any adjustments needed."
    },
    {
        question: "What happens after I submit the booking request?",
        answer: "After you submit the form, our team or your preferred artist will review all the details (design, references, notes, schedule request). We will then contact you via your preferred method (e.g., SMS, WhatsApp, Call) to discuss the design, confirm the final details (price, duration, sessions), verify the appointment slot, and arrange the 50% deposit payment to secure your booking."
    },
    {
        question: "Can I change my tattoo idea after submitting the form?",
        answer: "Minor adjustments to the design or placement can usually be discussed during the consultation. However, significant changes might affect the estimated price, duration, and potentially the scheduled appointment slot. It's best to be as clear as possible in your initial request. Please inform us of any major changes as soon as possible."
    },
     {
        question: "What if my tattoo requires multiple sessions?",
        answer: "The 'Tattoo Estimate' provides an indication if multiple sessions are likely needed based on complexity and duration limits per session (usually around 6 hours). The artist will confirm the session plan during the consultation. Typically, you'll book the first session through this process, and subsequent sessions will be scheduled directly with the artist after the first one."
    },
    // --- End NEW FAQs ---
    {
      question: "How much will my tattoo cost?",
      answer: "Pricing depends on size, complexity, placement, and whether it's color or black & grey. Our booking form includes a Tattoo Calculator for an initial estimate. The final price will be confirmed during your consultation after discussing the design details with the artist.",
    },
     {
      question: "Do tattoos hurt?",
      answer: "Yes, there is some level of discomfort involved. Pain levels vary depending on individual tolerance, tattoo placement, and duration. Our calculator provides a general pain estimate for placements. We strive to make the experience as comfortable as possible.",
    },
      {
      question: "What is the minimum age to get tattooed?",
      answer: "You must be 18 years of age or older to get tattooed at our studio, in accordance with Philippine law. Valid photo ID is required at your appointment.",
    },
    {
      question: "Is a deposit required?",
      answer: "Yes, a 50% non-refundable deposit is required to secure your appointment slot. This confirms your booking and goes towards the final cost of your tattoo. We'll provide details on how to pay the deposit after the initial consultation.",
    },
     {
      question: "What payment methods do you accept?",
      answer: "We typically accept GCash or bank transfer for the deposit. The remaining balance is usually due in cash on the day of your appointment. We will confirm accepted payment methods during the booking process.",
    },
    {
      question: "Can I bring my own design?",
      answer: "Yes, you can absolutely bring your own design or reference images! Please upload them using the booking form. We can tattoo your design as is (if suitable for tattooing) or use it as inspiration for a custom piece tailored to you.",
    },
     {
      question: "Do you do cover-up tattoos?",
      answer: "Yes, we do offer cover-up tattoos. Please indicate this on the booking form and provide clear photos of the existing tattoo you wish to cover, along with your ideas for the new design. Cover-ups often require careful planning and may influence the final design possibilities.",
    },
    {
      question: "How long will my tattoo appointment take?",
      answer: "The duration depends on the tattoo's size, detail, and placement. The Tattoo Calculator provides an estimate, and the artist will give you a more accurate timeframe during the consultation. Larger pieces may require multiple sessions.",
    },
    {
      question: "What should I do to prepare for my appointment?",
      answer: "Get a good night's sleep, eat a proper meal beforehand, and stay hydrated. Avoid alcohol or blood-thinning medication 24 hours prior. Wear comfortable clothing that allows easy access to the area being tattooed. Ensure the area is clean and free of sunburn.",
    },
     {
      question: "What is your rescheduling/cancellation policy?",
      answer: "We require at least 48-72 hours notice for rescheduling. Deposits are non-refundable. If you need to reschedule with sufficient notice, we can typically transfer your deposit to a new date once. Cancellations or rescheduling with less notice may result in forfeiture of the deposit. Please refer to the full terms agreed upon during booking.",
    },
     {
      question: "Do you offer touch-ups?",
      answer: "Yes, we typically offer one free touch-up within a certain timeframe (e.g., 2-3 months) after the tattoo has fully healed, provided that aftercare instructions were followed correctly. This covers minor imperfections in healing. Touch-ups needed due to improper aftercare may incur a fee. Discuss this with your artist.",
    },
    {
      question: "What safety and hygiene measures do you follow?",
      answer: "Your safety is our top priority. We use single-use needles, hospital-grade sterilization for all reusable equipment, and maintain a clean and sanitized environment following strict hygiene protocols.",
    },
    {
      question: "What do I need to do for tattoo aftercare?",
      answer: "Proper aftercare is crucial for healing. After your session, we will clean and bandage the tattoo and provide you with detailed written and verbal instructions on how to clean, moisturize, and protect it during the healing process.",
    },
  ];

// --- Number of FAQs to show initially ---
const INITIAL_FAQ_COUNT = 5;

// --- Helper Function to Escape RegExp Characters ---
function escapeRegExp(string: string): string {
  // $& means the whole matched string
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// --- Helper Component for Highlighting ---
const HighlightMatches: React.FC<{ text: string; highlight: string }> = ({ text, highlight }) => {
  if (!highlight.trim()) {
    return <>{text}</>; // No highlight term, return plain text
  }

  const escapedHighlight = escapeRegExp(highlight.trim());
  const regex = new RegExp(`(${escapedHighlight})`, 'gi'); // Capture the match
  const parts = text.split(regex); // Split, keeping the captured matches

  return (
    <>
      {parts.filter(part => part).map((part, index) => // Filter out potential empty strings from split
        regex.test(part) && part.toLowerCase() === highlight.toLowerCase() ? ( // Check if it's a match (case-insensitive)
          <strong key={index} className="font-bold bg-yellow-200 dark:bg-yellow-700 px-0.5 text-white rounded-sm">
            {part}
          </strong>
        ) : (
          <React.Fragment key={index}>{part}</React.Fragment> // Render non-matches as plain text
        )
      )}
    </>
  );
};


// --- Main FAQ Section Component ---
export function FAQSection() {
  const [searchTerm, setSearchTerm] = useState('');
  const [showAll, setShowAll] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null); // Ref for scrolling target

  // Memoize the filtering logic for performance
  const filteredFaqs = useMemo(() => {
    const faqsToFilter = showAll ? faqData : faqData.slice(0, INITIAL_FAQ_COUNT); // Decide base list
    if (!searchTerm.trim()) {
      return faqsToFilter; // No search term, return the current display set
    }
    const lowerCaseSearchTerm = searchTerm.toLowerCase();
    return faqsToFilter.filter(
      (faq) =>
        faq.question.toLowerCase().includes(lowerCaseSearchTerm) ||
        faq.answer.toLowerCase().includes(lowerCaseSearchTerm)
    );
  }, [searchTerm, showAll]); // Recalculate only when searchTerm or showAll changes

  const handleShowLess = () => {
    setShowAll(false);
    // Scroll back to the search bar area smoothly
    scrollRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }); // Adjusted scroll options
  };

  return (
    <section
      id="faq"
      className="py-20 md:py-24 bg-white dark:bg-gray-950 transition-colors duration-300"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <RevealOnScroll>
          <h2 className="text-3xl md:text-4xl font-semibold text-center mb-4 text-gray-900 dark:text-white">
            Frequently Asked Questions
          </h2>
        </RevealOnScroll>
        <RevealOnScroll delay={100}>
          <p className="text-gray-600 dark:text-gray-400 text-lg text-center max-w-3xl mx-auto mb-10">
            Have questions about getting inked? Find answers below or search for keywords.
          </p>
        </RevealOnScroll>

        {/* Search Bar Container (Assign ref here) */}
        <RevealOnScroll delay={150}>
          <div ref={scrollRef} className="max-w-3xl mx-auto mb-8"> {/* Added ref */}
            <Input
              type="text"
              placeholder="Search for a question or answer..." // Updated placeholder
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </RevealOnScroll>

        {/* Accordion Container */}
        <div className="max-w-3xl mx-auto">
          <Accordion type="single" collapsible className="w-full">
            {filteredFaqs.map((faq, index) => (
              <RevealOnScroll key={`faq-${index}`} delay={100}>
                <AccordionItem
                  value={`item-${index}`}
                  className="border-b border-gray-200 dark:border-gray-700"
                >
                  <AccordionTrigger className="text-left hover:no-underline py-4 text-base md:text-lg font-medium text-gray-800 dark:text-gray-100">
                    {/* Use HighlightMatches for the question */}
                    <span>{faq.question}</span>
                  </AccordionTrigger>
                  <AccordionContent className="text-gray-600 dark:text-gray-400 text-sm md:text-base leading-relaxed pt-1 pb-4">
                    {/* Use HighlightMatches for the answer */}
                    <div> {/* Added div wrapper for potential block layout needs */}
                       <HighlightMatches text={faq.answer} highlight={searchTerm} />
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </RevealOnScroll>
            ))}
          </Accordion>

          {/* No Results Message */}
          {filteredFaqs.length === 0 && searchTerm.trim() && ( // Check trimmed search term
            <RevealOnScroll delay={200}>
               <p className="text-center text-gray-500 dark:text-gray-400 mt-6">
                 No questions found matching your search term "{searchTerm}".
               </p>
            </RevealOnScroll>
           )}
        </div>

        {/* Conditional Buttons Container */}
        <div className="text-center mt-10">
          {/* "See All FAQs" Button */}
          {/* Show button only if not all are shown AND there are more FAQs than initially displayed */}
          {!showAll && faqData.length > INITIAL_FAQ_COUNT && (
            <RevealOnScroll delay={filteredFaqs.length * 50 + 50}>
              <Button
                onClick={() => setShowAll(true)}
                variant="outline"
                size="lg"
              >
                See All FAQs ({faqData.length})
              </Button>
            </RevealOnScroll>
          )}

          {/* "Show Less FAQs" Button */}
          {/* Show button only if all are shown AND there are more FAQs than initially displayed */}
          {showAll && faqData.length > INITIAL_FAQ_COUNT && (
            <Button
              onClick={handleShowLess}
              variant="outline"
              size="lg"
            >
              Show Less FAQs
            </Button>
          )}
        </div>
      </div>
    </section>
  );
}
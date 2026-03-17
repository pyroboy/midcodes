// src/pages/AftercarePage.tsx (Improved Readability & Design)

import React from 'react'; // Removed unused useState
import { Header } from "@/components/layout/Header"; // Adjust path if needed
import { Footer } from "@/components/layout/Footer"; // Adjust path if needed
// Import relevant icons (remove unused ones if any)
import { Hand, Droplets, Sun, CircleAlert, CheckCircle, Info, ShieldOff, Ban, Waves, Bug } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'; // Import Card components for "Don'ts" section
import { cn } from '@/lib/utils'; // Assuming cn utility exists

export function AftercarePage() {
  // Get current date for "Last Updated"
  const lastUpdatedDate = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
  });

  // Removed unused booking modal state and handler
  // const [bookingModalOpen, setBookingModalOpen] = useState(false);
  // const handleOpenBookingModal = () => { setBookingModalOpen(true); };

  const iconSize = "h-8 w-8"; // Increased icon size
  const sectionSpacing = "py-6 md:py-8"; // Added vertical padding to sections
  const listSpacing = "space-y-3"; // Increased list item spacing
  const headingStyle = "text-2xl font-semibold flex items-center gap-3 mb-4 text-gray-900 dark:text-gray-100"; // Common heading style
  const paragraphStyle = "text-base leading-relaxed mb-4"; // Base paragraph style


  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-gray-950"> {/* Added base background */}
      {/* Pass the prop if Header expects it, otherwise remove. Assuming Header doesn't need it now. */}
      <Header onOpenBookingModal={()=>{/* Placeholder or remove prop */}} />
      <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-center mb-10 md:mb-12 text-gray-900 dark:text-gray-100">
          Tattoo Aftercare Instructions
        </h1>
        {/* Removed prose class, using direct Tailwind classes */}
        <div className="max-w-3xl mx-auto space-y-8 text-gray-700 dark:text-gray-300">

          <p className={`text-center text-lg italic text-muted-foreground ${paragraphStyle} !mb-10`}>
            Proper aftercare is crucial for healing your new tattoo beautifully and preventing complications. Please follow these guidelines carefully, along with any specific instructions provided by your artist.
          </p>

          <section className={sectionSpacing}>
            <h2 className={headingStyle}><span className="text-primary font-bold text-3xl">1.</span> The Initial Bandage</h2>
            <p className={paragraphStyle}> Your artist applied a sterile bandage to protect your fresh tattoo. Keep this bandage on for the duration they recommended. This can range from: </p>
            <ul className={listSpacing}>
              <li><strong>Standard Bandage (Gauze/Wrap):</strong> Typically remove after <strong>2-4 hours</strong>, or as advised by your artist. Do not re-bandage unless specifically told to.</li>
              <li><strong>Adhesive Bandage (e.g., Saniderm, Tegaderm, "Second Skin"):</strong> These can often be left on for <strong>3-5 days</strong>, depending on the brand and your artist's instructions. They are breathable and waterproof (for showering). Fluid buildup underneath (plasma, ink) is normal initially. Remove immediately if the seal breaks, excessive fluid builds up, or you notice significant redness/irritation around the edges.</li>
            </ul>
            <p className={`${paragraphStyle} mt-4`}> <strong>Always wash your hands thoroughly with soap and water before touching your tattoo or removing the bandage.</strong> </p>
          </section>

          <Separator />

          <section className={sectionSpacing}>
            <h2 className={headingStyle}><Hand className={`${iconSize} text-primary`} /> <span className="text-primary font-bold text-3xl">2.</span> Washing Your Tattoo</h2>
            <ul className={listSpacing}>
              <li>Once the bandage is off, gently wash the tattoo with lukewarm water and a mild, fragrance-free liquid soap (like baby soap or a specific tattoo cleanser recommended by your artist).</li>
              <li>Use only your clean fingertips – do not use a washcloth, loofah, or sponge on the healing tattoo.</li>
              <li>Lather the soap gently over the tattoo to remove any dried blood, plasma, or excess ink. Do not scrub.</li>
              <li>Rinse thoroughly with lukewarm water until the skin feels clean and smooth (no slippery residue).</li>
              <li>Gently pat the area dry with a clean, disposable paper towel. **Do not rub.** Air dry for a few minutes before applying aftercare product.</li>
              <li>Wash your tattoo this way 2-3 times per day during the initial healing phase (typically the first 1-2 weeks).</li>
            </ul>
          </section>

           <Separator />

          <section className={sectionSpacing}>
            <h2 className={headingStyle}><Droplets className={`${iconSize} text-primary`} /> <span className="text-primary font-bold text-3xl">3.</span> Moisturizing</h2>
            <ul className={listSpacing}>
              <li>After washing and thoroughly drying, apply a **very thin layer** of a recommended aftercare product. Your artist may recommend a specific ointment for the first few days (like Aquaphor or tattoo-specific balms – **avoid pure petroleum jelly like Vaseline**), then switching to a gentle, fragrance-free, hypoallergenic lotion (like Lubriderm, Cetaphil, Eucerin, or coconut oil for some).</li>
              <li>Gently rub the product in completely. There should be no thick or greasy layer left on the surface – the tattoo needs to breathe.</li>
              <li>Apply 2-3 times daily, or whenever the tattoo feels dry or tight. Do not over-moisturize.</li>
            </ul>
          </section>

           <Separator />

          <section className={sectionSpacing}>
            <h2 className={headingStyle}><CheckCircle className={`${iconSize} text-primary`} /> <span className="text-primary font-bold text-3xl">4.</span> The Healing Process & Special Considerations</h2>
            <p className={paragraphStyle}>Healing typically involves these stages:</p>
            <ul className={listSpacing}>
              <li><strong>Week 1:</strong> Redness, swelling, soreness, minor oozing (plasma/ink).</li>
              <li><strong>Week 1-2:</strong> Itching and flaking begin. Skin might look cloudy.</li>
              <li><strong>Week 2-4+:</strong> Peeling/scabbing occurs. Let these fall off naturally. Surface appears healed after 2-4 weeks, but deeper layers take longer (3-6 months).</li>
            </ul>
             <p className={`${paragraphStyle} mt-6 font-medium`}><strong>Important Notes:</strong></p>
            <ul className={listSpacing}>
               <li><strong>DO NOT Pick or Scratch:</strong> Resisting the urge to pick scabs or scratch itchy skin is vital to prevent ink loss and scarring. Moisturizing helps.</li>
               <li><strong>Color vs. Linework:</strong> While basic aftercare is similar, heavily saturated color tattoos might experience slightly more swelling or take longer for the color to fully "settle" into the skin compared to fine linework. Allergic reactions, though rare, are slightly more common with certain color pigments (especially reds). Be vigilant for excessive, persistent redness or unusual texture changes specifically in colored areas.</li>
            </ul>
          </section>

           <Separator />

          {/* --- Use Card for "Don'ts" section for emphasis --- */}
          <section className={sectionSpacing}>
             <Card className="border-destructive/50 bg-destructive/5 dark:bg-destructive/10 p-6">
                <CardHeader className="p-0 mb-4">
                     <CardTitle className="text-2xl font-semibold flex items-center gap-3 text-destructive dark:text-red-400">
                         <Ban className="h-8 w-8" /> {/* Larger Icon */}
                         <span>5. Crucial Healing Don'ts (Avoid These!)</span>
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <p className={`${paragraphStyle} text-destructive dark:text-red-300`}>
                        To ensure proper healing and avoid complications, <strong className="font-bold">NEVER</strong> do the following while your tattoo is healing (typically first 2-4 weeks, follow artist's specific timeline):
                    </p>
                    <ul className={`${listSpacing} list-none pl-0 space-y-4`}> {/* Use list-none and custom spacing */}
                        <li className="flex items-start gap-3"><Waves className="h-5 w-5 text-destructive flex-shrink-0 mt-1"/><div><strong className="text-destructive font-semibold">NEVER Soak Your Healing Tattoo:</strong> No swimming pools, hot tubs, baths, ocean, lakes, rivers, etc. These environments contain bacteria and chemicals harmful to healing skin. Quick showers are okay.</div></li>
                        <li className="flex items-start gap-3"><Sun className="h-5 w-5 text-destructive flex-shrink-0 mt-1"/><div><strong className="text-destructive font-semibold">NEVER Expose to Direct Sunlight or Tanning Beds:</strong> UV rays damage healing skin and drastically fade tattoo ink. Keep covered with clothing.</div></li>
                        <li className="flex items-start gap-3"><Hand className="h-5 w-5 text-destructive flex-shrink-0 mt-1"/><div><strong className="text-destructive font-semibold">NEVER Pick, Scratch, or Peel Scabs/Flakes:</strong> This WILL pull out ink and can lead to scarring and infection. Let them fall off naturally.</div></li>
                        <li className="flex items-start gap-3"><Bug className="h-5 w-5 text-destructive flex-shrink-0 mt-1"/><div><strong className="text-destructive font-semibold">NEVER Expose to Dirt or Bacteria:</strong> Avoid activities that could introduce contaminants (gardening without cover, pet licking, unclean surfaces like gyms, etc.). Keep it clean!</div></li>
                        <li className="flex items-start gap-3"><ShieldOff className="h-5 w-5 text-destructive flex-shrink-0 mt-1"/><div><strong className="text-destructive font-semibold">NEVER Wear Tight or Abrasive Clothing:</strong> Clothing that rubs or sticks can irritate and pull off scabs. Wear loose, clean, soft fabrics.</div></li>
                        <li className="flex items-start gap-3"><ShieldOff className="h-5 w-5 text-destructive flex-shrink-0 mt-1"/><div><strong className="text-destructive font-semibold">NEVER Apply Sunscreen Until Fully Healed:</strong> Chemicals can irritate healing skin. Use clothing for sun protection.</div></li>
                         {/* Add more points if needed */}
                    </ul>
                    <p className={`${paragraphStyle} mt-6 text-destructive dark:text-red-300`}>Also, try to avoid excessive sweating in the area and strenuous activities that heavily stretch or rub the tattooed skin during the initial week or two.</p>
                </CardContent>
            </Card>
          </section>

           <Separator />

          <section className={sectionSpacing}>
            <h2 className={headingStyle}><CircleAlert className={`${iconSize} text-destructive`} /> <span className="text-primary font-bold text-3xl">6.</span> When to Seek Medical Advice</h2>
            <p className={paragraphStyle}>While minor redness, swelling, and itching are normal initially, contact a doctor immediately if you experience signs of infection or significant allergic reaction, such as:</p>
             <ul className={listSpacing}>
                <li>Worsening or spreading redness, swelling, or pain after the first few days.</li>
                <li>Red streaks moving away from the tattoo.</li>
                <li>Thick yellow or green pus, or foul odor from the tattoo.</li>
                <li>Fever or chills.</li>
                <li>Excessive, bubbly, or very thick scabbing, or spreading rash/hives on or around the tattoo.</li>
             </ul>
             <p className={`${paragraphStyle} mt-4`}>If you suspect a problem, please also notify the studio so we are aware.</p>
          </section>

            <Separator />

           <section className={sectionSpacing}>
            <h2 className={headingStyle}><Sun className={`${iconSize} text-primary`} /> <span className="text-primary font-bold text-3xl">7.</span> Long-Term Care</h2>
             <ul className={listSpacing}>
                <li>Once fully healed, keep your tattoo moisturized to keep the skin healthy.</li>
                <li>**Always apply a high-SPF (30+) broad-spectrum sunscreen** to your tattoo whenever it will be exposed to the sun. Sun exposure is the primary cause of tattoo fading over time.</li>
             </ul>
          </section>

          <hr className="my-8 border-gray-300 dark:border-gray-700"/>

           <p className={`text-sm text-center text-muted-foreground ${paragraphStyle} !mb-0`}> {/* Remove bottom margin */}
             <strong>Disclaimer:</strong> These are general aftercare guidelines. Your artist provided instructions specific to your tattoo and skin – please prioritize their advice. If you have any concerns during healing, contact the studio promptly. If you suspect an infection or allergic reaction, seek medical attention immediately. This information does not constitute medical advice.
           </p>
           <p className="text-xs text-center text-muted-foreground pt-2">
            Last Updated: {lastUpdatedDate}
           </p>

        </div>
      </main>
      <Footer />
    </div>
  );
}

// --- Separator Component --- (Add this if you don't have it globally)
const Separator = ({ className }: { className?: string }) => (
    <hr className={cn("my-6 border-gray-200 dark:border-gray-700", className)} />
);


export default AftercarePage; // Uncomment if using default export
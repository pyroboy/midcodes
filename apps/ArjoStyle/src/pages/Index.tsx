import React, { useState } from 'react'; // Import useState
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Hero } from "@/components/landing/Hero";
import { Portfolio } from "@/components/landing/Portfolio";
import { StudioInfo } from "@/components/landing/StudioInfo";
import { BookingCTA } from "@/components/landing/BookingCTA"; // Assuming this also needs the modal trigger?
import { TattooProcess } from "@/components/landing/TattooProcess";
import { FAQSection } from "@/components/landing/FAQSection";
import { BookingModal } from '@/components/booking/BookingModal'; // Import the modal

const Index = () => {
  // --- State for the Booking Modal (Lifted Up) ---
  const [bookingModalOpen, setBookingModalOpen] = useState(false);

  // --- Function to open the modal (passed down) ---
  const handleOpenBookingModal = () => {
    setBookingModalOpen(true);
  };

  const handleBookingModalClose = () => {
    setBookingModalOpen(false);
  };

  return (
    // Use Fragment to render Modal alongside main div
    <>
      <div className="min-h-screen flex flex-col">
        {/* Pass the handler function to Header */}
        <Header onOpenBookingModal={handleOpenBookingModal} />

        <main className="flex-grow">
          {/* Pass the handler function to Hero */}
          <Hero onOpenBookingModal={handleOpenBookingModal} />
          <Portfolio onOpenBookingModal={handleOpenBookingModal}  />
          <TattooProcess />
          <FAQSection />
          <StudioInfo />
          {/* Pass the handler function to BookingCTA if it also has a button */}
          <BookingCTA onOpenBookingModal={handleOpenBookingModal} />
        </main>

        <Footer />
      </div>

      {/* --- Render the SINGLE BookingModal instance here --- */}
      <BookingModal
        open={bookingModalOpen}
        onOpenChange={handleBookingModalClose}
      />
    </>
  );
};

export default Index;
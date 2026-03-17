
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { RevealOnScroll } from '@/components/ui/RevealOnScroll';


interface BookingCTAProps {
  onOpenBookingModal: () => void; // Function passed from parent to open the modal
}
export function BookingCTA({ onOpenBookingModal }: BookingCTAProps) {

  return (
    <section className="bg-primary/5 py-20">
      <RevealOnScroll>
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to Get Inked?</h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            Book your consultation now and take the first step towards your perfect tattoo.
            Our artists are ready to bring your vision to life.
          </p>
          <Button 
            size="lg" 
            onClick={onOpenBookingModal}
            className="px-8"
          >
            Book Your Appointment
          </Button>
        </div>
      </RevealOnScroll>
      
   
    </section>
  );
}

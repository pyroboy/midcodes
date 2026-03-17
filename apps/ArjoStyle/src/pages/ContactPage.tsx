// src/pages/ContactPage.tsx (Example path)

import React, { useState, FormEvent } from 'react';
import { Header } from "@/components/layout/Header"; // Adjust path if needed
import { Footer } from "@/components/layout/Footer"; // Adjust path if needed
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { MapPin, Phone, Mail, Instagram, Facebook, Twitter, Send } from 'lucide-react'; // Import icons

export function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'success' | 'error' | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const [bookingModalOpen, setBookingModalOpen] = useState(false);

  const handleOpenBookingModal = () => {
    setBookingModalOpen(true);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus(null);
    console.log("Contact Form Data:", formData); // Log data for now

    // --- Placeholder for actual form submission logic (e.g., API call) ---
    try {
      // Simulate network request
      await new Promise(resolve => setTimeout(resolve, 1500));
      // Example: const response = await fetch('/api/contact', { method: 'POST', ... });
      // if (!response.ok) throw new Error('Submission failed');

      setSubmitStatus('success');
      setFormData({ name: '', email: '', subject: '', message: '' }); // Clear form on success
    } catch (error) {
      console.error("Contact form submission error:", error);
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
    // --- End Placeholder ---
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-background">
      <Header onOpenBookingModal={handleOpenBookingModal} />
      <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12 md:mb-16">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight mb-4">
              Get In Touch
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Have questions or need assistance? We're here to help. Reach out via the form below or use our contact details. For booking requests, please use our dedicated booking form.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
            {/* Contact Information */}
            <div className="space-y-6">
              <h2 className="text-2xl font-semibold">Contact Information</h2>
              <div className="space-y-4 text-base text-gray-700 dark:text-gray-300">
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                  <div>
                    <strong className="block">ArjoStyle Tattoo</strong>
                    <address className="not-italic">
                      {/* --- REPLACE with your actual address --- */}
                      043 Maria Clara St., 2nd Floor, D.A. Tirol Bldg,<br />
                      Tagbilaran City, 6300<br />
                      Bohol, Philippines
                    </address>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="h-5 w-5 text-primary flex-shrink-0" />
                   {/* --- REPLACE with your actual phone --- */}
                  <a href="tel:[Your Studio Phone]" className="hover:text-primary">[Your Studio Phone]</a>
                </div>
                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-primary flex-shrink-0" />
                   {/* --- REPLACE with your actual email --- */}
                  <a href="mailto:[Your Studio Email]" className="hover:text-primary">[Your Studio Email]</a>
                </div>
              </div>

              {/* Social Media Links */}
              <div className="pt-4">
                <h3 className="text-lg font-medium mb-3">Follow Us</h3>
                <div className="flex items-center space-x-4">
                   {/* --- REPLACE with your actual social links --- */}
                  <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" title="Instagram" className="text-muted-foreground hover:text-primary transition-colors"> <Instagram className="w-6 h-6" /> </a>
                  <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" title="Facebook" className="text-muted-foreground hover:text-primary transition-colors"> <Facebook className="w-6 h-6" /> </a>
                  <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" title="Twitter" className="text-muted-foreground hover:text-primary transition-colors"> <Twitter className="w-6 h-6" /> </a>
                </div>
              </div>

              {/* Map Placeholder/Link */}
              <div className="pt-4">
                 <h3 className="text-lg font-medium mb-3">Find Us</h3>
                 {/* Option 1: Simple Link */}
                 <a href="[Your Google Maps Link]" target="_blank" rel="noopener noreferrer" className="inline-flex items-center text-primary hover:underline">
                    View on Google Maps <MapPin className="w-4 h-4 ml-1.5" />
                 </a>
                 {/* Option 2: Placeholder for embedded map */}
                 {/* <div className="aspect-video bg-gray-200 dark:bg-gray-700 rounded-md flex items-center justify-center text-muted-foreground"> (Map Placeholder) </div> */}
              </div>
            </div>

            {/* Contact Form Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">Send Us a Message</CardTitle>
                <CardDescription>For general inquiries only. Please use the booking form for appointments.</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="name">Name</Label>
                      <Input id="name" name="name" value={formData.name} onChange={handleChange} placeholder="Your Name" required />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="email">Email</Label>
                      <Input id="email" name="email" type="email" value={formData.email} onChange={handleChange} placeholder="your@email.com" required />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="subject">Subject</Label>
                    <Input id="subject" name="subject" value={formData.subject} onChange={handleChange} placeholder="Inquiry about..." required />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="message">Message</Label>
                    <Textarea id="message" name="message" value={formData.message} onChange={handleChange} placeholder="Your message..." required rows={5} />
                  </div>
                  <div className="pt-2">
                    <Button type="submit" className="w-full" disabled={isSubmitting}>
                       {isSubmitting ? 'Sending...' : 'Send Message'}
                       {!isSubmitting && <Send className='ml-2 h-4 w-4'/>}
                    </Button>
                  </div>
                  {submitStatus === 'success' && <p className="text-sm text-green-600 dark:text-green-400 mt-2 text-center">Message sent successfully!</p>}
                  {submitStatus === 'error' && <p className="text-sm text-destructive mt-2 text-center">Failed to send message. Please try again later.</p>}
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default ContactPage; // Uncomment if using default export
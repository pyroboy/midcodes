import { error, fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { BookingFormSchema } from './BookingSchema';
import { z } from 'zod';

export const load: PageServerLoad = async ({ locals: { supabase, safeGetSession } }) => {
  const session = await safeGetSession();
  
  // Fetch all bookings (for admin view in the future)
  const { data: bookings, error: bookingsError } = await supabase
    .from('bookings')
    .select('*')
    .order('created_at', { ascending: false });
    
  if (bookingsError) {
    console.error('Error fetching bookings:', bookingsError);
    throw error(500, 'Failed to load bookings');
  }
  
  // Fetch all rooms for reference
  const { data: rooms, error: roomsError } = await supabase
    .from('rooms')
    .select('*');
    
  if (roomsError) {
    console.error('Error fetching rooms:', roomsError);
    throw error(500, 'Failed to load rooms');
  }
  
  return {
    bookings,
    rooms
  };
};

export const actions: Actions = {
  createBooking: async ({ request, locals: { supabase, safeGetSession } }) => {
    const session = await safeGetSession();
    const formData = Object.fromEntries(await request.formData());
    
    try {
      // Parse and validate form data
      const bookingData = BookingFormSchema.parse({
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        checkIn: formData.checkIn,
        checkOut: formData.checkOut,
        adults: parseInt(formData.adults as string),
        children: parseInt(formData.children as string),
        roomId: parseInt(formData.roomId as string),
        specialRequests: formData.specialRequests || ''
      });
      
      // Calculate total price
      const checkIn = new Date(bookingData.checkIn);
      const checkOut = new Date(bookingData.checkOut);
      const nights = Math.max(1, Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24)));
      
      // Get room price
      const { data: room, error: roomError } = await supabase
        .from('rooms')
        .select('price')
        .eq('id', bookingData.roomId)
        .single();
        
      if (roomError) {
        console.error('Error fetching room:', roomError);
        return fail(500, { message: 'Failed to get room information' });
      }
      
      const totalPrice = room.price * nights;
      
      // Insert booking into database
      const { data, error: insertError } = await supabase
        .from('bookings')
        .insert([
          {
            first_name: bookingData.firstName,
            last_name: bookingData.lastName,
            email: bookingData.email,
            phone: bookingData.phone,
            check_in: bookingData.checkIn,
            check_out: bookingData.checkOut,
            adults: bookingData.adults,
            children: bookingData.children,
            room_id: bookingData.roomId,
            special_requests: bookingData.specialRequests,
            status: 'pending',
            total_price: totalPrice
          }
        ])
        .select();
        
      if (insertError) {
        console.error('Error creating booking:', insertError);
        return fail(500, { message: 'Failed to create booking' });
      }
      
      return {
        success: true,
        booking: data[0]
      };
      
    } catch (err) {
      console.error('Validation error:', err);
      if (err instanceof z.ZodError) {
        const errors = err.errors.reduce((acc, curr) => {
          const key = curr.path[0];
          acc[key] = curr.message;
          return acc;
        }, {} as Record<string, string>);
        
        return fail(400, { errors });
      }
      
      return fail(500, { message: 'An unexpected error occurred' });
    }
  },
  
  updateBooking: async ({ request, locals: { supabase } }) => {
    const formData = Object.fromEntries(await request.formData());
    const bookingId = formData.id as string;
    
    if (!bookingId) {
      return fail(400, { message: 'Booking ID is required' });
    }
    
    try {
      // Parse and validate form data
      const bookingData = BookingFormSchema.parse({
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        checkIn: formData.checkIn,
        checkOut: formData.checkOut,
        adults: parseInt(formData.adults as string),
        children: parseInt(formData.children as string),
        roomId: parseInt(formData.roomId as string),
        specialRequests: formData.specialRequests || ''
      });
      
      // Calculate total price
      const checkIn = new Date(bookingData.checkIn);
      const checkOut = new Date(bookingData.checkOut);
      const nights = Math.max(1, Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24)));
      
      // Get room price
      const { data: room, error: roomError } = await supabase
        .from('rooms')
        .select('price')
        .eq('id', bookingData.roomId)
        .single();
        
      if (roomError) {
        console.error('Error fetching room:', roomError);
        return fail(500, { message: 'Failed to get room information' });
      }
      
      const totalPrice = room.price * nights;
      
      // Update booking in database
      const { data, error: updateError } = await supabase
        .from('bookings')
        .update({
          first_name: bookingData.firstName,
          last_name: bookingData.lastName,
          email: bookingData.email,
          phone: bookingData.phone,
          check_in: bookingData.checkIn,
          check_out: bookingData.checkOut,
          adults: bookingData.adults,
          children: bookingData.children,
          room_id: bookingData.roomId,
          special_requests: bookingData.specialRequests,
          total_price: totalPrice
        })
        .eq('id', bookingId)
        .select();
        
      if (updateError) {
        console.error('Error updating booking:', updateError);
        return fail(500, { message: 'Failed to update booking' });
      }
      
      return {
        success: true,
        booking: data[0]
      };
      
    } catch (err) {
      console.error('Validation error:', err);
      if (err instanceof z.ZodError) {
        const errors = err.errors.reduce((acc, curr) => {
          const key = curr.path[0];
          acc[key] = curr.message;
          return acc;
        }, {} as Record<string, string>);
        
        return fail(400, { errors });
      }
      
      return fail(500, { message: 'An unexpected error occurred' });
    }
  },
  
  deleteBooking: async ({ request, locals: { supabase } }) => {
    const formData = Object.fromEntries(await request.formData());
    const bookingId = formData.id as string;
    
    if (!bookingId) {
      return fail(400, { message: 'Booking ID is required' });
    }
    
    const { error: deleteError } = await supabase
      .from('bookings')
      .delete()
      .eq('id', bookingId);
      
    if (deleteError) {
      console.error('Error deleting booking:', deleteError);
      return fail(500, { message: 'Failed to delete booking' });
    }
    
    return {
      success: true
    };
  }
};

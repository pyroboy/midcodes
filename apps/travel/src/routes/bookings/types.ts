export interface Room {
  id: number;
  name: string;
  description: string;
  beds: string;
  capacity: string;
  features: string[];
  size: string;
  image: string;
  price: number;
}

export interface BookingForm {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  checkIn: string;
  checkOut: string;
  adults: number;
  children: number;
  roomId: number;
  specialRequests: string;
}

export interface Booking extends BookingForm {
  id: string;
  createdAt: string;
  status: 'pending' | 'confirmed' | 'cancelled';
  totalPrice: number;
}

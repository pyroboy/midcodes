export type UserRole = 'player' | 'venue_manager' | 'admin';
export type SkillLevel = 'beginner' | 'intermediate' | 'advanced' | 'competitive';
export type CourtType = 'glass' | 'concrete' | 'acrylic' | 'clay';
export type SurfaceType = 'indoor' | 'outdoor' | 'hybrid';
export type CourtStatus = 'indoor' | 'outdoor';
export type SlotStatus = 'available' | 'booked' | 'blocked';
export type BookingStatus = 'confirmed' | 'cancelled' | 'completed' | 'no_show';
export type BookedVia = 'direct' | 'snipe';
export type SnipeStatus = 'active' | 'watching' | 'booked' | 'expired' | 'cancelled';
export type PaymentMethod = 'card' | 'gcash' | 'bank_transfer';
export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded';
export type PayoutStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface User {
	id: string;
	email: string;
	phone?: string;
	name: string;
	role: UserRole;
	avatarUrl?: string;
	homeLat?: number;
	homeLng?: number;
	skillLevel: SkillLevel;
	duprRating?: number;
	createdAt: Date;
	updatedAt: Date;
}

export interface Venue {
	id: string;
	ownerId: string;
	name: string;
	address: string;
	lat: number;
	lng: number;
	description?: string;
	courtCount: number;
	courtType: CourtType;
	surfaceType: SurfaceType;
	amenities: string[];
	pricingOffPeak?: number;
	pricingPeak?: number;
	operatingHours?: Record<string, unknown>;
	cancellationPolicy?: string;
	photos: string[];
	isVerified: boolean;
	isActive: boolean;
	ratingAvg?: number;
	reviewCount: number;
	paymongoAccountId?: string;
	createdAt: Date;
	updatedAt: Date;
}

export interface Court {
	id: string;
	venueId: string;
	name: string;
	type: CourtStatus;
	status: 'active' | 'maintenance';
	createdAt: Date;
}

export interface Slot {
	id: string;
	courtId: string;
	date: Date;
	startTime: string;
	endTime: string;
	pricePhp?: number;
	status: SlotStatus;
	bookingId?: string;
	createdAt: Date;
}

export interface Booking {
	id: string;
	playerId: string;
	slotId: string;
	venueId: string;
	status: BookingStatus;
	paymentId?: string;
	totalPhp?: number;
	bookedVia: BookedVia;
	createdAt: Date;
	cancelledAt?: Date;
}

export interface SnipeCriteria {
	venues?: string[];
	courtTypes?: CourtType[];
	maxPrice?: number;
	maxDistance?: number;
	preferredTimes?: string[];
	daysOfWeek?: number[];
}

export interface Snipe {
	id: string;
	playerId: string;
	criteria: SnipeCriteria;
	status: SnipeStatus;
	matchedBookingId?: string;
	autoPay: boolean;
	createdAt: Date;
	expiresAt: Date;
}

export interface Payment {
	id: string;
	bookingId: string;
	playerId: string;
	amountPhp: number;
	commissionPhp?: number;
	netVenuePhp?: number;
	paymentMethod?: PaymentMethod;
	paymongoPaymentId?: string;
	status: PaymentStatus;
	paidAt?: Date;
	createdAt: Date;
}

export interface Review {
	id: string;
	playerId: string;
	venueId: string;
	bookingId: string;
	rating: number;
	text?: string;
	venueResponse?: string;
	createdAt: Date;
	updatedAt: Date;
}

export interface Payout {
	id: string;
	venueId: string;
	amountPhp: number;
	periodStart: Date;
	periodEnd: Date;
	status: PayoutStatus;
	paymongoPayoutId?: string;
	completedAt?: Date;
	createdAt: Date;
}

export interface MapMarker {
	id: string;
	name: string;
	lat: number;
	lng: number;
	rating?: number;
	distance?: number;
	priceRange?: [number, number];
}

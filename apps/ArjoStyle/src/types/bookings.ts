// src/types/bookings.ts

// booking.types.ts

// Updated BookingFormData interface
export interface BookingFormData {
  dateOfBirth: Date | string | null; // Allow string from PersonalInfoStep
  name: string | null;
  email: string | null;
  phone: string | null;
  contactMethod?: string;
  referralSource?: string;
  size: number | null;
  isColor: boolean;
  complexity?: number;
  selectedCategory: string | null;
  placementIndex: number;
  currentPlacement?: string | null;
  isCoverUp: boolean;
  pricing: {
    // Assume pricing is always present after calculation or initialization
    basePriceRaw: number;
    complexityPrice: number;
    placementPrice: number;
    colorPrice: number;
    coverUpPrice: number;
    total: number;
  };
  estimatedDurationMinutes?: number;
  estimatedSessions?: number;
  referenceImages: File[];
  creativeFreedom: number;
  specificRequirements: string | null;
  mustHaveElements: string | null;
  colorPreferences: string | null;
  placementNotes: string | null;
  appointmentDate: Date | null;
  appointmentTime: string | null;
  urgencyLevel?: string;
  artistPreference?: string;
  termsAgreed?: boolean;
  medicalConfirmed?: boolean;
  ageConfirmed?: boolean;
  instagramHandle?: string | null;
  facebookProfile?: string | null;
  preferredContactMethod?: string;
  primaryTattooStyle?: string | null;
  styleDescription?: string | null;
  placementSliderTouched: boolean;
  sizeSliderTouched: boolean;
  painLevel?: number;
  painReason?: string;
  visualComplexityScore?: number;
  carouselTouched?: boolean;
}

export interface BookingData {
  id: string;
  created_at: string;
  status:
    | "Available"
    | "Pending"
    | "Confirmed"
    | "Rejected"
    | "Completed"
    | "Needs Info"
    | "Conflict";
  dob: string | null;
  name: string;
  email: string;
  phone: string;
  tattoo_size: number;
  is_color: boolean;
  complexity?: number;
  category?: string;
  placement?: string;
  is_cover_up: boolean;
  pricing_details?: { total: number };
  estimated_duration?: number;
  estimated_sessions?: number;
  reference_image_urls?:
    | { public_id: string; secure_url?: string; original_filename: string }[]
    | null;
  creative_freedom: number;
  specific_reqs?: string;
  must_haves?: string;
  color_prefs?: string;
  placement_notes?: string;
  requested_date?: string | null;
  requested_time?: string | null;
  artist_preference?: string;
  terms_agreed?: boolean;
  medical_confirmed?: boolean;
  age_confirmed?: boolean;
  preferred_contact?: string;
  instagram_handle?: string;
  facebook_profile?: string;
  saved_reply_recommendations?: string[] | null;
  admin_notes?: string | null; // Keep the admin_notes field
  primaryTattooStyle?: string;
  styleDescription?: string;
}

// You might want to define other related booking types here too

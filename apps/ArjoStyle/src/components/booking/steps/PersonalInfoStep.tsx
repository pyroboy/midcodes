// src/components/booking/steps/PersonalInfoStep.tsx
// Personal information step with debounced validation feedback.

import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  AlertCircle,
  Phone,
  MessageSquareText,
  Instagram,
  Facebook,
  MessagesSquare,
  CalendarDays,
  User,
  Mail,
} from "lucide-react";

// UI Components
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Utilities & Types
import { cn } from "@/lib/utils";
import { BookingFormData } from "@/types/bookings";

// --- Constants (Defined outside the component for clarity and performance) ---

// Icon mapping for contact methods
const CONTACT_METHOD_ICONS: { [key: string]: React.ElementType } = {
  sms: MessageSquareText,
  call: Phone,
  whatsapp: MessagesSquare, // Placeholder for WhatsApp
  instagram: Instagram,
  facebook: Facebook,
};

// Available contact methods and their display order
const CONTACT_METHODS: Array<
  NonNullable<BookingFormData["preferredContactMethod"]>
> = ["sms", "call", "whatsapp", "instagram", "facebook"];

// Month options for Date of Birth selector
const MONTH_OPTIONS = [
  { value: "1", label: "January" },
  { value: "2", label: "February" },
  { value: "3", label: "March" },
  { value: "4", label: "April" },
  { value: "5", label: "May" },
  { value: "6", label: "June" },
  { value: "7", label: "July" },
  { value: "8", label: "August" },
  { value: "9", label: "September" },
  { value: "10", label: "October" },
  { value: "11", label: "November" },
  { value: "12", label: "December" },
];

// Debounce delay for input validation (in milliseconds)
const VALIDATION_DELAY = 500;

// --- Helper Function (Pure function, defined outside component) ---

/**
 * Calculates the number of days in a given month and year, accounting for leap years.
 * @param monthNum - The month number (1-12).
 * @param yearNum - The year number (e.g., 2023).
 * @returns The number of days in the specified month and year. Returns NaN if invalid month.
 */
const getDaysInMonth = (monthNum: number, yearNum: number): number => {
  if (monthNum < 1 || monthNum > 12 || isNaN(monthNum) || isNaN(yearNum)) {
    return NaN; // Invalid month
  }
  if (monthNum === 2) {
    // February: Check for leap year
    const isLeap =
      (yearNum % 4 === 0 && yearNum % 100 !== 0) || yearNum % 400 === 0;
    return isLeap ? 29 : 28;
  } else if ([4, 6, 9, 11].includes(monthNum)) {
    // Months with 30 days
    return 30;
  } else {
    // Months with 31 days
    return 31;
  }
};

// --- Component Props Interface ---

/** Props for the PersonalInfoStep component */
interface PersonalInfoStepProps {
  /** Current booking form data */
  formData: BookingFormData;
  /** Function to update the booking form data */
  updateFormData: (data: Partial<BookingFormData>) => void;
}

// --- Component Implementation ---

export const PersonalInfoStep: React.FC<PersonalInfoStepProps> = ({
  formData,
  updateFormData,
}) => {
  // --- State ---
  // Basic contact info errors
  const [nameError, setNameError] = useState<string>("");
  const [emailError, setEmailError] = useState<string>("");
  const [phoneError, setPhoneError] = useState<string>("");

  // Local state for Date of Birth parts
  const [day, setDay] = useState<string>("");
  const [month, setMonth] = useState<string>("");
  const [year, setYear] = useState<string>("");

  // Date of Birth related errors
  const [dayError, setDayError] = useState<string>("");
  const [monthError, setMonthError] = useState<string>(""); // Primarily for Select interaction edge cases
  const [yearError, setYearError] = useState<string>("");
  const [ageError, setAgeError] = useState<string>(""); // Consolidated error for invalid date/age

  // --- Refs for Debounce Timers ---
  const nameValidationTimeout = useRef<NodeJS.Timeout | null>(null);
  const emailValidationTimeout = useRef<NodeJS.Timeout | null>(null);
  const phoneValidationTimeout = useRef<NodeJS.Timeout | null>(null);
  const dayValidationTimeout = useRef<NodeJS.Timeout | null>(null);
  const yearValidationTimeout = useRef<NodeJS.Timeout | null>(null);

  // --- Initialization Effect ---
  // Populates local DOB state from formData and clears errors on mount/relevant changes
  useEffect(() => {
    let initialDay = "";
    let initialMonth = "";
    let initialYear = "";

    // Safely parse dateOfBirth from formData
    if (formData.dateOfBirth && typeof formData.dateOfBirth === "string") {
      const dateRegex = /^(\d{4})-(\d{1,2})-(\d{1,2})$/;
      const match = formData.dateOfBirth.match(dateRegex);

      if (match) {
        const [, y, m, d] = match;
        const yearNum = parseInt(y, 10);
        const monthNum = parseInt(m, 10);
        const dayNum = parseInt(d, 10);

        // Basic plausibility check
        if (
          yearNum > 1900 &&
          monthNum >= 1 &&
          monthNum <= 12 &&
          dayNum >= 1 &&
          dayNum <= 31
        ) {
          initialYear = y;
          initialMonth = String(monthNum); // Store as '1'-'12'
          initialDay = String(dayNum).padStart(2, "0"); // Pad day for display consistency
        } else {
          console.warn(
            "Parsed date parts out of plausible range:",
            formData.dateOfBirth
          );
          // Optionally clear parent state if format looks valid but numbers are impossible
          // updateFormData({ dateOfBirth: null });
        }
      } else {
        console.warn("Invalid date format in formData:", formData.dateOfBirth);
        // Optionally clear parent state if format is wrong
        // updateFormData({ dateOfBirth: null });
      }
    }

    setDay(initialDay);
    setMonth(initialMonth);
    setYear(initialYear);

    // Clear errors on initialization/dependency change
    setNameError("");
    setEmailError("");
    setPhoneError("");
    setDayError("");
    setMonthError("");
    setYearError("");
    setAgeError("");
  }, [formData.dateOfBirth]); // Re-run only when the source DOB string changes

  // --- Helper Function (Component-Specific Logic with State Access) ---

  // Validates the complete date (day/month/year) and checks age constraints.
  // Updates specific error states directly (dayError, monthError, yearError, ageError).
  // Returns true if valid, false otherwise.
  const validateFullDateAndAge = useCallback(
    (d: string, m: string, y: string): boolean => {
      // Reset errors specific to this validation function
      setDayError("");
      setMonthError("");
      setYearError("");
      setAgeError("");

      // Ensure all parts are present (basic check before parsing)
      if (!d || !m || !y || y.length !== 4) {
        // Don't set errors here, as the main effect handles incomplete state.
        // This check prevents proceeding with incomplete data.
        return false;
      }

      const dayNum = parseInt(d, 10);
      const monthNum = parseInt(m, 10); // Month state is '1'-'12'
      const yearNum = parseInt(y, 10);
      let isValid = true;

      // Validate numeric parsing (should be caught by input filters, but double-check)
      if (isNaN(dayNum)) {
        setDayError("Invalid number");
        isValid = false;
      }
      if (isNaN(monthNum)) {
        setMonthError("Invalid number");
        isValid = false;
      } // Unlikely with Select
      if (isNaN(yearNum)) {
        setYearError("Invalid number");
        isValid = false;
      }
      if (!isValid) return false;

      // Validate Year Range
      const currentYear = new Date().getFullYear();
      if (yearNum < 1900 || yearNum > currentYear) {
        setYearError(`Year must be 1900-${currentYear}`);
        isValid = false;
      }

      // Validate Month Range (extra check for safety)
      if (monthNum < 1 || monthNum > 12) {
        setMonthError("Invalid month"); // Should not happen with Select
        isValid = false;
      }

      // Validate Day Range (only if month and year seem okay so far)
      if (isValid) {
        const daysInSelectedMonth = getDaysInMonth(monthNum, yearNum);
        if (
          isNaN(daysInSelectedMonth) ||
          dayNum < 1 ||
          dayNum > daysInSelectedMonth
        ) {
          setDayError(`Day must be 1-${daysInSelectedMonth || 31}`);
          isValid = false;
        }
      }

      // If any date component is invalid, stop before age check
      if (!isValid) return false;

      // Validate Age (only if the date itself is structurally valid)
      try {
        const birthDate = new Date(yearNum, monthNum - 1, dayNum); // Month is 0-indexed
        // Double-check if the Date object auto-corrected (e.g., Feb 30 -> Mar 2)
        if (
          birthDate.getFullYear() !== yearNum ||
          birthDate.getMonth() !== monthNum - 1 ||
          birthDate.getDate() !== dayNum
        ) {
          setAgeError("Invalid date entered (e.g., Feb 30).");
          return false;
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        birthDate.setHours(0, 0, 0, 0);

        if (birthDate > today) {
          setAgeError("Date of birth cannot be in the future.");
          return false;
        }

        // Calculate age
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        if (
          monthDiff < 0 ||
          (monthDiff === 0 && today.getDate() < birthDate.getDate())
        ) {
          age--;
        }

        // Check age limits (e.g., 18+)
        const MIN_AGE = 18;
        const MAX_AGE = 110;
        if (age < MIN_AGE) {
          setAgeError(`You must be at least ${MIN_AGE} years old.`);
          isValid = false;
        } else if (age > MAX_AGE) {
          setAgeError("Age seems too high, please double-check.");
          // Decide if this is strictly invalid or just a warning
          // isValid = false; // Uncomment if > MAX_AGE is invalid
        } else {
          setAgeError(""); // Clear age error if valid
        }
      } catch (error) {
        console.error("Error during age calculation:", error);
        setAgeError("Could not validate date/age.");
        isValid = false;
      }

      return isValid;
    },
    []
  ); // No external dependencies other than state setters

  // --- Validation Effect for Date ---
  // Runs when local day, month, or year change to perform full validation
  // and update the parent formData.dateOfBirth
  useEffect(() => {
    // 1. Check if all parts are present and year is complete
    const isComplete = !!day && !!month && !!year && year.length === 4;

    if (isComplete) {
      // 2. Validate the complete date and age
      const isValidDateAndAge = validateFullDateAndAge(day, month, year);

      if (isValidDateAndAge) {
        // 3. Format date as YYYY-MM-DD for parent state
        const formattedMonth = month.padStart(2, "0");
        const formattedDay = day.padStart(2, "0");
        const dateString = `${year}-${formattedMonth}-${formattedDay}`;

        // 4. Update parent only if the valid date is different
        if (formData.dateOfBirth !== dateString) {
          updateFormData({ dateOfBirth: dateString });
        }
        // Errors should have been cleared by validateFullDateAndAge
      } else {
        // 5. Date/age is invalid - Ensure parent state reflects this
        if (formData.dateOfBirth !== null) {
          updateFormData({ dateOfBirth: null });
        }
        // Specific errors (day, month, year, age) should have been set by validateFullDateAndAge
      }
    } else {
      // 6. Date is incomplete - Ensure parent state reflects this
      if (formData.dateOfBirth !== null) {
        updateFormData({ dateOfBirth: null });
      }
      // 7. Clear any previous *combined* age/date error if inputs are now incomplete
      //    Individual field format errors (like year length) are handled by their specific handlers/validators.
      if (ageError) setAgeError("");
      // Optionally clear specific errors if the corresponding field becomes empty
      // if (!day && dayError) setDayError("");
      // if (!month && monthError) setMonthError(""); // Less likely needed for Select
      // if ((!year || year.length < 4) && yearError) setYearError("");
    }
  }, [
    day,
    month,
    year,
    formData.dateOfBirth,
    updateFormData,
    validateFullDateAndAge,
    ageError,
  ]); // Added ageError to dependencies to clear it when date becomes incomplete

  // --- Input Handlers with Debounced Validation ---

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    updateFormData({ name: value }); // Update parent immediately

    if (nameValidationTimeout.current)
      clearTimeout(nameValidationTimeout.current);
    nameValidationTimeout.current = setTimeout(() => {
      if (!value.trim()) setNameError("Full name is required.");
      else if (value.trim().length < 2) setNameError("Name seems too short.");
      else setNameError("");
    }, VALIDATION_DELAY);
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    updateFormData({ email: value }); // Update parent immediately

    if (emailValidationTimeout.current)
      clearTimeout(emailValidationTimeout.current);
    emailValidationTimeout.current = setTimeout(() => {
      if (!value.trim()) setEmailError("Email address is required.");
      else if (!/\S+@\S+\.\S+/.test(value))
        setEmailError("Please enter a valid email address.");
      else setEmailError("");
    }, VALIDATION_DELAY);
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    updateFormData({ phone: value }); // Update parent immediately

    if (phoneValidationTimeout.current)
      clearTimeout(phoneValidationTimeout.current);
    phoneValidationTimeout.current = setTimeout(() => {
      // Basic phone validation (can be enhanced)
      if (!value.trim()) setPhoneError("Phone number is required.");
      else if (value.trim().length < 7)
        setPhoneError("Phone number seems too short."); // Basic length check
      else setPhoneError("");
    }, VALIDATION_DELAY);
  };

  const handleDayChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Allow only digits, max 2 characters
    if (/^\d{0,2}$/.test(value)) {
      setDay(value); // Update local state immediately (triggers validation effect)

      if (dayValidationTimeout.current)
        clearTimeout(dayValidationTimeout.current);
      dayValidationTimeout.current = setTimeout(() => {
        // Quick format check (1-31). Full validation happens in the effect.
        const dayNum = parseInt(value, 10);
        if (value && (isNaN(dayNum) || dayNum < 1 || dayNum > 31)) {
          setDayError("Day must be 1-31");
        } else {
          setDayError(""); // Clear basic format error; effect handles contextual validity
        }
      }, VALIDATION_DELAY);
    }
  };

  // No debounce needed for Select
  const handleMonthChange = (value: string) => {
    setMonth(value); // Update local state (triggers validation effect)
    setMonthError(""); // Clear any residual error immediately
  };

  const handleYearChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Allow only digits, max 4 characters
    if (/^\d{0,4}$/.test(value)) {
      setYear(value); // Update local state immediately (triggers validation effect)

      if (yearValidationTimeout.current)
        clearTimeout(yearValidationTimeout.current);
      yearValidationTimeout.current = setTimeout(() => {
        // Quick format/range check. Full validation happens in the effect.
        const currentYear = new Date().getFullYear();
        const yearNum = parseInt(value, 10);
        if (value && value.length < 4) {
          setYearError("Enter 4 digits");
        } else if (
          value &&
          (isNaN(yearNum) || yearNum < 1900 || yearNum > currentYear)
        ) {
          setYearError(`Year must be 1900-${currentYear}`);
        } else {
          setYearError(""); // Clear basic format error; effect handles contextual validity
        }
      }, VALIDATION_DELAY);
    }
  };

  // No debounce needed for Buttons
  const handleContactMethodSelect = (
    method: NonNullable<BookingFormData["preferredContactMethod"]>
  ) => {
    updateFormData({ preferredContactMethod: method });
  };

  // --- Cleanup Effect ---
  // Clears any running validation timeouts when the component unmounts
  useEffect(() => {
    return () => {
      if (nameValidationTimeout.current)
        clearTimeout(nameValidationTimeout.current);
      if (emailValidationTimeout.current)
        clearTimeout(emailValidationTimeout.current);
      if (phoneValidationTimeout.current)
        clearTimeout(phoneValidationTimeout.current);
      if (dayValidationTimeout.current)
        clearTimeout(dayValidationTimeout.current);
      if (yearValidationTimeout.current)
        clearTimeout(yearValidationTimeout.current);
    };
  }, []); // Runs only once on mount/unmount

  // --- Render JSX ---
  return (
    <div className="space-y-8 max-w-3xl py-2 mx-auto">
      {/* Contact Details Card */}
      <Card>
        <CardHeader>
          <CardTitle>Contact Details</CardTitle>
          <CardDescription>How we can reach you.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* --- Name, Email, Phone --- */}
          <div className="grid sm:grid-cols-2 gap-x-6 gap-y-2">
            {/* Name */}
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="name" className="flex items-center gap-1.5">
                <User className="h-4 w-4 text-muted-foreground" />
                Full Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                value={formData.name || ""}
                onChange={handleNameChange}
                placeholder="e.g., Juan Dela Cruz"
                required
                aria-required="true"
                aria-invalid={!!nameError}
                aria-describedby="name-error"
                className={cn(
                  nameError &&
                    "border-destructive focus-visible:ring-destructive"
                )}
              />
              <p
                id="name-error"
                className="text-xs text-destructive min-h-[1rem]"
              >
                {nameError || "\u00A0"} {/* Use space to keep height */}
              </p>
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <Label htmlFor="email" className="flex items-center gap-1.5">
                <Mail className="h-4 w-4 text-muted-foreground" />
                Email Address <span className="text-destructive">*</span>
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email || ""}
                onChange={handleEmailChange}
                placeholder="e.g., juan.dela.cruz@email.com"
                required
                aria-required="true"
                aria-invalid={!!emailError}
                aria-describedby="email-error"
                className={cn(
                  emailError &&
                    "border-destructive focus-visible:ring-destructive"
                )}
              />
              <p
                id="email-error"
                className="text-xs text-destructive min-h-[1rem]"
              >
                {emailError || "\u00A0"}
              </p>
            </div>

            {/* Phone */}
            <div className="space-y-1.5">
              <Label htmlFor="phone" className="flex items-center gap-1.5">
                <Phone className="h-4 w-4 text-muted-foreground" />
                Phone Number <span className="text-destructive">*</span>
              </Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone || ""}
                onChange={handlePhoneChange}
                placeholder="e.g., 09171234567"
                required
                aria-required="true"
                aria-invalid={!!phoneError}
                aria-describedby="phone-error phone-hint"
                className={cn(
                  phoneError &&
                    "border-destructive focus-visible:ring-destructive"
                )}
              />
              <p
                id="phone-error"
                className="text-xs text-destructive min-h-[1rem]"
              >
                {phoneError || "\u00A0"}
              </p>
              <p id="phone-hint" className="text-xs text-muted-foreground pt-1">
                Use PH format (09xx...). Use +63 if international.
              </p>
            </div>
          </div>{" "}
          {/* End Grid */}
          {/* --- Date of Birth --- */}
          {/* Wrapped in a fieldset for semantic grouping */}
          <fieldset className="space-y-3 pt-4 border-t">
            <legend className="text-base font-medium mb-2 flex items-center gap-2 -ml-1">
              {" "}
              {/* Adjust margin slightly if needed */}
              <CalendarDays className="h-5 w-5 text-muted-foreground" />
              Date of Birth <span className="text-destructive">*</span>
            </legend>
            <div className="grid grid-cols-3 gap-x-4 gap-y-1 items-start">
              {/* Month */}
              <div className="space-y-1.5">
                <Label htmlFor="dob-month" className="sr-only">
                  Month
                </Label>
                <Select
                  value={month}
                  onValueChange={handleMonthChange}
                  required
                  aria-required="true"
                  // Indicate invalid if month itself has error OR if there's an age error and month is missing
                  aria-invalid={!!monthError || (!!ageError && !month)}
                  aria-describedby="dob-month-error dob-age-error"
                >
                  <SelectTrigger
                    id="dob-month"
                    className={cn(
                      (monthError || (ageError && !month)) &&
                        "border-destructive focus-visible:ring-destructive"
                    )}
                  >
                    <SelectValue placeholder="Month" />
                  </SelectTrigger>
                  <SelectContent>
                    {MONTH_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p
                  id="dob-month-error"
                  className="text-xs text-destructive min-h-[1rem]"
                >
                  {monthError || "\u00A0"}
                </p>
              </div>

              {/* Day */}
              <div className="space-y-1.5">
                <Label htmlFor="dob-day" className="sr-only">
                  Day
                </Label>
                <Input
                  id="dob-day"
                  value={day}
                  onChange={handleDayChange}
                  placeholder="DD"
                  maxLength={2}
                  required
                  aria-required="true"
                  inputMode="numeric"
                  // Indicate invalid if day itself has error OR if there's an age error and day is missing
                  aria-invalid={!!dayError || (!!ageError && !day)}
                  aria-describedby="dob-day-error dob-age-error"
                  className={cn(
                    "text-center",
                    (dayError || (ageError && !day)) &&
                      "border-destructive focus-visible:ring-destructive"
                  )}
                />
                <p
                  id="dob-day-error"
                  className="text-xs text-destructive min-h-[1rem]"
                >
                  {dayError || "\u00A0"}
                </p>
              </div>

              {/* Year */}
              <div className="space-y-1.5">
                <Label htmlFor="dob-year" className="sr-only">
                  Year
                </Label>
                <Input
                  id="dob-year"
                  value={year}
                  onChange={handleYearChange}
                  placeholder="YYYY"
                  maxLength={4}
                  required
                  aria-required="true"
                  inputMode="numeric"
                  // Indicate invalid if year itself has error OR if there's an age error and year is missing/incomplete
                  aria-invalid={
                    !!yearError || (!!ageError && (!year || year.length < 4))
                  }
                  aria-describedby="dob-year-error dob-age-error"
                  className={cn(
                    "text-center",
                    (yearError || (ageError && (!year || year.length < 4))) &&
                      "border-destructive focus-visible:ring-destructive"
                  )}
                />
                <p
                  id="dob-year-error"
                  className="text-xs text-destructive min-h-[1rem]"
                >
                  {yearError || "\u00A0"}
                </p>
              </div>
            </div>
            {/* General Age/Date Error Alert - Shows only if there's an age error *and* no specific field errors */}
            {ageError && !dayError && !monthError && !yearError && (
              <Alert
                variant="destructive"
                id="dob-age-error"
                role="alert"
                className="mt-4 col-span-3"
              >
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Date / Age Issue</AlertTitle>
                <AlertDescription>{ageError}</AlertDescription>
              </Alert>
            )}
          </fieldset>{" "}
          {/* End Date of Birth Fieldset */}
          {/* --- Preferred Contact Method --- */}
          <div className="space-y-3 pt-4 border-t">
            <Label className="font-medium block mb-2">
              Preferred Contact Method{" "}
              <span className="text-destructive">*</span>
            </Label>
            <div className="flex flex-wrap gap-3">
              {CONTACT_METHODS.map((method) => {
                const Icon = CONTACT_METHOD_ICONS[method];
                const isSelected = formData.preferredContactMethod === method;
                return (
                  <Button
                    key={method}
                    type="button"
                    variant={isSelected ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleContactMethodSelect(method)}
                    className={cn(
                      "flex items-center gap-2 transition-all duration-150 ease-in-out",
                      isSelected &&
                        "ring-2 ring-primary ring-offset-2 shadow-md"
                    )}
                    aria-pressed={isSelected}
                  >
                    {Icon && <Icon className="h-4 w-4 flex-shrink-0" />}
                    <span className="capitalize whitespace-nowrap">
                      {method === "sms" ? "SMS / Text" : method}
                    </span>
                  </Button>
                );
              })}
            </div>
            {!formData.preferredContactMethod && (
              <p className="text-xs text-destructive min-h-[1rem] pt-1">
                Please select a contact method.
              </p>
            )}
            <p className="text-xs text-muted-foreground pt-1">
              We'll use this for confirmations and follow-ups.
            </p>
          </div>
          {/* --- Social Media Handles (Optional) --- */}
          <div className="space-y-4 pt-6 border-t border-dashed">
            <p className="text-sm font-medium text-muted-foreground">
              Social Media (Optional)
            </p>
            <div className="grid sm:grid-cols-2 gap-x-6 gap-y-4">
              {/* Instagram */}
              <div className="space-y-1.5">
                <Label
                  htmlFor="instagram"
                  className="flex items-center gap-1.5"
                >
                  <Instagram className="h-4 w-4 text-muted-foreground" />
                  Instagram Handle
                </Label>
                <Input
                  id="instagram"
                  value={formData.instagramHandle || ""}
                  onChange={(e) =>
                    updateFormData({ instagramHandle: e.target.value })
                  }
                  placeholder="@your_username"
                  aria-label="Instagram Handle (Optional)"
                />
              </div>
              {/* Facebook */}
              <div className="space-y-1.5">
                <Label htmlFor="facebook" className="flex items-center gap-1.5">
                  <Facebook className="h-4 w-4 text-muted-foreground" />
                  Facebook Name/Link
                </Label>
                <Input
                  id="facebook"
                  value={formData.facebookProfile || ""}
                  onChange={(e) =>
                    updateFormData({ facebookProfile: e.target.value })
                  }
                  placeholder="Your Name or facebook.com/yourprofile"
                  aria-label="Facebook Profile Name or Link (Optional)"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Note: The original had a closing div for the main wrapper, which is kept */}
    </div>
  );
};

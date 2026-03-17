import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { BookingFormData } from "@/types/bookings";
interface BasicInfoStepProps {
  formData: BookingFormData;
  updateFormData: (data: Partial<BookingFormData>) => void;
}

export const BasicInfoStep: React.FC<BasicInfoStepProps> = ({
  formData,
  updateFormData,
}) => {
  const [day, setDay] = useState<string>("");
  const [month, setMonth] = useState<string>("");
  const [year, setYear] = useState<string>("");
  const [ageError, setAgeError] = useState<string>("");
  const [dayError, setDayError] = useState<string>("");
  const [monthError, setMonthError] = useState<string>("");
  const [yearError, setYearError] = useState<string>("");

  // Initialize from formData if it exists
  useEffect(() => {
    if (formData.dateOfBirth) {
      try {
        const date = new Date(formData.dateOfBirth);
        if (!isNaN(date.getTime())) {
          setMonth((date.getMonth() + 1).toString());
          setDay(date.getDate().toString());
          setYear(date.getFullYear().toString());
        }
      } catch (error) {
        console.error("Error parsing date:", error);
      }
    }
  }, [formData.dateOfBirth]);

  // Validate day input
  const validateDay = (value: string) => {
    const dayNum = parseInt(value);
    if (value === "") {
      setDayError("");
      return true;
    }

    if (isNaN(dayNum) || !Number.isInteger(dayNum)) {
      setDayError("Day must be a number");
      return false;
    }

    if (dayNum < 1 || dayNum > 31) {
      setDayError("Day must be between 1-31");
      return false;
    }

    // Check if day is valid for the selected month and year
    if (month && year) {
      const daysInMonth = getDaysInMonth(parseInt(month), parseInt(year));
      if (dayNum > daysInMonth) {
        setDayError(`This month has only ${daysInMonth} days`);
        return false;
      }
    }

    setDayError("");
    return true;
  };

  // Validate month input
  const validateMonth = (value: string) => {
    const monthNum = parseInt(value);
    if (value === "") {
      setMonthError("");
      return true;
    }

    if (isNaN(monthNum) || !Number.isInteger(monthNum)) {
      setMonthError("Month must be a number");
      return false;
    }

    if (monthNum < 1 || monthNum > 12) {
      setMonthError("Month must be between 1-12");
      return false;
    }

    setMonthError("");
    return true;
  };

  // Validate year input
  const validateYear = (value: string) => {
    const yearNum = parseInt(value);
    const currentYear = new Date().getFullYear();

    if (value === "") {
      setYearError("");
      return true;
    }

    if (isNaN(yearNum) || !Number.isInteger(yearNum)) {
      setYearError("Year must be a number");
      return false;
    }

    if (yearNum < currentYear - 120 || yearNum > currentYear) {
      setYearError(`Year must be between ${currentYear - 120}-${currentYear}`);
      return false;
    }

    setYearError("");
    return true;
  };

  // Get days in month helper
  const getDaysInMonth = (month: number, year: number) => {
    // February special case for leap years
    if (month === 2) {
      const isLeapYear =
        (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
      return isLeapYear ? 29 : 28;
    }
    // April, June, September, November have 30 days
    else if ([4, 6, 9, 11].includes(month)) {
      return 30;
    }
    // All other months have 31 days
    else {
      return 31;
    }
  };

  // Check if user is at least 18 years old
  const validateAge = (yearVal: string, monthVal: string, dayVal: string) => {
    if (!yearVal || !monthVal || !dayVal) return false;

    try {
      const birthDate = new Date(
        parseInt(yearVal),
        parseInt(monthVal) - 1,
        parseInt(dayVal)
      );
      if (isNaN(birthDate.getTime())) {
        setAgeError("Please enter a valid date.");
        return false;
      }

      const today = new Date();

      // Calculate age
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();

      // Adjust age if birthday hasn't occurred yet this year
      if (
        monthDiff < 0 ||
        (monthDiff === 0 && today.getDate() < birthDate.getDate())
      ) {
        age--;
      }

      if (age < 18) {
        setAgeError(
          "You must be at least 18 years old to book a tattoo appointment."
        );
        return false;
      } else {
        setAgeError("");
        return true;
      }
    } catch (error) {
      console.error("Error validating age:", error);
      setAgeError("Please enter a valid date.");
      return false;
    }
  };

  // Handle day input change
  const handleDayChange = (value: string) => {
    // Allow empty string or numbers only
    if (value === "" || /^\d*$/.test(value)) {
      setDay(value);
      validateDay(value);

      if (month && year && value) {
        updateDateOfBirth(value);
      }
    }
  };

  // Handle month input change
  const handleMonthChange = (value: string) => {
    // Allow empty string or numbers only
    if (value === "" || /^\d*$/.test(value)) {
      setMonth(value);
      validateMonth(value);

      // Revalidate day if month changes
      if (day) {
        validateDay(day);
      }

      if (day && year && value) {
        updateDateOfBirth(undefined, value);
      }
    }
  };

  // Handle year input change
  const handleYearChange = (value: string) => {
    // Allow empty string or numbers only
    if (value === "" || /^\d*$/.test(value)) {
      setYear(value);
      validateYear(value);

      // Revalidate day if year changes (for leap years)
      if (day) {
        validateDay(day);
      }

      if (day && month && value) {
        updateDateOfBirth(undefined, undefined, value);
      }
    }
  };

  // Update the date of birth in the form data
  const updateDateOfBirth = (
    newDay?: string,
    newMonth?: string,
    newYear?: string
  ) => {
    const dayVal = newDay || day;
    const monthVal = newMonth || month;
    const yearVal = newYear || year;

    if (dayVal && monthVal && yearVal) {
      // Validate all inputs first
      const isDayValid = validateDay(dayVal);
      const isMonthValid = validateMonth(monthVal);
      const isYearValid = validateYear(yearVal);

      if (isDayValid && isMonthValid && isYearValid) {
        const isAgeValid = validateAge(yearVal, monthVal, dayVal);

        if (isAgeValid) {
          // Format: YYYY-MM-DD
          const formattedMonth = monthVal.padStart(2, "0");
          const formattedDay = dayVal.padStart(2, "0");
          const dateString = `${yearVal}-${formattedMonth}-${formattedDay}`;
          updateFormData({ dateOfBirth: dateString });
        }
      }
    }
  };

  const handleChange = (field: string, value: string) => {
    updateFormData({ [field]: value });
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold">Basic Information</h2>
        <p className="text-muted-foreground">Let us know a little about you</p>
      </div>

      <Card>
        <CardContent className="pt-6 space-y-4">
          {/* Contact Information */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleChange("name", e.target.value)}
                placeholder="Your full name"
                className="h-12 text-lg"
              />
            </div>

            {/* Age Verification */}
            <div className="space-y-2">
              <Label className="text-lg font-medium">
                Date of Birth (Must be 18+)
              </Label>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1">
                  <Label htmlFor="dob-day" className="text-sm">
                    Day
                  </Label>
                  <Input
                    id="dob-day"
                    value={day}
                    onChange={(e) => handleDayChange(e.target.value)}
                    placeholder="DD"
                    className={`h-14 text-lg text-center ${
                      dayError ? "border-red-500" : ""
                    }`}
                    maxLength={2}
                  />
                  {dayError && (
                    <p className="text-xs text-red-500">{dayError}</p>
                  )}
                </div>

                <div className="space-y-1">
                  <Label htmlFor="dob-month" className="text-sm">
                    Month
                  </Label>
                  <Input
                    id="dob-month"
                    value={month}
                    onChange={(e) => handleMonthChange(e.target.value)}
                    placeholder="MM"
                    className={`h-14 text-lg text-center ${
                      monthError ? "border-red-500" : ""
                    }`}
                    maxLength={2}
                  />
                  {monthError && (
                    <p className="text-xs text-red-500">{monthError}</p>
                  )}
                </div>

                <div className="space-y-1">
                  <Label htmlFor="dob-year" className="text-sm">
                    Year
                  </Label>
                  <Input
                    id="dob-year"
                    value={year}
                    onChange={(e) => handleYearChange(e.target.value)}
                    placeholder="YYYY"
                    className={`h-14 text-lg text-center ${
                      yearError ? "border-red-500" : ""
                    }`}
                    maxLength={4}
                  />
                  {yearError && (
                    <p className="text-xs text-red-500">{yearError}</p>
                  )}
                </div>
              </div>

              {ageError && (
                <Alert variant="destructive" className="mt-2">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Age Restriction</AlertTitle>
                  <AlertDescription>{ageError}</AlertDescription>
                </Alert>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleChange("email", e.target.value)}
                placeholder="Your email address"
                className="h-12 text-lg"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => handleChange("phone", e.target.value)}
                placeholder="Your phone number"
                className="h-12 text-lg"
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

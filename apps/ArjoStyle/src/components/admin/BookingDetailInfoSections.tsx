// src/components/admin/BookingDetailInfoSections.tsx
import React from "react";
import {
  MessageSquare,
  ClipboardCheck,
  Instagram,
  Facebook,
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { DetailItem } from "./DetailItem"; // Import extracted component
import { BookingData } from "@/types/bookings";
// Import ALL necessary formatters
import {
  displayOrDefault,
  renderLink,
  formatDetailDate,
  formatDetailDateTime,
  formatCurrency,
  formatDuration,
  getComplexityLabel,
  getStatusBadgeVariant,
} from "@/lib/formatters"; // Import from new location

interface BookingDetailInfoSectionsProps {
  booking: BookingData; // Needs the full booking object
}

export const BookingDetailInfoSections: React.FC<
  BookingDetailInfoSectionsProps
> = ({ booking }) => {
  return (
    <>
      {/* Client Notes Section */}
      <div className="space-y-3 px-1">
        <h3 className="font-semibold text-lg flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-muted-foreground" /> Client
          Notes
        </h3>
        <DetailItem
          label="Idea / Specifics"
          value={booking.specific_reqs}
          isBlock
        />
        <DetailItem label="Must-Haves" value={booking.must_haves} isBlock />
        <DetailItem label="Color Prefs" value={booking.color_prefs} isBlock />
        <DetailItem
          label="Placement Notes"
          value={booking.placement_notes}
          isBlock
        />
      </div>
      <Separator className="my-1 bg-border/50" />

      {/* Booking Details Section */}
      <div className="space-y-4 px-1">
        <h3 className="font-semibold text-lg flex items-center gap-2">
          <ClipboardCheck className="h-5 w-5 text-muted-foreground" /> All
          Details
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-2 text-sm border-l-2 border-primary/20 ml-1 pl-3">
          <DetailItem label="Status">
            <Badge
              variant={getStatusBadgeVariant(booking.status)}
              className="text-xs px-1.5 py-0.5"
            >
              {booking.status}
            </Badge>
          </DetailItem>
          <DetailItem label="Client Email">
            {renderLink(booking.email, "mailto:", booking.email)}
          </DetailItem>
          <DetailItem label="Client Phone">
            {renderLink(booking.phone, "tel:", booking.phone)}
          </DetailItem>
          <DetailItem
            label="Requested Date"
            value={formatDetailDateTime(
              booking.requested_date,
              booking.requested_time
            )}
          />
          <DetailItem label="Placement" value={booking.placement} />
          <DetailItem
            label="Approx. Size"
            value={`${displayOrDefault(booking.tattoo_size)}" inches`}
          />
          <DetailItem label="Color Tattoo" value={booking.is_color} />
          <DetailItem label="Category" value={booking.category} />
          <DetailItem label="Cover-up?" value={booking.is_cover_up} />
          <DetailItem
            label="Complexity"
            value={getComplexityLabel(booking.complexity)}
          />
          <DetailItem
            label="Creative Freedom"
            value={`${displayOrDefault(booking.creative_freedom)}%`}
          />
          <DetailItem
            label="Tattoo Style"
            value={booking.primaryTattooStyle || "Not specified"}
          />
          <DetailItem
            label="Style Description"
            value={booking.styleDescription || "Not specified"}
          />
          <DetailItem
            label="Est. Duration"
            value={formatDuration(booking.estimated_duration)}
          />
          <DetailItem
            label="Est. Sessions"
            value={booking.estimated_sessions}
          />
          <DetailItem
            label="Est. Price"
            value={formatCurrency(booking.pricing_details?.total)}
          />
          <DetailItem label="Artist Pref" value={booking.artist_preference} />
          <DetailItem
            label="Date of Birth"
            value={formatDetailDate(booking.dob)}
          />
          <DetailItem label="Pref. Contact" value={booking.preferred_contact} />
          <DetailItem label="Instagram">
            {renderLink(
              booking.instagram_handle,
              "https://www.instagram.com/arjostyle",
              booking.instagram_handle
            )}
          </DetailItem>
          <DetailItem label="Facebook">
            {renderLink(
              booking.facebook_profile,
              "https://www.facebook.com/arjoStyleTattoo/",
              booking.facebook_profile
            )}
          </DetailItem>
          <DetailItem label="Terms Agreed" value={booking.terms_agreed} />
          <DetailItem label="Medical OK" value={booking.medical_confirmed} />
          <DetailItem label="Age OK" value={booking.age_confirmed} />
        </div>
      </div>
    </>
  );
};

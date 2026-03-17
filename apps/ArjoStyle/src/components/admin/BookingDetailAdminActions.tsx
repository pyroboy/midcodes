// src/components/admin/BookingDetailAdminActions.tsx

import React from "react";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Loader2, AlertCircle, Bot, RefreshCw, Edit, Save } from "lucide-react";
import { cn } from "@/lib/utils";

// --- UPDATED Props Interface ---
interface BookingDetailAdminActionsProps {
  adminNotes: string;
  setAdminNotes: (notes: string) => void;
  handleFetchReplies: () => Promise<void>; // Function prop
  replyRecommendations: string[] | null;
  isFetchingReplies: boolean;
  replyError: string | null;
  generateButtonText: string;
  handleSaveNotesClick: () => Promise<void>; // Function prop
  isSavingNotes: boolean; // Changed to boolean: Is the "Save Notes" specifically running?
  isAnySaving: boolean; // Added: Is *any* save operation (notes, schedule, close) running?
  hasNotesChanged: boolean;
}

export const BookingDetailAdminActions: React.FC<
  BookingDetailAdminActionsProps
> = ({
  adminNotes,
  setAdminNotes,
  handleFetchReplies,
  replyRecommendations,
  isFetchingReplies,
  replyError,
  generateButtonText,
  handleSaveNotesClick,
  isSavingNotes, // Now a boolean
  isAnySaving, // New prop
  hasNotesChanged,
}) => {
  return (
    <>
      {/* Admin Review Notes Input Section */}
      <div className="space-y-2 px-1">
        <div className="flex justify-between items-center gap-2 flex-wrap">
          <Label
            htmlFor="admin-notes-input"
            className="flex items-center gap-1.5 font-medium text-muted-foreground"
          >
            <Edit size={14} /> Admin Review Notes
          </Label>
          <Button
            variant="outline"
            size="sm"
            onClick={handleSaveNotesClick}
            disabled={!hasNotesChanged || isSavingNotes || isAnySaving} // Disable if saving notes OR any other save
            title="Save admin notes to database"
          >
            {isSavingNotes ? ( // Use boolean directly
              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-1" />
            )}
            {isSavingNotes ? "Saving..." : "Save Notes"}
          </Button>
        </div>
        <Textarea
          id="admin-notes-input"
          placeholder="Enter internal notes about this booking (style feasibility, pricing considerations, questions for client...). These notes ARE saved."
          value={adminNotes}
          onChange={(e) => setAdminNotes(e.target.value)}
          rows={4}
          className="text-sm bg-background border-input focus:border-primary"
          disabled={isAnySaving} // Disable textarea during any save operation
        />
        <p className="text-xs text-muted-foreground">
          These notes are saved with the booking and used for AI context.
        </p>
      </div>
      <Separator className="my-1 bg-border/50" />

      {/* AI Reply Suggestions Section */}
      <div className="space-y-3 px-1">
        <div className="flex justify-between items-center flex-wrap gap-2">
          <h3 className="font-semibold text-lg flex items-center gap-2">
            <Bot className="h-5 w-5 text-muted-foreground" /> AI Reply
            Suggestions
          </h3>
          <Button
            variant="outline"
            size="sm"
            onClick={handleFetchReplies}
            // --- UPDATED: Disable if fetching OR if any save is happening ---
            disabled={isFetchingReplies || isAnySaving}
            title={`${generateButtonText} AI suggestions (uses current admin notes)`}
          >
            <RefreshCw
              className={cn("h-4 w-4", isFetchingReplies && "animate-spin")}
            />
            <span className="ml-2">{generateButtonText}</span>
          </Button>
        </div>
        <div className="pl-2 text-sm min-h-[60px] flex flex-col justify-center">
          {isFetchingReplies && (
            <div className="flex items-center text-muted-foreground p-2">
              <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Generating...
            </div>
          )}
          {replyError && !isFetchingReplies && (
            <div className="text-destructive flex items-start p-2 bg-destructive/10 rounded border border-destructive/30">
              <AlertCircle className="h-4 w-4 mr-2 flex-shrink-0 mt-0.5" />{" "}
              Error: {replyError}
            </div>
          )}
          {!isFetchingReplies &&
            !replyError &&
            replyRecommendations &&
            replyRecommendations.length > 0 && (
              <ul className="list-decimal pl-5 space-y-2 bg-muted/40 p-3 rounded border">
                {replyRecommendations.map((reply, index) => (
                  <li
                    key={index}
                    className="text-foreground"
                    // Using dangerouslySetInnerHTML assumes the AI response provides safe HTML (e.g., <br>)
                    // Be cautious if the AI prompt could generate unsafe tags. Sanitize if necessary.
                    dangerouslySetInnerHTML={{ __html: reply }}
                  />
                ))}
              </ul>
            )}
          {!isFetchingReplies &&
            !replyError &&
            replyRecommendations?.length === 0 && (
              <p className="text-muted-foreground italic px-2 py-4 text-center border rounded-md bg-muted/30">
                AI generated no suggestions.
              </p>
            )}
          {!isFetchingReplies && !replyError && !replyRecommendations && (
            <p className="text-muted-foreground italic px-2 py-4 text-center border rounded-md bg-muted/30">
              Click Generate/Refresh for AI suggestions.
            </p>
          )}
        </div>
      </div>
      <Separator className="my-1 bg-border/50" />
    </>
  );
};

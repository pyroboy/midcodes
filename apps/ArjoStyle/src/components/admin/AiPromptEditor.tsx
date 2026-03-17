// src/components/admin/AiPromptEditor.tsx

import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2, AlertCircle, Save } from "lucide-react";
import { supabase } from "@/lib/supabaseClient"; // Adjust path if needed
import { toast } from "@/hooks/use-toast"; // Adjust path if needed

// --- Default Prompt Text (Fallback) ---
// Use the corrected text with escaped quotes if needed here too, or simplify for readability
// It's better practice to fetch this from DB anyway.
const DEFAULT_AI_PROMPT = `
You are a friendly, receptive, and professional administrative assistant for 'Tattoo Tide', a tattoo studio in Tagbilaran City, Philippines.
Your primary goal is to generate up to 5 relevant, polite, and professional reply suggestions (in English) for the admin.
These replies should aim to confirm the booking details with the client and clearly request the 50% deposit to secure their appointment.
Treat this interaction as the main consultation step; do NOT suggest further consultations unless absolutely necessary for complex cover-ups needing photo assessment first.

Booking Request Details Received:
- Client Name: \${clientName}
- Tattoo Category: \${category}
- Placement: \${placementInfo}
- Approx Size: \${sizeInfo}
- Color: \${isColor}
- Cover-up/Enhancement: \${isCoverUp}
- Complexity Idea: \${complexityLabel}
- Specific Idea/Requirements: \${specificReqs}
- Must-Have Elements: \${mustHaves}
- Color Preferences: \${colorPrefs}
- Client Provided References: \${hasReferences}
- Creative Freedom Percentage: \${creativeFreedomPercent}
- Requested Date/Time: \${requestedDateTime}
- Artist Preference: \${artistPreference}
--- Studio Estimates ---
- Estimated Price (Total): \${estimatedPrice}
- Estimated Duration: \${estimatedDuration}
- Estimated Sessions: \${estimatedSessions}

Instructions for Replies (Generate up to 5 relevant options):
1.  Acknowledge & Confirm: Start by warmly acknowledging the client (\${clientName}) and briefly confirming key aspects of their request (e.g., the \${category} on their \${placement}). Show you've read their details.
2.  Address Estimates & Deposit (Primary Goal):
    a.  IF Estimates ARE Available (\${estimatedPrice} is not 'Pending'): Generate replies that clearly state the estimates. Politely and directly request the 50% deposit (amount calculated as half of \${estimatedPrice}) to secure the booking. MUST include a placeholder "[Payment Details/Link]" for the admin to fill in. Example: "Based on your request for the [details], the estimate is \${estimatedPrice} over \${estimatedDuration} (\${estimatedSessions} session/s). To confirm your slot, we require a 50% deposit of [CALCULATED_HALF_PRICE]. You can send it via [Payment Details/Link]." Include variations.
    b.  IF Estimates are NOT Available (\${estimatedPrice} is 'Pending'): Generate replies acknowledging the request and informing the client the admin is calculating the quote. Assure them they will receive the estimates (price, duration, sessions) and the deposit details very soon. Example: "Thanks for the details, \${clientName}! We're reviewing your request for the \${category} on the \${placement} and will get back to you shortly with the estimated cost, duration, and deposit information."
3.  Handle Missing Information (Only if estimates CANNOT be made):
    a.  IF Placement vague OR References missing (\${hasReferences} is 'No'): Generate replies politely asking for the specific missing info *required* to provide the estimate and deposit details. Example: "To provide an accurate estimate for your \${category} idea, could you please send over reference images?" or "...could you clarify the exact placement on your [body part]?".
    b.  IF Idea is Vague (\${specificReqs} is 'None provided.' AND \${mustHaves} is 'None provided.'): Ask clarifying questions focused on details needed for estimation (style, key elements). Example: "To help us estimate, could you describe the style you like for the \${category} or any key elements?".
4.  Handle Cover-ups (Revised): IF 'Cover-up/Enhancement' is 'Yes' (\${isCoverUp} is 'Yes'): Generate a reply asking for a clear photo of the *existing tattoo* and any *references for the new design*. Explain this is needed for planning and accurate estimation before the deposit. Example: "For cover-ups, could you please send a clear photo of the existing tattoo, along with your references for the new design? This helps us plan the best approach before confirming the deposit details."
5.  Tone & Format: Replies MUST be polite, receptive, professional, and assuring. Output MUST be ONLY a valid JSON array of up to 5 strings, ordered by likely usefulness. No other text, markdown, or comments.
`.trim();

const PROMPT_DB_ID = "booking_reply_prompt"; // Matches the ID in the DB table

export const AiPromptEditor: React.FC = () => {
  // --- State for AI Prompt Editing ---
  const [currentPrompt, setCurrentPrompt] = useState<string>(""); // Holds the saved prompt
  const [editedPrompt, setEditedPrompt] = useState<string>(""); // Holds text area edits
  const [isPromptLoading, setIsPromptLoading] = useState<boolean>(true);
  const [isPromptSaving, setIsPromptSaving] = useState<boolean>(false);
  const [promptError, setPromptError] = useState<string | null>(null);

  // --- Fetch AI Prompt ---
  const fetchAiPrompt = useCallback(async () => {
    setIsPromptLoading(true);
    setPromptError(null);
    console.log("Fetching AI prompt...");
    try {
      const { data, error: fetchError } = await supabase
        .from("ai_prompts")
        .select("prompt_text")
        .eq("prompt_id", PROMPT_DB_ID)
        .maybeSingle(); // Use maybeSingle to handle null if not found

      if (fetchError) throw fetchError;

      if (data?.prompt_text) {
        console.log("AI Prompt fetched successfully.");
        const fetchedText = data.prompt_text;
        setCurrentPrompt(fetchedText);
        setEditedPrompt(fetchedText); // Initialize editor with fetched prompt
      } else {
        console.log("AI Prompt not found in DB, using default.");
        setCurrentPrompt(DEFAULT_AI_PROMPT); // Use default if not found
        setEditedPrompt(DEFAULT_AI_PROMPT);
        setPromptError("No custom prompt saved yet. Displaying default."); // Inform user
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Unknown error fetching prompt.";
      console.error("Fetch AI Prompt error:", err);
      setPromptError(`Failed to load prompt: ${message}. Using default.`);
      setCurrentPrompt(DEFAULT_AI_PROMPT); // Use default on error
      setEditedPrompt(DEFAULT_AI_PROMPT);
      toast({
        variant: "destructive",
        title: "Error Loading Prompt",
        description: message,
      });
    } finally {
      setIsPromptLoading(false);
    }
  }, []); // No dependencies needed for this version

  // --- Effect to Fetch Data on Mount ---
  useEffect(() => {
    fetchAiPrompt();
  }, [fetchAiPrompt]);

  // --- Save AI Prompt ---
  const handleSavePrompt = useCallback(async () => {
    setIsPromptSaving(true);
    setPromptError(null); // Clear previous errors
    console.log("Saving AI prompt...");
    try {
      const { error: saveError } = await supabase
        .from("ai_prompts")
        .upsert(
          {
            prompt_id: PROMPT_DB_ID,
            prompt_text: editedPrompt,
            updated_at: new Date().toISOString(), // Optionally update timestamp
          },
          { onConflict: "prompt_id" }
        )
        .select()
        .single();

      if (saveError) throw saveError;

      console.log("AI Prompt saved successfully.");
      setCurrentPrompt(editedPrompt); // Update the 'saved' state
      toast({
        title: "AI Prompt Saved",
        description:
          "The prompt for generating booking replies has been updated.",
      });
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Unknown error saving prompt.";
      console.error("Save AI Prompt error:", err);
      setPromptError(`Failed to save prompt: ${message}`);
      toast({
        variant: "destructive",
        title: "Error Saving Prompt",
        description: message,
      });
    } finally {
      setIsPromptSaving(false);
    }
  }, [editedPrompt]); // Depend only on editedPrompt

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>AI Reply Prompt Configuration</CardTitle>
        <CardDescription>
          Edit the template used by the AI to generate reply suggestions. Use
          placeholders like {"${clientName}"}, {"${category}"},{" "}
          {"${estimatedPrice}"}, etc., which the system will replace with actual
          booking data before sending to the AI. Refer to the Edge Function code
          or the default prompt for available placeholders.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isPromptLoading && (
          <div className="flex items-center text-muted-foreground">
            <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Loading prompt...
          </div>
        )}
        {promptError && !isPromptLoading && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Prompt Loading Issue</AlertTitle>
            <AlertDescription>{promptError}</AlertDescription>
          </Alert>
        )}
        {!isPromptLoading && (
          <>
            <div className="grid w-full gap-1.5">
              <Label htmlFor="ai-prompt-textarea">
                Booking Reply Prompt Template
              </Label>
              <Textarea
                id="ai-prompt-textarea"
                placeholder="Enter your AI prompt template here..."
                value={editedPrompt}
                onChange={(e) => setEditedPrompt(e.target.value)}
                rows={20} // Increased rows
                className="font-mono text-xs"
                disabled={isPromptSaving}
              />
              <p className="text-xs text-muted-foreground">
                Remember to use the exact placeholder format, e.g.,{" "}
                {"${clientName}"}.
              </p>
            </div>
            <div className="flex justify-end">
              <Button
                onClick={handleSavePrompt}
                disabled={
                  isPromptLoading ||
                  isPromptSaving ||
                  editedPrompt === currentPrompt
                }
              >
                {isPromptSaving ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                Save Prompt
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

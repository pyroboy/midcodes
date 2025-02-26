<!-- ReadingModal.svelte -->
<script lang="ts">
  import { Input } from '$lib/components/ui/input';
  import { Label } from '$lib/components/ui/label';
  import { Button } from '$lib/components/ui/button';
  import * as Dialog from '$lib/components/ui/dialog';
  import { Check, AlertCircle } from 'lucide-svelte';
  import * as Alert from '$lib/components/ui/alert';
  import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
  } from "$lib/components/ui/select";
  
  interface Meter {
    id: number;
    name: string;
    type: string;
    location_type: 'PROPERTY' | 'FLOOR' | 'RENTAL_UNIT';
    property_id: number | null;
  }
  
  let props = $props();
  
  // Form state
  let selectedMeterId = $state<number | null>(null);
  let readingValue = $state<number | null>(null);
  let readingDate = $state<string>(new Date().toISOString().substring(0, 10)); // Today's date in YYYY-MM-DD
  let isSubmitting = $state(false);
  let errorMessage = $state<string | null>(null);
  let successMessage = $state<string | null>(null);
  
  // Filter meters based on selected property and type
  let relevantMeters = $derived(props.meters.filter((meter: Meter) => {
    const propertyMatch = props.selectedPropertyId ? meter.property_id === props.selectedPropertyId : true;
    const typeMatch = props.selectedType ? meter.type === props.selectedType : true;
    return propertyMatch && typeMatch;
  }));
  
  // Reset form state
  function resetForm() {
    selectedMeterId = null;
    readingValue = null;
    errorMessage = null;
    successMessage = null;
  }
  
  // Handle meter selection
  function handleMeterChange(value: string) {
    selectedMeterId = parseInt(value, 10);
  }
  
  // Handle form submission
  async function handleSubmit() {
    // Validate form
    if (!selectedMeterId) {
      errorMessage = "Please select a meter";
      return;
    }
    
    if (!readingValue || readingValue <= 0) {
      errorMessage = "Please enter a valid reading value";
      return;
    }
    
    if (!readingDate) {
      errorMessage = "Please select a reading date";
      return;
    }
    
    try {
      isSubmitting = true;
      errorMessage = null;
      
      // Submit the form data to the server
      const response = await fetch('?/addReading', {
        method: 'POST',
        body: JSON.stringify({
          meter_id: selectedMeterId,
          reading: readingValue,
          reading_date: readingDate
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to add reading');
      }
      
      // Show success message
      successMessage = "Reading added successfully";
      
      // Reset form after 2 seconds and close modal
      setTimeout(() => {
        resetForm();
        props.onReadingAdded();
        props.onClose();
      }, 2000);
      
    } catch (error: any) {
      errorMessage = error.message || "Failed to add reading";
    } finally {
      isSubmitting = false;
    }
  }
  
  // Clean up when modal closes
  function handleClose() {
    resetForm();
    props.onClose();
  }
</script>

<Dialog.Root open={props.open} onOpenChange={handleClose}>
  <Dialog.Content class="sm:max-w-md">
    <Dialog.Header>
      <Dialog.Title>Add Meter Reading</Dialog.Title>
      <Dialog.Description>
        Enter a new reading for a meter. This will be used for billing calculations.
      </Dialog.Description>
    </Dialog.Header>
    
    {#if errorMessage}
      <Alert.Root variant="destructive" class="mt-2">
        <AlertCircle class="h-4 w-4 mr-2" />
        <Alert.Title>Error</Alert.Title>
        <Alert.Description>{errorMessage}</Alert.Description>
      </Alert.Root>
    {/if}
    
    {#if successMessage}
      <Alert.Root variant="default" class="mt-2 bg-green-50 border-green-200">
        <Check class="h-4 w-4 mr-2 text-green-500" />
        <Alert.Title>Success</Alert.Title>
        <Alert.Description>{successMessage}</Alert.Description>
      </Alert.Root>
    {/if}
    
    <div class="space-y-4 py-4">
      <div class="space-y-2">
        <Label for="meter">Meter</Label>
        <Select 
          type="single" 
          onValueChange={handleMeterChange} 
          value={selectedMeterId?.toString() || undefined}
        >
          <SelectTrigger class="w-full">
            <span>{selectedMeterId 
              ? relevantMeters.find((m: Meter) => m.id === selectedMeterId)?.name || "Select meter" 
              : "Select meter"}
            </span>
          </SelectTrigger>
          <SelectContent>
            {#each relevantMeters as meter}
              <SelectItem value={meter.id.toString()}>{meter.name}</SelectItem>
            {/each}
          </SelectContent>
        </Select>
      </div>
      
      <div class="space-y-2">
        <Label for="reading_value">Reading Value</Label>
        <Input 
          type="number" 
          id="reading_value"
          placeholder="Enter reading value" 
          min="0" 
          step="0.01"
          bind:value={readingValue}
        />
      </div>
      
      <div class="space-y-2">
        <Label for="reading_date">Reading Date</Label>
        <Input 
          type="date" 
          id="reading_date"
          bind:value={readingDate}
        />
      </div>
    </div>
    
    <Dialog.Footer class="flex justify-between">
      <Button variant="outline" onclick={handleClose}>
        Cancel
      </Button>
      <Button 
        type="button" 
        onclick={handleSubmit}
        disabled={isSubmitting}
      >
        {#if isSubmitting}
          <span class="mr-2">Saving...</span>
          <div class="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
        {:else}
          Save Reading
        {/if}
      </Button>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>
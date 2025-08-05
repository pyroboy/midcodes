<script lang="ts">
  import { CalendarIcon } from "lucide-svelte";
  import {
    CalendarDate,
    DateFormatter,
    type DateValue,
    getLocalTimeZone,
    parseDate,
    today
  } from "@internationalized/date";
  import { cn } from "$lib/utils.js";
  import { Button, buttonVariants } from "$lib/components/ui/button/index.js";
  import { Calendar } from "$lib/components/ui/calendar/index.js";
  import * as Popover from "$lib/components/ui/popover/index.js";

  let { 
    value = $bindable(''),
    placeholder = 'Pick a date',
    label = 'Date',
    minValue = undefined,
    maxValue = undefined,
    disabled = false,
    required = false,
    name = 'date',
    id = 'date',
    onChange = undefined
  } = $props<{
    value?: string;
    placeholder?: string;
    label?: string;
    minValue?: CalendarDate;
    maxValue?: CalendarDate;
    disabled?: boolean;
    required?: boolean;
    name?: string;
    id?: string;
    onChange?: (value: string) => void;
  }>();

  const df = new DateFormatter("en-US", {
    dateStyle: "long"
  });

  let dateValue = $derived(value ? parseDate(value) : undefined);
  let placeholderDate = $state<DateValue>(today(getLocalTimeZone()));

  function handleValueChange(v: DateValue | undefined) {
    if (v) {
      value = v.toString();
      onChange?.(value);
    } else {
      value = '';
      onChange?.('');
    }
  }
</script>

<div class="flex flex-col space-y-2">
  <label for={id} class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
    {label}
    {#if required}
      <span class="text-red-500">*</span>
    {/if}
  </label>
  
  <Popover.Root>
    <Popover.Trigger
      class={cn(
        buttonVariants({ variant: "outline" }),
        "w-full justify-start pl-4 text-left font-normal",
        !dateValue && "text-muted-foreground",
        disabled && "cursor-not-allowed opacity-50"
      )}
      disabled={disabled}
    >
      {dateValue
        ? df.format(dateValue.toDate(getLocalTimeZone()))
        : placeholder}
      <CalendarIcon class="ml-auto size-4 opacity-50" />
    </Popover.Trigger>
    <Popover.Content class="w-auto p-0" side="bottom">
      <Calendar
        type="single"
        value={dateValue as DateValue}
        bind:placeholder={placeholderDate}
        minValue={minValue}
        maxValue={maxValue}
        calendarLabel={label}
        onValueChange={handleValueChange}
      />
    </Popover.Content>
  </Popover.Root>
  
  <input 
    type="hidden" 
    {name} 
    {id}
    {value} 
    {required}
  />
</div> 
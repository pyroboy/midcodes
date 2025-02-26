<script lang="ts">
    import { createEventDispatcher } from 'svelte';
    import { Input } from '$lib/components/ui/input';
    import { Label } from '$lib/components/ui/label';
    import { Button } from '$lib/components/ui/button';
    import {
      Select,
      SelectContent,
      SelectItem,
      SelectTrigger,
    } from "$lib/components/ui/select";
    import * as Dialog from '$lib/components/ui/dialog';
    import type { ExportEvent } from './types';
    
    export let open: boolean = false;
    export let fromDate: string = '';
    export let toDate: string = '';
    export let exportFormat: string = 'csv';
    
    const dispatch = createEventDispatcher<{
      close: void;
      export: ExportEvent;
    }>();
    
    function handleExport(): void {
      dispatch('export', {
        format: exportFormat,
        fromDate,
        toDate
      });
    }
    
    function handleClose(): void {
      dispatch('close');
    }
  </script>
  
  <Dialog.Root {open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
    <Dialog.Portal>
      <Dialog.Overlay class="fixed inset-0 bg-black/50 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
      <Dialog.Content class="fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg">
        <Dialog.Header>
          <Dialog.Title>Export Readings</Dialog.Title>
          <Dialog.Description>
            Select the format and date range for the export.
          </Dialog.Description>
        </Dialog.Header>
        <div class="grid gap-4 py-4">
          <div class="grid grid-cols-4 items-center gap-4">
            <Label for="export-format" class="text-right">Format</Label>
            <Select type="single" bind:value={exportFormat}>
              <SelectTrigger class="col-span-3">
                <span>{exportFormat.toUpperCase()}</span>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="csv">CSV</SelectItem>
                <SelectItem value="excel">Excel</SelectItem>
                <SelectItem value="pdf">PDF</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div class="grid grid-cols-4 items-center gap-4">
            <Label for="date-from" class="text-right">From</Label>
            <Input 
              id="date-from" 
              type="date" 
              class="col-span-3" 
              bind:value={fromDate} 
            />
          </div>
          <div class="grid grid-cols-4 items-center gap-4">
            <Label for="date-to" class="text-right">To</Label>
            <Input 
              id="date-to" 
              type="date" 
              class="col-span-3"
              bind:value={toDate}
            />
          </div>
        </div>
        <Dialog.Footer>
          <Button variant="outline" onclick={() => handleClose()}>Cancel</Button>
          <Button onclick={() => handleExport()}>Export</Button>
        </Dialog.Footer>
      </Dialog.Content>
    </Dialog.Portal>
  </Dialog.Root>
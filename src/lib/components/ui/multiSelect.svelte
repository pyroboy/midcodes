<!-- MultiSelect.svelte -->
<script lang="ts">
    import { createEventDispatcher, onMount } from 'svelte';
    import * as Command from '$lib/components/ui/command';
    import * as Popover from '$lib/components/ui/popover';
    import { Button } from '$lib/components/ui/button';
    import { Check, ChevronsUpDown } from 'lucide-svelte';
    import { cn } from '$lib/utils';
  
    export let options: { value: string | number; label: string }[] = [];
    export let selected: (string | number)[] = [];
    export let placeholder = 'Select items...';
    export let multiSelect = true;
  
    let open = false;
    let search = '';
  
    const dispatch = createEventDispatcher();
  
    function handleSelect(value: string | number) {
      console.log('Selecting value:', value);
      if (multiSelect) {
        if (selected.includes(value)) {
          selected = selected.filter((item) => item !== value);
        } else {
          selected = [...selected, value];
        }
      } else {
        selected = [value];
      }
      dispatch('change', selected);
      console.log('Updated selected:', selected);
    }
  
    $: filteredOptions = options.filter((option) =>
      option.label.toLowerCase().includes(search.toLowerCase())
    );
  
    $: {
      if (!multiSelect && selected.length > 1) {
        selected = [selected[0]];
        dispatch('change', selected);
      }
    }
  
    // onMount(() => {
    //   console.log('MultiSelect mounted. Options:', options);
    //   console.log('MultiSelect mounted. Selected:', selected);
    // });
  
    // $: {
    //   console.log('Options changed:', options);
    //   console.log('Selected changed:', selected);
    //   console.log('Filtered options:', filteredOptions);
    // }
  
    function handleOpenChange(isOpen: boolean) {
      open = isOpen;
      console.log('Dropdown open state:', open);
    }
  </script>
  
  <Popover.Root bind:open on:openChange={({ detail }) => handleOpenChange(detail)}>
    <Popover.Trigger asChild let:builder>
      <Button
        builders={[builder]}
        variant="outline"
        role="combobox"
        aria-expanded={open}
        class="w-full justify-between"
      >
        <div class="flex gap-2 justify-start overflow-x-hidden">
          {#if selected.length > 0}
            {#each selected as value}
              <div class="px-2 py-1 rounded-xl border bg-slate-200 text-xs font-medium">
                {options.find((option) => option.value === value)?.label || value}
              </div>
            {/each}
          {:else}
            {placeholder}
          {/if}
        </div>
        <ChevronsUpDown class="ml-2 h-4 w-4 shrink-0 opacity-50" />
      </Button>
    </Popover.Trigger>
    <Popover.Content class="w-[200px] p-0">
      <Command.Root>
        <Command.Input placeholder="Search items..." bind:value={search} />
        <Command.List>
          <Command.Empty>No items found.</Command.Empty>
          {#each filteredOptions as option (option.value)}
            <Command.Item
              value={option.value.toString()}
              onSelect={() => handleSelect(option.value)}
            >
              <Check
                class={cn(
                  "mr-2 h-4 w-4",
                  selected.includes(option.value) ? "opacity-100" : "opacity-0"
                )}
              />
              {option.label}
            </Command.Item>
          {/each}
        </Command.List>
      </Command.Root>
    </Popover.Content>
  </Popover.Root>
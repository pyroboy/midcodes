<script lang="ts">
    import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '$lib/components/ui/select';
    import { Label } from '$lib/components/ui/label';
  
    export let form: any;
    export let errors: any;
    export let field: string;
    export let label: string;
    export let options: { value: string | number; label: string }[];
  
    $: value = $form && $form[field] !== undefined ? $form[field] : '';
  </script>
  
  <div>
    <Label for={field}>{label}</Label>
    <Select onSelectedChange={(selectedValue) => $form[field] = selectedValue}>
      <SelectTrigger>
        <SelectValue placeholder={`Select ${label.toLowerCase()}`} />
      </SelectTrigger>
      <SelectContent>
        {#each options as option}
          <SelectItem value={option.value}>{option.label}</SelectItem>
        {/each}
      </SelectContent>
    </Select>
    {#if $errors && $errors[field]}
      <span class="text-red-500 text-sm">{$errors[field]}</span>
    {/if}
  </div>
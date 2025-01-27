<script lang="ts">
    import { Input } from '$lib/components/ui/input';
    import { Label } from '$lib/components/ui/label';
  
    export let form: any;
    export let errors: any;
    export let field: string;
    export let label: string;
    export let type = 'text';
  
    $: value = $form && $form[field] !== undefined ? $form[field] : '';
  </script>
  
  <div>
    <Label for={field}>{label}</Label>
    <Input {type} id={field} name={field} bind:value on:input={() => $form[field] = value} />
    {#if $errors && $errors[field]}
      <span class="text-red-500 text-sm">{$errors[field]}</span>
    {/if}
  </div>
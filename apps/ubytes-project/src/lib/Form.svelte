<script lang="ts">
    import { superForm } from 'sveltekit-superforms/client';
    import type { SuperValidated } from 'sveltekit-superforms';
  
    export let data: SuperValidated<any>;
    export let action: string;
  
    const { form, errors, enhance, message } = superForm(data);
  </script>
  
  <form {action} method="POST" use:enhance>
    <slot {form} {errors} message={$message} />
  </form>
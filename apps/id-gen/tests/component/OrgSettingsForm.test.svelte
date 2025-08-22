<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type { OrgSettings } from '$lib/schemas/organization.schema';
  
  export let settings: OrgSettings | null = null;
  export let loading: boolean = false;
  export let userRole: string = 'id_gen_user';
  
  const dispatch = createEventDispatcher();
  
  // Check if user can edit settings
  $: canEdit = userRole === 'super_admin' || userRole === 'org_admin';
  
  // Validate settings
  $: isValidSettings = settings && 
    typeof settings.org_id === 'string' && 
    settings.org_id.length > 0 &&
    typeof settings.payments_enabled === 'boolean' &&
    typeof settings.payments_bypass === 'boolean';
  
  // Configuration status text
  $: configurationStatus = (() => {
    if (!settings) return '';
    
    const { payments_enabled, payments_bypass } = settings;
    
    if (!payments_enabled && !payments_bypass) {
      return 'Free tier configuration';
    } else if (payments_enabled && !payments_bypass) {
      return 'Standard paid configuration';
    } else if (!payments_enabled && payments_bypass) {
      return 'Development/testing configuration';
    } else if (payments_enabled && payments_bypass) {
      return 'Premium configuration with bypass';
    }
    
    return '';
  })();
  
  function handlePaymentsToggle(event: Event) {
    if (!settings || !canEdit) return;
    
    const target = event.target as HTMLInputElement;
    dispatch('update', {
      payments_enabled: target.checked,
      payments_bypass: settings.payments_bypass
    });
  }
  
  function handleBypassToggle(event: Event) {
    if (!settings || !canEdit) return;
    
    const target = event.target as HTMLInputElement;
    dispatch('update', {
      payments_enabled: settings.payments_enabled,
      payments_bypass: target.checked
    });
  }
  
  function handleKeyDown(event: KeyboardEvent, action: 'payments' | 'bypass') {
    if (event.key === ' ' || event.key === 'Enter') {
      event.preventDefault();
      const target = event.target as HTMLInputElement;
      target.click();
    }
  }
</script>

<div class="org-settings-form">
  <h2>Organization Payment Settings</h2>
  
  {#if loading}
    <div class="loading">
      <p>Loading settings...</p>
    </div>
  {:else if !settings}
    <div class="no-settings">
      <p>No settings available</p>
    </div>
  {:else if !isValidSettings}
    <div class="validation-error">
      {#if !settings.org_id || settings.org_id.length === 0}
        <p>Invalid organization ID</p>
      {/if}
      {#if typeof settings.payments_enabled !== 'boolean' || typeof settings.payments_bypass !== 'boolean'}
        <p>Invalid payment settings</p>
      {/if}
    </div>
  {:else}
    <form>
      <div class="form-group">
        <label class="toggle-label">
          <input 
            type="checkbox" 
            bind:checked={settings.payments_enabled}
            disabled={!canEdit}
            on:change={handlePaymentsToggle}
            on:keydown={(e) => handleKeyDown(e, 'payments')}
          />
          <span class="toggle-text">Enable Payments</span>
        </label>
        <p class="help-text">
          Controls whether payment processing is active for this organization
        </p>
      </div>
      
      <div class="form-group">
        <label class="toggle-label">
          <input 
            type="checkbox" 
            bind:checked={settings.payments_bypass}
            disabled={!canEdit}
            on:change={handleBypassToggle}
            on:keydown={(e) => handleKeyDown(e, 'bypass')}
          />
          <span class="toggle-text">Payment Bypass</span>
        </label>
        <p class="help-text">
          Allows bypassing payment requirements for development and testing
        </p>
        {#if settings.payments_bypass}
          <div class="warning">
            <p><strong>Warning: Payment bypass is enabled.</strong> This should only be used for development and testing.</p>
          </div>
        {/if}
      </div>
      
      <div class="configuration-status">
        <p><strong>Current Configuration:</strong> {configurationStatus}</p>
      </div>
      
      <div class="metadata">
        <p>
          <strong>Last updated:</strong> 
          {new Date(settings.updated_at).toLocaleString()}
          {#if settings.updated_by}
            by {settings.updated_by}
          {/if}
        </p>
      </div>
    </form>
  {/if}
</div>

<style>
  .org-settings-form {
    max-width: 600px;
    margin: 0 auto;
    padding: 2rem;
  }
  
  .loading, .no-settings, .validation-error {
    text-align: center;
    padding: 2rem;
  }
  
  .validation-error {
    background-color: #fee;
    border: 1px solid #fcc;
    border-radius: 4px;
  }
  
  .form-group {
    margin-bottom: 1.5rem;
  }
  
  .toggle-label {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    cursor: pointer;
  }
  
  .toggle-label input[type="checkbox"]:disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }
  
  .toggle-text {
    font-weight: 500;
    font-size: 1.1rem;
  }
  
  .help-text {
    margin: 0.5rem 0 0 0;
    font-size: 0.9rem;
    color: #666;
  }
  
  .warning {
    margin-top: 0.5rem;
    padding: 0.75rem;
    background-color: #fff3cd;
    border: 1px solid #ffeaa7;
    border-radius: 4px;
    color: #856404;
  }
  
  .configuration-status {
    margin-top: 1.5rem;
    padding: 1rem;
    background-color: #f8f9fa;
    border-radius: 4px;
  }
  
  .metadata {
    margin-top: 1rem;
    font-size: 0.85rem;
    color: #666;
  }
  
  h2 {
    margin-bottom: 1.5rem;
    color: #333;
  }
  
  input[type="checkbox"] {
    width: 1.2rem;
    height: 1.2rem;
  }
</style>

<script lang="ts">
  let { variant = 'full', size = 'default' } = $props();
  
  const variants = {
    full: 'flex items-center gap-3',
    compact: 'flex items-center gap-2',
    icon: 'flex items-center'
  };
  
  const sizes = {
    small: { icon: 'w-6 h-6', text: 'text-lg' },
    default: { icon: 'w-10 h-10', text: 'text-xl' },
    large: { icon: 'w-12 h-12', text: 'text-2xl' }
  };
</script>

<a href="/" class={variants[variant]}>
  <div class="{sizes[size].icon} bg-primary rounded-lg flex items-center justify-center">
    <CreditCard class="h-{size === 'small' ? '4' : size === 'large' ? '7' : '6'} w-{size === 'small' ? '4' : size === 'large' ? '7' : '6'} text-white" />
  </div>
  {#if variant !== 'icon'}
    <span class="{sizes[size].text} font-bold text-gray-900 dark:text-white">
      ID Generator
    </span>
  {/if}
</a>

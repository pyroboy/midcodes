<script lang="ts">
  export let variant: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link' = 'default';
  export let size: 'default' | 'sm' | 'lg' | 'icon' = 'default';
  export let type: 'button' | 'submit' | 'reset' = 'button';
  export let disabled = false;
  export let className: string = '';
  
  const variantClasses = {
    default: 'bg-blue-600 text-white hover:bg-blue-700',
    destructive: 'bg-red-600 text-white hover:bg-red-700',
    outline: 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50',
    secondary: 'bg-gray-600 text-white hover:bg-gray-700',
    ghost: 'text-gray-700 hover:bg-gray-100',
    link: 'text-blue-600 underline hover:text-blue-700'
  };
  
  const sizeClasses = {
    default: 'h-10 px-4 py-2',
    sm: 'h-9 px-3 py-1.5',
    lg: 'h-11 px-8 py-2.5',
    icon: 'h-10 w-10 p-2'
  };
  
  const baseClasses = 'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50';
  
  $: classes = `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`;
</script>

<button
  {type}
  {disabled}
  class={classes}
  on:click
  on:submit
  {...$$restProps}
>
  <slot />
</button>
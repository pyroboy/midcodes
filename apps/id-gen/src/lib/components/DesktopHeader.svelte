<script lang="ts">
  import { Search, Bell, Settings, User, Wallet, Plus, Zap } from 'lucide-svelte';
  import SearchTrigger from './SearchTrigger.svelte';
  import Breadcrumb from './ui/Breadcrumb.svelte';
  import CreditsDisplay from './ui/CreditsDisplay.svelte';
  import { Button } from './ui/button';
  import UserDropdown from './UserDropdown.svelte';
  import ThemeToggle from './ThemeToggle.svelte';
  
  let { user, class: className = '' } = $props();
</script>

<header class="hidden lg:block bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50 {className}">
  <div class="h-16 px-6 flex items-center justify-between">
    <!-- Left: Logo + Search -->
    <div class="flex items-center gap-6 flex-1">
      <!-- Logo -->
      <a href="/" class="flex items-center gap-3">
        <div class="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
          <Wallet class="h-6 w-6 text-white" />
        </div>
        <span class="text-xl font-bold text-gray-900 dark:text-white">
          ID Generator
        </span>
      </a>
      
      <!-- Search - Desktop optimized -->
      <div class="flex-1 max-w-md">
        <SearchTrigger />
      </div>
    </div>
    
    <!-- Right: Actions + User -->
    <div class="flex items-center gap-4">
      <!-- Quick Actions -->
      <div class="flex items-center gap-2">
        <Button variant="outline" size="sm" href="/templates">
          <Plus class="h-4 w-4 mr-2" />
          New Template
        </Button>
        <Button variant="default" size="sm" href="/use-template">
          <Zap class="h-4 w-4 mr-2" />
          Generate ID
        </Button>
      </div>
      
      <!-- Notifications -->
      <Button variant="ghost" size="icon" aria-label="Notifications">
        <Bell class="h-5 w-5" />
      </Button>
      
      <!-- Theme Toggle -->
      <ThemeToggle variant="ghost" />
      
      <!-- Credits -->
      <CreditsDisplay {user} />
      
      <!-- User Menu -->
      <UserDropdown {user} />
    </div>
  </div>
  
  <!-- Breadcrumb row -->
  <div class="px-6 pb-2 border-t border-gray-100 dark:border-gray-800">
    <Breadcrumb />
  </div>
</header>

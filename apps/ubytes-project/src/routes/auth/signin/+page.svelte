<script lang="ts">
  import { enhance } from '$app/forms'
  import type { ActionData } from './$types'
  import { Button } from '$lib/components/ui/button'
  import { Input } from '$lib/components/ui/input'
  import { Card, CardContent } from '$lib/components/ui/card'
  import { Loader2 } from 'lucide-svelte'

  export let form: ActionData
  let isLoading = false
</script>

<div class="min-h-screen w-full relative block md:flex">
  <div class="absolute inset-0 w-full h-full bg-[#ff9933] md:hidden z-0">
    <img 
      src="/images/loginBG.png" 
      alt="UB Days 2024 Logo" 
      class="w-full h-full object-cover"
    />
  </div>

  <div class="w-full md:w-1/2 flex items-center justify-center relative z-30">
    <Card class="w-11/12 md:w-2/3 h-auto md:h-2/3 bg-white/95 shadow-lg rounded-[32px] p-6 md:p-10 my-8 md:my-0">
      <CardContent class="p-4 md:p-8">
        <h1 class="text-4xl md:text-[5.8rem] font-medium text-slate-800 mb-12">Login</h1>
        <form 
          method="POST" 
          use:enhance={() => {
            isLoading = true
            return async ({ update }) => {
              await update()
              isLoading = false
            }
          }} 
          class="space-y-8 flex-grow flex flex-col justify-center"
        >
          <Input 
            id="email"
            name="email"
            type="email"
            required
            placeholder="Email Address"
            class="h-16 md:h-16 px-4 text-base md:text-lg bg-[#EEF2FF] border-none rounded-xl placeholder:text-slate-500"
          />

          <Input 
            id="password"
            name="password"
            type="password"
            required
            placeholder="Password"
            class="h-16 md:h-16 px-4 text-base md:text-lg bg-[#EEF2FF] border-none rounded-xl placeholder:text-slate-500"
          />

          {#if form?.error}
            <p class="text-sm text-red-500">{form.error}</p>
          {/if}

          <Button 
            type="submit" 
            class="w-full h-12 md:h-16 text-lg md:text-xl font-medium bg-[#4285f4] hover:bg-blue-500 text-white rounded-xl mt-8"
            disabled={isLoading}
          >
            {#if isLoading}
              <Loader2 class="mr-2 h-5 w-5 animate-spin" />
              Signing in...
            {:else}
              Sign in
            {/if}
          </Button>
        </form>
      </CardContent>
    </Card>
  </div>

  <div class="hidden md:flex w-1/2 bg-[#ff9933] items-center justify-center relative z-0">
    <img 
      src="/images/loginBG.png" 
      alt="UB Days 2024 Logo" 
      class="w-full h-full object-cover absolute inset-0"
    />
  </div>

  <div class="absolute bottom-0 left-0 right-0 w-full z-20">
    <div class="bg-transparent w-full flex items-center justify-center">
      <img 
        src="/images/footerlogo.png"
        alt="University of Bohol Logo"
        class="w-screen object-cover"
      />
    </div>
  </div>  
</div>
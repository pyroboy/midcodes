<script lang="ts">
  import { Canvas, T } from '@threlte/core';
  import { NoToneMapping } from 'three';
  import { onMount } from 'svelte';
  import { fly, fade } from 'svelte/transition';
  import DigitalCard3D from '$lib/components/DigitalCard3D.svelte';
  import { Button } from '$lib/components/ui/button';
  import { Avatar, AvatarImage, AvatarFallback } from '$lib/components/ui/avatar';
  import { Card, CardContent } from '$lib/components/ui/card';
  import * as Icons from 'lucide-svelte';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();

  let stage = $state<'intro' | 'profile'>('intro');
  let showContent = $state(false);

  // Parse social links if they exist
  // Assuming profile.socials is { twitter: '...', linkedin: '...' } array or object?
  // Schema says jsonb. Let's assume list of { platform: 'twitter', url: '...' }
  // or simple key-value.
  // Implementation Plan: { "socials": [...] }
  
  const socials = $derived(data.profile.socials || []);
  const displayName = $derived(data.profile.displayName || 'Unnamed Profile');
  const bio = $derived(data.profile.bio || '');
  const jobTitle = $derived(data.profile.jobTitle || '');
  
  const frontUrl = $derived(data.cardImages.front);
  const backUrl = $derived(data.cardImages.back);

  function getIcon(platform: string) {
    const p = platform.toLowerCase();
    if (p.includes('twitter') || p.includes('x.com')) return Icons.Twitter;
    if (p.includes('linkedin')) return Icons.Linkedin;
    if (p.includes('github')) return Icons.Github;
    if (p.includes('instagram')) return Icons.Instagram;
    if (p.includes('facebook')) return Icons.Facebook;
    if (p.includes('globe') || p.includes('website')) return Icons.Globe;
    return Icons.Link;
  }

  function downloadVCard() {
     // TODO: Implement VCard generation
     console.log('Downloading VCard...');
  }

  onMount(() => {
    // Start animation sequence
    setTimeout(() => {
      stage = 'profile';
      setTimeout(() => {
        showContent = true;
      }, 500);
    }, 2000);
  });
</script>

<svelte:head>
	<title>{displayName} | Digital ID</title>
</svelte:head>

<div class="fixed inset-0 z-0 bg-neutral-950">
    <Canvas toneMapping={NoToneMapping}>
        <T.PerspectiveCamera makeDefault position={[0, 0, 8]} fov={45} />
        <T.AmbientLight intensity={1.5} />
        <T.DirectionalLight position={[5, 5, 5]} intensity={1} castShadow />
        <T.DirectionalLight position={[-5, 5, -5]} intensity={0.5} />

        {#if frontUrl && backUrl}
            <DigitalCard3D {frontUrl} {backUrl} {stage} />
        {/if}
    </Canvas>
</div>

{#if showContent}
<div class="relative z-10 min-h-screen pt-[40vh] pb-10 px-4 pointer-events-none">
    <div class="max-w-md mx-auto pointer-events-auto" transition:fly={{ y: 50, duration: 800 }}>
        <Card class="bg-black/40 backdrop-blur-xl border-white/10 text-white shadow-2xl overflow-hidden">
            <CardContent class="p-6 md:p-8 flex flex-col items-center text-center gap-4">
                
                <!-- Avatar -->
                <Avatar class="w-24 h-24 border-4 border-white/10 shadow-lg">
                    <AvatarImage src={data.profile.avatar_url} alt={displayName} />
                    <AvatarFallback>{displayName.substring(0,2).toUpperCase()}</AvatarFallback>
                </Avatar>

                <!-- Info -->
                <div class="space-y-1">
                    <h1 class="text-2xl font-bold tracking-tight">{displayName}</h1>
                    {#if jobTitle}
                        <p class="text-neutral-400 font-medium">{jobTitle}</p>
                    {/if}
                </div>

                {#if bio}
                    <p class="text-sm text-neutral-300 max-w-sm leading-relaxed">
                        {bio}
                    </p>
                {/if}

                <!-- Actions -->
                <div class="w-full grid grid-cols-2 gap-3 mt-4">
                    <Button variant="outline" class="w-full bg-white/5 border-white/10 hover:bg-white/10 hover:text-white" onclick={downloadVCard}>
                        <Icons.Contact class="w-4 h-4 mr-2" />
                        Save Contact
                    </Button>
                    <Button variant="default" class="w-full bg-white text-black hover:bg-white/90">
                         <Icons.MessageCircle class="w-4 h-4 mr-2" />
                         Message
                    </Button>
                </div>

                <!-- Socials -->
                {#if socials.length > 0}
                    <div class="flex flex-wrap justify-center gap-3 mt-4">
                        {#each socials as social}
                           {@const Icon = getIcon(social.platform)}
                           <a href={social.url} target="_blank" rel="noopener noreferrer" 
                              class="p-3 rounded-full bg-white/5 hover:bg-white/20 transition-colors text-white border border-white/5">
                               <Icon class="w-5 h-5" />
                           </a>
                        {/each}
                    </div>
                {/if}

            </CardContent>
            
            <!-- Branding Footer -->
             <div class="p-3 bg-white/5 border-t border-white/5 text-center">
                 <p class="text-xs text-neutral-500 flex items-center justify-center gap-1">
                     <Icons.ShieldCheck class="w-3 h-3" />
                     Verified ID
                 </p>
             </div>
        </Card>
    </div>
</div>
{/if}

<script lang="ts">
  import { churches } from './churches';
  import type { Church, Service } from './churches';
  import { Clock, Users, Heart, Phone, Mail, Facebook, Instagram, Youtube } from 'lucide-svelte';
  import { Card } from '$lib/components/ui/card';
  import * as Accordion from '$lib/components/ui/accordion';

  function formatTime(time: string) {
    return new Date(`2000-01-01T${time}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: 'numeric'
    });
  }

  function formatNumber(num: number) {
    return new Intl.NumberFormat('en-US').format(num);
  }

  function groupServicesByDay(services: Service[]) {
    return services.reduce((acc, service) => {
      if (!acc[service.day]) {
        acc[service.day] = [];
      }
      acc[service.day].push(service);
      return acc;
    }, {} as Record<string, Service[]>);
  }
</script>

<svelte:head>
  <title>Our Churches - Grace Community Church</title>
  <meta name="description" content="Explore our church locations and communities" />
</svelte:head>

{#snippet church(c: Church)}
  <Card class="w-full max-w-6xl bg-white shadow-lg rounded-lg overflow-hidden">
    <!-- Mobile Layout -->
    <div class="md:hidden">
      <div class="relative h-48 bg-gray-200">
        <img 
          src="/api/placeholder/400/500"
          alt="Church building"
          class="w-full h-full object-cover"
        />
        <div class="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4">
          <h2 class="text-xl font-bold text-white mb-1">{c.name}</h2>
          <p class="text-sm text-gray-200">{c.address.street}, {c.address.city}</p>
        </div>
      </div>

      <div class="p-4 space-y-4">
        <!-- Contact Info -->
        <div class="space-y-2.5">
          <div class="flex items-center text-sm text-gray-600">
            <div class="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center shrink-0">
              <Phone class="w-4 h-4 text-red-600" />
            </div>
            <a href="tel:{c.contact.phone}" class="ml-2 hover:text-red-600 transition-colors">{c.contact.phone}</a>
          </div>
          <div class="flex items-center text-sm text-gray-600">
            <div class="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center shrink-0">
              <Mail class="w-4 h-4 text-red-600" />
            </div>
            <a href="mailto:{c.contact.email}" class="ml-2 hover:text-red-600 transition-colors truncate">{c.contact.email}</a>
          </div>
        </div>
        <!-- Social Icons -->
        <div class="flex gap-4">
          <a href="https://facebook.com/{c.contact.social.facebook}" class="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center text-gray-500 hover:text-red-600 hover:bg-red-100 transition-colors">
            <Facebook class="w-4 h-4" />
          </a>
          <a href="https://instagram.com/{c.contact.social.instagram}" class="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center text-gray-500 hover:text-red-600 hover:bg-red-100 transition-colors">
            <Instagram class="w-4 h-4" />
          </a>
          <a href="https://youtube.com/{c.contact.social.youtube}" class="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center text-gray-500 hover:text-red-600 hover:bg-red-100 transition-colors">
            <Youtube class="w-4 h-4" />
          </a>
        </div>

        <!-- Weekly Schedule Title -->

        <!-- Schedule Accordion -->
        <Accordion.Root type="single" class="w-full">
          <Accordion.Item value="schedule">
            <Accordion.Trigger class="w-full py-2 group">
              <div class="flex justify-center w-full">
                <div class="flex justify-between w-[320px] rounded-lg px-4 py-2">
                  {#each [
                    { day: 'Sunday', letter: 'S' },
                    { day: 'Monday', letter: 'M' },
                    { day: 'Tuesday', letter: 'T' },
                    { day: 'Wednesday', letter: 'W' },
                    { day: 'Thursday', letter: 'T' },
                    { day: 'Friday', letter: 'F' },
                    { day: 'Saturday', letter: 'S' }
                  ] as { day, letter }}
                    {@const hasSchedule = groupServicesByDay(c.services)[day] !== undefined}
                    <div class="flex flex-col items-center gap-2">
                      <span class="text font-black {hasSchedule ? 'text-black font-black' : 'text-gray-400'}">{letter}</span>
                    </div>
                  {/each}
                </div>
              </div>
            </Accordion.Trigger>
            <Accordion.Content>
              <div class="pt-2 pb-4">
                <!-- Schedule Cards -->
                <div class="overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                  <div class="flex gap-3 min-w-max">
                    {#each Object.entries(groupServicesByDay(c.services)) as [day, services]}
                      <div class="bg-red-50 rounded-lg p-3 w-36">
                        <div class="text-sm font-semibold text-red-800 mb-2">
                          {day}
                        </div>
                        {#each services as service}
                          <div class="mb-2 last:mb-0">
                            <div class="text-sm font-medium text-red-700">
                              {formatTime(service.time)}
                            </div>
                            <div class="text-xs text-red-600 capitalize">
                              {service.type.replace('-', ' ')}
                            </div>
                          </div>
                        {/each}
                      </div>
                    {/each}
                  </div>
                </div>
              </div>
            </Accordion.Content>
          </Accordion.Item>
        </Accordion.Root>

        <!-- Leadership -->
        <div class="space-y-2">
          <h3 class="text-sm font-medium">Leadership</h3>
          <div class="space-y-2">
            {#each c.pastors as pastor}
              <div class="text-sm">
                <div class="font-medium text-gray-900">{pastor.name}</div>
                <div class="text-xs text-gray-600">
                  {pastor.role} • Since {pastor.since}
                </div>
              </div>
            {/each}
          </div>
        </div>

        <!-- Stats -->
        <div class="grid grid-cols-2 gap-2">
          <div class="bg-red-50 rounded-md p-2 text-center">
            <div class="text-sm font-bold text-red-700">
              {formatNumber(c.stats.totalMembers)}
            </div>
            <div class="text-xs text-red-600">Members</div>
          </div>
          <div class="bg-red-50 rounded-md p-2 text-center">
            <div class="text-sm font-bold text-red-700">
              {c.stats.yearFounded}
            </div>
            <div class="text-xs text-red-600">Est. Year</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Desktop Layout -->
    <div class="hidden md:flex h-full">
      <!-- Left side - Image -->
      <div class="w-1/4 bg-gray-200">
        <img 
          src="/api/placeholder/400/500"
          alt="Church building"
          class="w-full h-full object-cover"
        />
      </div>

      <!-- Middle section - Weekly Schedule -->
      <div class="w-2/4 p-6 border-r border-gray-200">
        <div class="mb-4">
          <h2 class="text-2xl font-bold text-black mb-1">{c.name}</h2>
          <p class="text-sm text-gray-600">{c.address.street}, {c.address.city}</p>
          <div class="flex items-center gap-4 mt-2">
            <div class="flex items-center text-sm text-gray-600">
              <Phone class="w-4 h-4 mr-1 text-black" />
              <a href="tel:{c.contact.phone}" class="hover:text-red-600">{c.contact.phone}</a>
            </div>
            <div class="flex items-center text-sm text-gray-600">
              <Mail class="w-4 h-4 mr-1 text-black" />
              <a href="mailto:{c.contact.email}" class="hover:text-red-600">{c.contact.email}</a>
            </div>
          </div>
        </div>

        <div class="mt-6">
          <!-- Day Indicators -->
          <div class="flex justify-between mb-4 w-full border-b border-gray-200  px-5 pt-3 pb-2">
            {#each [
              { day: 'Sunday', letter: 'Sun' },
              { day: 'Monday', letter: 'Mon' },
              { day: 'Tuesday', letter: 'Tue' },
              { day: 'Wednesday', letter: 'Wed' },
              { day: 'Thursday', letter: 'Thu' },
              { day: 'Friday', letter: 'Fri' },
              { day: 'Saturday', letter: 'Sat' }
            ] as { day, letter }}
              {@const hasSchedule = groupServicesByDay(c.services)[day] !== undefined}
              <div class="flex flex-col items-center gap-2">
                <span class="text font-black {hasSchedule ? 'text-black font-black' : 'text-gray-400'}">{letter}</span>
              </div>
            {/each}
          </div>

          <!-- Schedule Cards -->
          <div class="overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            <div class="flex gap-3 min-w-max">
              {#each Object.entries(groupServicesByDay(c.services)) as [day, services]}
                <div class="bg-red-50 rounded-lg p-3 w-40">
                  <div class="text-sm font-semibold text-red-800 mb-2">
                    {day}
                  </div>
                  {#each services as service}
                    <div class="mb-2 last:mb-0">
                      <div class="text-sm font-medium text-red-700">
                        {formatTime(service.time)}
                      </div>
                      <div class="text-xs text-red-600 capitalize">
                        {service.type.replace('-', ' ')}
                      </div>
                    </div>
                  {/each}
                </div>
              {/each}
            </div>
          </div>
        </div>
      </div>

      <!-- Right section - Leadership & Stats -->
      <div class="w-1/4 p-6">
        <!-- Social Icons -->
        <div class="flex justify-end gap-3 mb-6">
          <a href="https://facebook.com/{c.contact.social.facebook}" class="text-gray-500 hover:text-red-600">
            <Facebook class="w-5 h-5" />
          </a>
          <a href="https://instagram.com/{c.contact.social.instagram}" class="text-gray-500 hover:text-red-600">
            <Instagram class="w-5 h-5" />
          </a>
          <a href="https://youtube.com/{c.contact.social.youtube}" class="text-gray-500 hover:text-red-600">
            <Youtube class="w-5 h-5" />
          </a>
        </div>

        <!-- Leadership -->
        <div class="mb-6">
          <div class="space-y-3">
            {#each c.pastors as pastor}
              <div class="text-sm">
                <div class="font-medium text-gray-900">{pastor.name}</div>
                <div class="text-xs text-gray-600">
                  {pastor.role} • Since {pastor.since}
                </div>
              </div>
            {/each}
          </div>
        </div>

        <!-- Stats -->
        <div class="grid grid-cols-2 gap-2">
          <div class="bg-red-50 rounded-md p-2 text-center">
            <div class="text-sm font-bold text-red-700">
              {formatNumber(c.stats.totalMembers)}
            </div>
            <div class="text-xs text-red-600">Members</div>
          </div>
          <div class="bg-red-50 rounded-md p-2 text-center">
            <div class="text-sm font-bold text-red-700">
              {c.stats.yearFounded}
            </div>
            <div class="text-xs text-red-600">Est. Year</div>
          </div>
        </div>
      </div>
    </div>
  </Card>
{/snippet}

<div class="p-6">
  <h1 class="text-2xl font-bold text-center text-red-600 mb-8">Our Church Locations</h1>

  <div class="space-y-6">
    {#each churches as c}
      {@render church(c)}
    {/each}
  </div>
</div>
<script lang="ts">
  import { churches } from './churches';
  import type { Church, Service } from './churches';
  import { Clock, Users, Phone, Mail, Facebook, Instagram, Youtube, MapPin, Search } from 'lucide-svelte';
  import Hero from '$lib/components/Hero.svelte';

  let searchQuery = '';

  $: filteredChurches = churches.filter(church => {
    const query = searchQuery.toLowerCase();
    return (
      church.name.toLowerCase().includes(query) ||
      church.address.city.toLowerCase().includes(query) ||
      church.address.province.toLowerCase().includes(query) ||
      church.pastors.some(p => p.name.toLowerCase().includes(query))
    );
  });

  function formatNumber(num: number) {
    return new Intl.NumberFormat('en-US').format(num);
  }

  function groupServicesByDay(services: Service[]) {
    const order = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return services.reduce((acc, service) => {
      if (!acc[service.day]) {
        acc[service.day] = [];
      }
      acc[service.day].push(service);
      return acc;
    }, {} as Record<string, Service[]>);
  }

  function getGoogleMapsUrl(church: Church) {
    const query = encodeURIComponent(`${church.name} ${church.address.street} ${church.address.city} ${church.address.province}`);
    return `https://www.google.com/maps/search/?api=1&query=${query}`;
  }
</script>

<svelte:head>
  <title>Our Churches - March of Faith Incorporated</title>
  <meta name="description" content="Explore our church locations and communities across Bohol and Negros Oriental, Philippines" />
  <meta property="og:title" content="Our Churches - March of Faith Incorporated" />
  <meta property="og:description" content="Find a March of Faith church near you. Explore our locations across Bohol and Negros Oriental." />
  <meta name="twitter:title" content="Our Churches - March of Faith Incorporated" />
  <meta name="twitter:description" content="Find a March of Faith church near you across the Philippines." />
</svelte:head>

{#snippet church(c: Church)}
  <div class="group relative bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-500 border border-gray-100">
    <div class="flex flex-col md:flex-row h-full">
      <!-- Image Section -->
      <div class="w-full md:w-2/5 lg:w-1/3 relative overflow-hidden min-h-[250px] md:min-h-full">
        <img 
          src="/api/placeholder/800/600"
          alt="{c.name} building"
          class="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
        <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent md:bg-gradient-to-r md:from-transparent md:to-transparent"></div>
        
        <!-- Mobile Overlay Content -->
        <div class="absolute bottom-0 left-0 right-0 p-6 md:hidden text-white">
          <h2 class="text-2xl font-bold mb-2 font-serif">{c.name}</h2>
          <div class="flex items-center text-gray-200 text-sm">
            <MapPin class="w-4 h-4 mr-1" />
            {c.address.city}, {c.address.province}
          </div>
        </div>
      </div>

      <!-- Content Section -->
      <div class="flex-1 p-6 md:p-8 lg:p-10 flex flex-col">
        <!-- Header (Desktop) -->
        <div class="hidden md:block mb-6">
          <div class="flex justify-between items-start">
            <div>
              <h2 class="text-3xl font-bold text-gray-900 mb-2 font-serif">{c.name}</h2>
              <div class="flex items-center text-gray-500">
                <MapPin class="w-4 h-4 mr-1.5 text-[#981B1E]" />
                {c.address.street}, {c.address.city}, {c.address.province}
              </div>
            </div>
            <div class="flex gap-2">
              {#if c.contact.social.facebook}
                <a href="https://facebook.com/{c.contact.social.facebook}" target="_blank" rel="noopener noreferrer" class="p-2 rounded-full bg-gray-50 text-gray-400 hover:bg-[#981B1E] hover:text-white transition-colors">
                  <Facebook class="w-5 h-5" />
                </a>
              {/if}
              {#if c.contact.social.instagram}
                <a href="https://instagram.com/{c.contact.social.instagram}" target="_blank" rel="noopener noreferrer" class="p-2 rounded-full bg-gray-50 text-gray-400 hover:bg-[#981B1E] hover:text-white transition-colors">
                  <Instagram class="w-5 h-5" />
                </a>
              {/if}
              {#if c.contact.social.youtube}
                <a href="https://youtube.com/{c.contact.social.youtube}" target="_blank" rel="noopener noreferrer" class="p-2 rounded-full bg-gray-50 text-gray-400 hover:bg-[#981B1E] hover:text-white transition-colors">
                  <Youtube class="w-5 h-5" />
                </a>
              {/if}
            </div>
          </div>
        </div>

        <div class="grid md:grid-cols-2 gap-8 lg:gap-12 flex-1">
          <!-- Schedule -->
          <div class="space-y-4">
            <div class="flex items-center gap-2 text-[#981B1E] font-semibold border-b border-gray-100 pb-2 mb-4">
              <Clock class="w-5 h-5" />
              <span>Service Schedule</span>
            </div>
            
            <div class="space-y-3">
              {#each Object.entries(groupServicesByDay(c.services)) as [day, services]}
                <div class="relative pl-4 border-l-2 border-gray-100 hover:border-[#981B1E] transition-colors">
                  <span class="text-sm font-bold text-gray-900 block mb-1">{day}</span>
                  <div class="space-y-1">
                    {#each services as service}
                      <div class="flex flex-col text-sm">
                        <span class="text-gray-600 font-medium">{service.time}</span>
                        <span class="text-xs text-[#981B1E] uppercase tracking-wider">
                          {service.type}
                        </span>
                      </div>
                    {/each}
                  </div>
                </div>
              {/each}
            </div>
          </div>

          <!-- Info & Contact -->
          <div class="flex flex-col justify-between space-y-6">
            <!-- Leadership -->
            <div>
              <div class="flex items-center gap-2 text-[#981B1E] font-semibold border-b border-gray-100 pb-2 mb-4">
                <Users class="w-5 h-5" />
                <span>Leadership</span>
              </div>
              <div class="space-y-3">
                {#each c.pastors as pastor}
                  <div class="flex items-start gap-3">
                    <div class="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center shrink-0 text-gray-500 font-serif font-bold">
                      {pastor.name[0]}
                    </div>
                    <div>
                      <div class="text-sm font-medium text-gray-900">{pastor.name}</div>
                      <div class="text-xs text-gray-500">{pastor.role}</div>
                    </div>
                  </div>
                {/each}
              </div>
            </div>

            <!-- Contact Actions -->
            <div class="space-y-3 pt-4 md:pt-0">
              <div class="flex flex-col gap-2">
                <a 
                  href="tel:{c.contact.phone}" 
                  class="flex items-center gap-3 text-sm text-gray-600 hover:text-[#981B1E] transition-colors p-2 rounded-lg hover:bg-red-50 group/item"
                >
                  <Phone class="w-4 h-4 text-gray-400 group-hover/item:text-[#981B1E]" />
                  {c.contact.phone}
                </a>
                <a 
                  href="mailto:{c.contact.email}" 
                  class="flex items-center gap-3 text-sm text-gray-600 hover:text-[#981B1E] transition-colors p-2 rounded-lg hover:bg-red-50 group/item"
                >
                  <Mail class="w-4 h-4 text-gray-400 group-hover/item:text-[#981B1E]" />
                  {c.contact.email}
                </a>
              </div>
              
              <a 
                href={getGoogleMapsUrl(c)}
                target="_blank"
                rel="noopener noreferrer"
                class="inline-flex items-center justify-center w-full px-4 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-[#981B1E] transition-colors gap-2 shadow-lg shadow-gray-200"
              >
                <MapPin class="w-4 h-4" />
                Get Directions
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
{/snippet}

<Hero subtitle="Find your spiritual home in one of our communities">
  Our Churches
</Hero>

<section class="py-16 md:py-24 bg-gray-50/50">
  <div class="container mx-auto px-4 md:px-6">
    <div class="max-w-2xl mx-auto text-center mb-16">
      <h2 class="text-3xl md:text-4xl font-bold text-gray-900 mb-4 font-serif">Join Us This Week</h2>
      <p class="text-gray-600 leading-relaxed mb-8">
        We have multiple locations across the region. Each campus offers a welcoming atmosphere, 
        engaging worship, and biblical teaching. We'd love to host you!
      </p>
      
      <!-- Search Bar -->
      <div class="relative max-w-md mx-auto">
        <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search class="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          bind:value={searchQuery}
          placeholder="Search by location, church name, or pastor..."
          class="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-full leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:border-[#981B1E] focus:ring-1 focus:ring-[#981B1E] sm:text-sm shadow-sm transition-all"
        />
      </div>
    </div>

    <div class="space-y-8 md:space-y-12 max-w-6xl mx-auto">
      {#if filteredChurches.length > 0}
        {#each filteredChurches as c (c.id)}
          {@render church(c)}
        {/each}
      {:else}
        <div class="text-center py-12">
          <p class="text-gray-500 text-lg">No churches found matching your search.</p>
        </div>
      {/if}
    </div>
  </div>
</section>

<style>
  :global(body) {
    background-color: #f9fafb;
  }
</style>
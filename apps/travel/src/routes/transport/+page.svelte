<script lang="ts">
  const services = [
    {
      title: "Airport Transfer",
      description: "Direct transfer from Tagbilaran Airport to our resort",
      price: "$50",
      image: "https://picsum.photos/800/600?random=15",
      features: ["Air-conditioned vehicle", "Professional driver", "Meet & greet service"]
    },
    {
      title: "Island Ferry Service",
      description: "Regular ferry service between Cabilao and mainland Bohol",
      price: "$25",
      image: "https://picsum.photos/800/600?random=16",
      features: ["Multiple daily trips", "Safe and comfortable", "Luggage assistance"]
    },
    {
      title: "Private Boat Charter",
      description: "Exclusive boat service for island hopping or custom trips",
      price: "$199",
      image: "https://picsum.photos/800/600?random=17",
      features: ["Customizable itinerary", "Experienced crew", "Refreshments included"]
    }
  ];
</script>

<div class="min-h-screen bg-white">
  <div class="relative h-[60vh] overflow-hidden">
    <img 
      src="https://picsum.photos/1920/1080?random=18" 
      alt="Transport hero"
      class="w-full h-full object-cover"
    />
    <div class="absolute inset-0 bg-black/50 flex items-center justify-center">
      <div class="text-center text-white">
        <h1 class="text-5xl font-bold mb-4">Transportation Services</h1>
        <p class="text-xl opacity-90">Seamless travel to and around Cabilao Island</p>
      </div>
    </div>
  </div>

  <div class="max-w-7xl mx-auto px-4 py-16">
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {#each services as service}
        <div class="bg-white rounded-lg shadow-lg overflow-hidden">
          <img 
            src={service.image} 
            alt={service.title}
            class="w-full h-48 object-cover"
          />
          <div class="p-6">
            <h3 class="text-2xl font-bold mb-2">{service.title}</h3>
            <p class="text-gray-600 mb-4">{service.description}</p>
            <ul class="space-y-2 mb-4">
              {#each service.features as feature}
                <li class="flex items-center text-gray-600">
                  <span class="text-blue-600 mr-2">✓</span>
                  {feature}
                </li>
              {/each}
            </ul>
            <div class="flex justify-between items-center">
              <span class="text-2xl font-bold text-blue-600">{service.price}</span>
              <button class="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors">
                Book Now
              </button>
            </div>
          </div>
        </div>
      {/each}
    </div>
  </div>
</div>
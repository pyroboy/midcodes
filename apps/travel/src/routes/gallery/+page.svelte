<script>
  const galleries = [
    {
      id: 1,
      title: "Azure Cliff Paradise",
      image: "https://picsum.photos/800/1200?random=1"
    },
    {
      id: 2,
      title: "Sunset Point Diving",
      image: "https://picsum.photos/800/800?random=2"
    },
    {
      id: 3,
      title: "Tropical Lagoon Jump",
      image: "https://picsum.photos/800/600?random=3"
    },
    {
      id: 4,
      title: "Ancient Cave Diving",
      image: "https://picsum.photos/800/1000?random=4"
    },
    {
      id: 5,
      title: "Volcanic Rock Platform",
      image: "https://picsum.photos/800/900?random=5"
    },
    {
      id: 6,
      title: "Ocean Vista Point",
      image: "https://picsum.photos/800/700?random=6"
    },
    {
      id: 7,
      title: "Sunset Cove",
      image: "https://picsum.photos/800/1100?random=7"
    },
    {
      id: 8,
      title: "Crystal Bay",
      image: "https://picsum.photos/800/850?random=8"
    },
    {
      id: 9,
      title: "Hidden Beach",
      image: "https://picsum.photos/800/950?random=9"
    },
    {
      id: 10,
      title: "Paradise Point",
      image: "https://picsum.photos/800/750?random=10"
    },
    {
      id: 11,
      title: "Blue Lagoon",
      image: "https://picsum.photos/800/1000?random=11"
    },
    {
      id: 12,
      title: "Secret Cove",
      image: "https://picsum.photos/800/800?random=12"
    },
    {
      id: 13,
      title: "Mountain View Resort",
      image: "https://picsum.photos/800/1300?random=13"
    },
    {
      id: 14,
      title: "Beachfront Villa",
      image: "https://picsum.photos/800/950?random=14"
    },
    {
      id: 15,
      title: "Infinity Pool",
      image: "https://picsum.photos/800/700?random=15"
    },
    {
      id: 16,
      title: "Garden Restaurant",
      image: "https://picsum.photos/800/1100?random=16"
    },
    {
      id: 17,
      title: "Spa Retreat",
      image: "https://picsum.photos/800/850?random=17"
    },
    {
      id: 18,
      title: "Sunset Bar",
      image: "https://picsum.photos/800/1000?random=18"
    },
    {
      id: 19,
      title: "Private Beach",
      image: "https://picsum.photos/800/900?random=19"
    },
    {
      id: 20,
      title: "Yoga Pavilion",
      image: "https://picsum.photos/800/750?random=20"
    }
  ];

  // Split galleries into 4 columns
  const column1 = galleries.filter((_, i) => i % 4 === 0);
  const column2 = galleries.filter((_, i) => i % 4 === 1);
  const column3 = galleries.filter((_, i) => i % 4 === 2);
  const column4 = galleries.filter((_, i) => i % 4 === 3);
</script>

<div class="min-h-screen bg-white">
  <!-- Hero Section -->
  <div class="relative h-[60vh] overflow-hidden">
    <img 
      src="https://picsum.photos/1920/1080?random=hero" 
      alt="Gallery hero"
      class="w-full h-full object-cover"
    />
    <div class="absolute inset-0 bg-black/50 flex items-center justify-center">
      <div class="text-center text-white">
        <h1 class="text-5xl font-bold mb-4">Our Gallery</h1>
        <p class="text-xl opacity-90">Capturing moments of paradise</p>
      </div>
    </div>
  </div>

  <!-- Gallery Grid -->
  <div class="max-w-7xl mx-auto px-4 py-16">
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div class="grid gap-4">
        {#each column1 as item}
          <div class="overflow-hidden rounded-lg">
            <img 
              class="h-auto max-w-full rounded-lg transition-all duration-300 hover:scale-105" 
              src={item.image} 
              alt={item.title}
            />
          </div>
        {/each}
      </div>
      <div class="grid gap-4">
        {#each column2 as item}
          <div class="overflow-hidden rounded-lg">
            <img 
              class="h-auto max-w-full rounded-lg transition-all duration-300 hover:scale-105" 
              src={item.image} 
              alt={item.title}
            />
          </div>
        {/each}
      </div>
      <div class="grid gap-4">
        {#each column3 as item}
          <div class="overflow-hidden rounded-lg">
            <img 
              class="h-auto max-w-full rounded-lg transition-all duration-300 hover:scale-105" 
              src={item.image} 
              alt={item.title}
            />
          </div>
        {/each}
      </div>
      <div class="grid gap-4">
        {#each column4 as item}
          <div class="overflow-hidden rounded-lg">
            <img 
              class="h-auto max-w-full rounded-lg transition-all duration-300 hover:scale-105" 
              src={item.image} 
              alt={item.title}
            />
          </div>
        {/each}
      </div>
    </div>
  </div>
</div>
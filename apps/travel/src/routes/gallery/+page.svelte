<script>
    import { onMount } from 'svelte';
    
    let isIntersecting = false;
    
    const galleries = [
      {
        id: 1,
        title: "Azure Cliff Paradise",
        description: "Experience the thrill of diving from our 40-meter platform into crystal clear waters. Perfect for both beginners and experienced divers.",
        image: "https://picsum.photos/800/600?random=1",
        location: "Mediterranean Coast"
      },
      {
        id: 2,
        title: "Sunset Point Diving",
        description: "Our signature spot where the sun meets the sea. Featuring multiple diving platforms and professional instructors.",
        image: "https://picsum.photos/800/600?random=2",
        location: "Pacific Rim"
      },
      {
        id: 3,
        title: "Tropical Lagoon Jump",
        description: "Surrounded by lush vegetation, this natural formation offers a unique diving experience into turquoise waters.",
        image: "https://picsum.photos/800/600?random=3",
        location: "Caribbean Islands"
      },
      {
        id: 4,
        title: "Ancient Cave Diving",
        description: "Dive through historical caves and experience the rush of adrenaline in our most challenging location.",
        image: "https://picsum.photos/800/600?random=4",
        location: "Mediterranean Coast"
      },
      {
        id: 5,
        title: "Volcanic Rock Platform",
        description: "Built on ancient volcanic formations, this spot offers breathtaking views and exciting diving opportunities.",
        image: "https://picsum.photos/800/600?random=5",
        location: "Pacific Islands"
      },
      {
        id: 6,
        title: "Ocean Vista Point",
        description: "Our highest platform with panoramic ocean views. For experienced divers seeking the ultimate thrill.",
        image: "https://picsum.photos/800/600?random=6",
        location: "Atlantic Coast"
      }
    ];
  </script>
  
  <div class="min-h-screen bg-gradient-to-b from-blue-50 to-white">
    <!-- Hero Section -->
    <div class="relative h-96 overflow-hidden">
      <img 
        src="https://fastly.picsum.photos/id/865/1920/1080.jpg?hmac=6r3QuP0fPQ_Ydr1L68QjchpBzZ7n5IKmrL9PPMH65YA" 
        alt="Hero cliff diving" 
        class="w-full h-full object-cover"
      />
      <div class="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center">
        <div class="text-center">
          <h1 class="text-4xl md:text-6xl font-bold text-white mb-4">
            Extreme Heights, Perfect Dives
          </h1>
          <p class="text-xl text-white opacity-90">
            Discover the world's most breathtaking cliff diving locations
          </p>
        </div>
      </div>
    </div>
  
    <!-- Gallery Grid -->
    <div class="max-w-7xl mx-auto px-4 py-16">
      <h2 class="text-3xl font-bold text-gray-900 mb-8 text-center">
        Our Diving Locations
      </h2>
      
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {#each galleries as gallery (gallery.id)}
          <div 
            class="group bg-white rounded-lg overflow-hidden shadow-lg transform transition-all duration-300 hover:-translate-y-2 hover:shadow-xl"
          >
            <div class="relative h-64 overflow-hidden">
              <img 
                src={gallery.image} 
                alt={gallery.title}
                class="w-full h-full object-cover transform transition-transform duration-300 group-hover:scale-110"
              />
              <div class="absolute top-4 right-4 bg-white py-1 px-3 rounded-full text-sm font-medium text-gray-700">
                {gallery.location}
              </div>
            </div>
            
            <div class="p-6">
              <h3 class="text-xl font-bold text-gray-900 mb-2">
                {gallery.title}
              </h3>
              <p class="text-gray-600">
                {gallery.description}
              </p>
              
              <button class="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200">
                Explore Location
              </button>
            </div>
          </div>
        {/each}
      </div>
    </div>
  
    <!-- Call to Action -->
    <div class="bg-blue-600 py-16">
      <div class="max-w-7xl mx-auto px-4 text-center">
        <h2 class="text-3xl font-bold text-white mb-4">
          Ready for Your Next Adventure?
        </h2>
        <p class="text-xl text-blue-100 mb-8">
          Book your cliff diving experience today and create unforgettable memories
        </p>
        <button class="inline-flex items-center px-8 py-3 border-2 border-white text-lg font-medium rounded-md text-white hover:bg-white hover:text-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white transition-colors duration-200">
          Start Planning
        </button>
      </div>
    </div>
  </div>
  
  <style>
    /* Any additional custom styles can go here */
  </style>
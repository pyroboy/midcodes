<script lang="ts">
 const experiences = [
  {
    id: 1,
    title: "Cabilao Lighthouse Cliff Diving",
    description: "Experience the thrill of cliff diving near the historic Cabilao lighthouse, with heights ranging from 5 to 12 meters above crystal clear waters.",
    price: 1500, // PHP 1,500
    duration: "3 Hours",
    includes: [
      "Safety briefing and training",
      "Professional diving instructor",
      "Safety gear",
      "Basic cliff diving techniques",
      "Fresh coconut drink"
    ],
      image: "https://picsum.photos/800/600?random=120"
  },
  {
    id: 2,
    title: "Cabilao Wall Dive Adventure",
    description: "Explore Cabilao's famous wall diving spot, home to rare critters, sea snakes, and schooling jacks.",
    price: 3500, // PHP 3,500
    duration: "4 Hours",
    includes: [
      "PADI-certified dive master",
      "Complete diving equipment",
      "Underwater photography",
      "Marine life briefing",
      "Surface interval snacks"
    ],
     image: "https://picsum.photos/800/600?random=140"
  },
  {
    id: 3,
    title: "Lighthouse Point Night Dive",
    description: "Discover Cabilao's nocturnal marine life including rare mandarin fish and feeding cuttlefish near the lighthouse area.",
    price: 4000, // PHP 4,000
    duration: "3 Hours",
    includes: [
      "Night diving equipment",
      "Underwater torch",
      "Expert night dive guide",
      "Hot drinks post-dive",
      "Night marine life briefing"
    ],
      image: "https://picsum.photos/800/600?random=150"
  },
  {
    id: 4,
    title: "Cabilao Island Snorkeling Tour",
    description: "Perfect for non-divers, explore Cabilao's vibrant reef systems and marine sanctuaries through snorkeling.",
    price: 1200, // PHP 1,200
    duration: "3 Hours",
    includes: [
      "Snorkeling equipment",
      "Local marine guide",
      "Reef fish identification guide",
      "Fresh tropical fruits",
      "Marine sanctuary fees"
    ],
       image: "https://picsum.photos/800/600?random=105"
  },
  {
    id: 5,
    title: "Cambaquiz Dive Site Experience",
    description: "Visit Cabilao's premier dive site known for hammerhead shark sightings and rich marine biodiversity.",
    price: 3800, // PHP 3,800
    duration: "4 Hours",
    includes: [
      "2 tank dive package",
      "Professional dive guide",
      "Full equipment rental",
      "Surface interval with snacks",
      "Dive site briefing"
    ],
      image: "https://picsum.photos/800/600?random=101"
  },
  {
    id: 6,
    title: "Sunset Beach Hopping",
    description: "Tour around Cabilao's pristine beaches and hidden coves, ending with the famous Cabilao sunset.",
    price: 1800, // PHP 1,800
    duration: "4 Hours",
    includes: [
      "Local boat transport",
      "Beach picnic setup",
      "Local guide",
      "Fresh coconut drinks",
      "Snorkeling gear"
    ],
   image: "https://picsum.photos/800/600"
  }
];
</script>

<div class="min-h-screen bg-white">
  <div class="relative h-[60vh] overflow-hidden">
    <img 
      src="https://picsum.photos/1920/1080?random=14" 
      alt="Experiences hero"
      class="w-full h-full object-cover"
    />
    <div class="absolute inset-0 bg-black/50 flex items-center justify-center">
      <div class="text-center text-white">
        <h1 class="text-5xl font-bold mb-4">Island Experiences</h1>
        <p class="text-xl opacity-90">Discover unforgettable adventures in paradise</p>
      </div>
    </div>
  </div>

  <div class="max-w-7xl mx-auto px-4 py-16">
    <div class="space-y-32">
      {#each experiences as experience}
        <div class="flex flex-col md:flex-row {experience.id % 2 === 0 ? 'md:flex-row-reverse' : ''} gap-12 items-center">
          <div class="flex-1 space-y-6">
            <h2 class="text-5xl font-bold leading-tight">{experience.title}</h2>
            <p class="text-gray-600 text-lg leading-normal">{experience.description}</p>
            <div class="space-y-6">
              <div class="space-y-3">
                <div>
                  <span class="text-gray-600">Duration</span>
                  <p class="text-xl font-semibold mt-1">{experience.duration}</p>
                </div>
                <div>
                  <span class="text-gray-600">Price</span>
                  <p class="text-4xl font-bold text-orange-600 mt-1">₱{experience.price }</p>
                </div>
              </div>
              <ul class="space-y-2">
                {#each experience.includes as item}
                  <li class="flex items-center text-gray-600">
                    <span class="text-orange-600 mr-3">✓</span>
                    {item}
                  </li>
                {/each}
              </ul>
              <button class="bg-orange-600 text-white px-12 py-4 rounded-lg hover:bg-orange-700 transition-all duration-300 hover:scale-[1.02] text-lg font-medium shadow-lg hover:shadow-xl">
                Book
              </button>
            </div>
          </div>
          
          <div class="flex-1">
            <img 
              src={experience.image} 
              alt={experience.title}
              class="w-full h-[600px] object-cover rounded-xl shadow-xl"
            />
          </div>
        </div>
      {/each}
    </div>
  </div>
</div>
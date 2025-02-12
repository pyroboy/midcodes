<script lang="ts">
 const experiences = [
  {
    id: 1,
    title: "Cabilao Island Cliff Dive Resort - Package A",
    description: "Experience the beauty of Cabilao Island with our comprehensive Package A tour that includes both countryside and island exploration, along with exciting water activities.",
    price: 5000,
    duration: "Full Day",
    includes: [
      "Country side tour & Island Tour",
      "Snorkeling and Turtle watching",
      "Free Transportation (Panglao to Island vice Versa)",
      "Boat Ride and Guide"
    ],
    image: "https://res.cloudinary.com/ddlz560fk/image/upload/v1739248183/1491583021_okoynj.jpg"
  },
  {
    id: 2,
    title: "Cabilao Island Cliff Dive Resort - Package B",
    description: "Enjoy an extended stay at Cabilao Island with our Package B, which includes all the activities from Package A plus comfortable accommodation.",
    price: 10000,
    duration: "Overnight",
    includes: [
      "Country side tour & Island Tour",
      "Snorkeling and Turtle watching",
      "Free Transportation (Panglao to Island vice Versa)",
      "Boat Ride and Guide",
      "Overnight stay with free breakfast"
    ],
    image: "https://res.cloudinary.com/ddlz560fk/image/upload/v1739248754/cabilao-drone-01_c0mz9q.jpg"
  }
];
</script>

<div class="min-h-screen bg-white">
  <div class="relative h-[60vh] overflow-hidden">
    <img 
      src="https://res.cloudinary.com/ddlz560fk/image/upload/v1739248182/1491581611_c7vqud.jpg" 
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
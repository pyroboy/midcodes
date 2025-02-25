<script lang="ts">
 const experiences = [
  {
    id: 1,
    title: "Package A: Day Tour",
    description: "Experience a full day of adventure at Cabilao Island with our comprehensive day tour package that includes exciting water activities and guided exploration.",
    price: 6500,
    duration: "Day Tour (7 AM - 4 PM)",
    includes: [
      "Transportation (Vice Versa)",
      "Island Tour",
      "Free Boat Ride",
      "Snorkeling",
      "Turtle Watching",
      "Free Snorkeling Gears & Life Vest",
      "Free Guide",
      "Free Snacks"
    ],
    image: "https://res.cloudinary.com/ddlz560fk/image/upload/v1739248183/1491583021_okoynj.jpg"
  },
  {
    id: 2,
    title: "Package B: Tour with Overnight Stay",
    description: "Make your island experience complete with our overnight package that combines exciting activities with comfortable accommodations.",
    price: 10000,
    duration: "Overnight Stay",
    includes: [
      "Room Accommodations",
      "Transportation (Vice Versa)",
      "Island Tour",
      "Boat Ride",
      "Snorkeling",
      "Turtle Watching",
      "Free Snorkeling Gears & Life Vest",
      "Free Guide",
      "Free Breakfast"
    ],
    image: "https://res.cloudinary.com/ddlz560fk/image/upload/v1739248754/cabilao-drone-01_c0mz9q.jpg"
  },
  {
    id: 3,
    title: "Package C: Day Use",
    description: "Perfect for families and groups looking to enjoy our resort facilities, this package offers access to our beautiful beachfront and recreational amenities.",
    price: 2000,
    duration: "Day Use (8 AM - 5 PM)",
    maxPax: 4,
    includes: [
      "Swimming Pool Access",
      "Beach Access",
      "Gazebo for Sea Viewing"
    ],
    image: "https://res.cloudinary.com/ddlz560fk/image/upload/v1739248183/1489349716_u7ay9s.jpg"
  },
  {
    id: 3,
    title: "Group Island Tour - Day Package",
    description: "Embark on an exciting day tour of Cabilao Island with your group. Explore the stunning Mundong Sandbar, enjoy snorkeling adventures, and witness the majestic sea turtles in their natural habitat.",
    duration: "Day Tour (7 AM - 4 PM)",
    priceTiers: [
      { pax: "1 - 3", price: 7500 },
      { pax: "4 - 6", price: 9500 },
      { pax: "7 - 9", price: 11500 },
      { pax: "10 - 12", price: 12500 }
    ],
    includes: [
      "Transportation (Vice-Versa)",
      "Island Tour to Mundong Sandbar",
      "Boat Ride",
      "Snorkeling",
      "Turtle Watching",
      "Free Snorkeling Gears & Life Vest",
      "Free Guide",
      "Free Snacks"
    ],
    image: "https://res.cloudinary.com/ddlz560fk/image/upload/v1739248183/1491583021_okoynj.jpg"
  },
  {
    id: 4,
    title: "Group Island Tour - Overnight Package",
    description: "Make the most of your Cabilao Island experience with an overnight stay. Enjoy all the activities from our day tour package plus comfortable accommodation and more inclusions for an unforgettable island getaway.",
    duration: "Overnight Stay",
    priceTiers: [
      { pax: "1 - 3", price: 10500 },
      { pax: "4 - 6", price: 15500 },
      { pax: "7 - 9", price: 18500 },
      { pax: "10 - 12", price: 21500 }
    ],
    includes: [
      "Transportation (Vice-Versa)",
      "Island Tour to Mundong Sandbar",
      "Boat Ride",
      "Snorkeling",
      "Turtle Watching",
      "Free Snorkeling Gears & Life Vest",
      "Free Guide",
      "Free Breakfast",
      "Free Snacks",
      "Fully air-conditioned room"
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
                  {#if experience.priceTiers}
                    <span class="text-gray-600">Price Tiers</span>
                    <div class="space-y-2 mt-1">
                      {#each experience.priceTiers as tier}
                        <div class="flex justify-between items-center">
                          <span class="text-lg">{tier.pax} pax</span>
                          <span class="text-2xl font-bold text-orange-600">₱{tier.price.toLocaleString()}</span>
                        </div>
                      {/each}
                    </div>
                  {:else}
                    <span class="text-gray-600">Price</span>
                    <p class="text-4xl font-bold text-orange-600 mt-1">₱{experience.price.toLocaleString()}</p>
                  {/if}
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
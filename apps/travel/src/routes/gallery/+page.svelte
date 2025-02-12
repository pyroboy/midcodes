<script>
  const galleries = [
    {
      id: 1,
      title: "Azure Cliff Paradise",
      image: "https://res.cloudinary.com/ddlz560fk/image/upload/v1739248184/1491584524_omcuty.jpg"
    },
    {
      id: 2,
      title: "Sunset Point Diving",
      image: "https://res.cloudinary.com/ddlz560fk/image/upload/v1739248183/1491582688_jsxxeg.jpg"
    },
    {
      id: 3,
      title: "Tropical Lagoon Jump",
      image: "https://res.cloudinary.com/ddlz560fk/image/upload/v1739248184/1491584800_vj3see.jpg"
    },
    {
      id: 4,
      title: "Big Room",
      image: "https://res.cloudinary.com/ddlz560fk/image/upload/v1739248183/1489349716_u7ay9s.jpg"
    },
    {
      id: 5,
      title: "Twin Bed",
      image: "https://res.cloudinary.com/ddlz560fk/image/upload/v1739248183/1491582688_jsxxeg.jpg"
    },
    {
      id: 6,
      title: "Ocean Vista Point",
      image: "https://res.cloudinary.com/ddlz560fk/image/upload/v1739248183/1489349725_epzgxe.jpg"
    },
    {
      id: 7,
      title: "Sunset Cove",
      image: "https://res.cloudinary.com/ddlz560fk/image/upload/v1739248183/1491575830_bwgafh.jpg"
    },
    {
      id: 8,
      title: "Crystal Bay",
      image: "https://res.cloudinary.com/ddlz560fk/image/upload/v1739248183/1491579331_zngmjm.jpg"
    },
    {
      id: 9,
      title: "Hidden Beach",
      image: "https://res.cloudinary.com/ddlz560fk/image/upload/v1739248183/1491583021_okoynj.jpg"
    },
    {
      id: 10,
      title: "Paradise Point",
      image: "https://res.cloudinary.com/ddlz560fk/image/upload/v1739248182/1489322539_mfdyo1.jpg"
    },
    {
      id: 11,
      title: "Blue Lagoon",
      image: "https://res.cloudinary.com/ddlz560fk/image/upload/v1739248182/1491581611_c7vqud.jpg"
    },
    {
      id: 12,
      title: "Secret Cove",
      image: "https://res.cloudinary.com/ddlz560fk/image/upload/v1739248182/1489322539_zqjz0x.webp"
    },
    {
      id: 13,
      title: "Mountain View Resort",
      image: "https://res.cloudinary.com/ddlz560fk/image/upload/v1739248182/1491582580_jh9zzd.jpg"
    },
    {
      id: 14,
      title: "Beachfront Villa",
      image: "https://res.cloudinary.com/ddlz560fk/image/upload/v1739248182/1489343656_vzdbbb.jpg"
    },
    {
      id: 15,
      title: "Infinity Pool",
      image: "https://res.cloudinary.com/ddlz560fk/image/upload/v1739248182/1491581638_txz6mn.jpg"
    },
    {
      id: 16,
      title: "Garden Restaurant",
      image: "https://res.cloudinary.com/ddlz560fk/image/upload/v1739248182/1489322992_wcsmce.jpg"
    },
    {
      id: 17,
      title: "Spa Retreat",
      image: "https://res.cloudinary.com/ddlz560fk/image/upload/v1739248182/1489348555_exjmxi.jpg"
    },
    {
      id: 18,
      title: "Sunset Bar",
      image: "https://res.cloudinary.com/ddlz560fk/image/upload/v1739248181/476333141_1162526778992589_4885629458431212239_n_jajibh.jpg"
    },
    {
      id: 19,
      title: "Private Beach",
      image: "https://res.cloudinary.com/ddlz560fk/image/upload/v1739248181/476333141_1162526778992589_4885629458431212239_n_jajibh.jpg"
    },
    {
      id: 20,
      title: "Yoga Pavilion",
      image: "https://res.cloudinary.com/ddlz560fk/image/upload/v1739248181/1491581302_kmovd4.jpg"
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
      src="https://res.cloudinary.com/ddlz560fk/image/upload/v1739248182/1491581611_c7vqud.jpg" 
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
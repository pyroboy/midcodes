<script lang="ts">
    import RestaurantBarDisplay from '$lib/components/RestaurantBarDisplay.svelte';
    
    interface MenuItem {
      name: string;
      description: string;
      price: number;
    }
  
    interface MenuCategory {
      category: string;
      items: MenuItem[];
    }
  
    interface Image {
      src: string;
      alt: string;
    }
  
    interface RestaurantInfo {
      hours: string;
      location: string;
      description: string;
    }
  
    const info: RestaurantInfo = {
      hours: "6:00 AM - 10:00 PM",
      location: "Beachfront",
      description: "Exquisite local, International and Asian Cuisines that guarantee relish"
    };
  
    const menu: MenuCategory[] = [
  {
    category: "Breakfast Favorites",
    items: [
      {
        name: "Filipino Breakfast Platter",
        description: "Choice of Longganisa, Tocino, or Daing na Bangus served with garlic rice, fried egg, and atchara",
        price: 450
      },
      {
        name: "Continental Breakfast",
        description: "Fresh croissants, Danish pastries, seasonal fruits, yogurt, and coffee or tea",
        price: 550
      },
      {
        name: "Champorado",
        description: "Traditional chocolate rice porridge served with tuyo and fresh milk",
        price: 280
      },
      {
        name: "Beef Tapa",
        description: "Marinated beef tapa served with garlic rice, fried egg, and pickled papaya",
        price: 420
      },
      {
        name: "Pancake Stack",
        description: "Fluffy buttermilk pancakes with maple syrup, butter, and fresh berries",
        price: 350
      }
    ]
  },
  {
    category: "Appetizers",
    items: [
      {
        name: "Lumpiang Shanghai",
        description: "Crispy Filipino spring rolls filled with ground pork and vegetables, served with sweet chili sauce",
        price: 280
      },
      {
        name: "Kinilaw na Tanigue",
        description: "Fresh mackerel ceviche with ginger, onions, and coconut vinegar",
        price: 380
      },
      {
        name: "Crispy Squid",
        description: "Deep-fried squid rings with aioli and citrus-soy dipping sauce",
        price: 320
      },
      {
        name: "Tinapa Croquettes",
        description: "Smoked fish and potato croquettes with herb aioli",
        price: 290
      },
      {
        name: "Green Mango Salad",
        description: "Shredded green mango with tomatoes, onions, and bagoong dressing",
        price: 250
      }
    ]
  },
  {
    category: "Main Courses",
    items: [
      {
        name: "Kare-Kare",
        description: "Oxtail and tripe in peanut sauce with vegetables, served with bagoong",
        price: 580
      },
      {
        name: "Crispy Pata",
        description: "Deep-fried pork knuckle with soy-vinegar dipping sauce",
        price: 850
      },
      {
        name: "Seafood Sinigang",
        description: "Sour tamarind soup with prawns, fish, and vegetables",
        price: 520
      },
      {
        name: "Grilled Tuna Belly",
        description: "Fresh tuna belly with calamansi and soy dipping sauce",
        price: 480
      },
      {
        name: "Chicken Inasal",
        description: "Grilled chicken marinated in annatto oil and spices",
        price: 420
      }
    ]
  },
  {
    category: "Vegetarian Options",
    items: [
      {
        name: "Gising Gising",
        description: "Winged beans and coconut milk stew with chili",
        price: 320
      },
      {
        name: "Pinakbet",
        description: "Mixed vegetables sautéed in shrimp paste",
        price: 280
      },
      {
        name: "Mushroom Sisig",
        description: "Sizzling mixed mushrooms with citrus and chilies",
        price: 350
      },
      {
        name: "Tofu Steak",
        description: "Grilled tofu with mushroom gravy and vegetables",
        price: 300
      },
      {
        name: "Laing",
        description: "Dried taro leaves in coconut milk with chilies",
        price: 290
      }
    ]
  }
];

const barMenu: MenuCategory[] = [
  {
    category: "Signature Cocktails",
    items: [
      {
        name: "Cabilao Sunset",
        description: "Rum, fresh mango, coconut cream, and tropical fruit juices",
        price: 450
      },
      {
        name: "Mindanao Mule",
        description: "Vodka, calamansi, ginger beer, and pomelo",
        price: 420
      },
      {
        name: "Chocolate Hills",
        description: "Coffee liqueur, local chocolate, and cream",
        price: 380
      },
      {
        name: "Island Paradise",
        description: "Gin, blue curaçao, pineapple juice, and coconut cream",
        price: 420
      },
      {
        name: "Philippine Mojito",
        description: "Rum, calamansi, mint, and muscovado sugar",
        price: 380
      }
    ]
  },
  {
    category: "Local Craft Beers",
    items: [
      {
        name: "Engkanto Lager",
        description: "Clean, crisp lager with subtle hop character",
        price: 280
      },
      {
        name: "Nipa Brew Pale Ale",
        description: "Balanced pale ale with tropical fruit notes",
        price: 290
      },
      {
        name: "Pedro's IPA",
        description: "Bold IPA with citrus and pine notes",
        price: 320
      },
      {
        name: "Katipunan Craft Ale",
        description: "Smooth amber ale with caramel notes",
        price: 290
      },
      {
        name: "Crazy Carabao Stout",
        description: "Rich stout with coffee and chocolate notes",
        price: 310
      }
    ]
  },
  {
    category: "Mocktails",
    items: [
      {
        name: "Virgin Cabilao",
        description: "Mango, coconut cream, and tropical fruit juices",
        price: 280
      },
      {
        name: "Calamansi Spritz",
        description: "Fresh calamansi juice, mint, and soda",
        price: 250
      },
      {
        name: "Dalandan Fizz",
        description: "Local orange juice, lime, and ginger ale",
        price: 250
      },
      {
        name: "Buko Pandan Shake",
        description: "Young coconut, pandan, and cream",
        price: 270
      },
      {
        name: "Purple Taro Latte",
        description: "Ube, coconut milk, and vanilla",
        price: 290
      }
    ]
  },
  {
    category: "Bar Snacks",
    items: [
      {
        name: "Sisig Nachos",
        description: "Tortilla chips topped with pork sisig and cheese",
        price: 380
      },
      {
        name: "Chicharron Bulaklak",
        description: "Crispy pork ruffle fat with spiced vinegar",
        price: 320
      },
      {
        name: "Chicken Skin",
        description: "Crispy chicken skin with chili vinegar",
        price: 250
      },
      {
        name: "Tokwa't Baboy",
        description: "Tofu and pork with soy-vinegar sauce",
        price: 290
      },
      {
        name: "Spicy Squid Rings",
        description: "Breaded squid rings with sriracha mayo",
        price: 340
      }
    ]
  }
];
  
    const images = {
      restaurant: [
        { src: "/api/placeholder/800/600", alt: "Restaurant Interior" },
        { src: "/api/placeholder/800/900", alt: "Beachfront Dining" },
        { src: "/api/placeholder/800/700", alt: "Signature Dishes" },
        { src: "/api/placeholder/800/1000", alt: "Chef's Special" },
        { src: "/api/placeholder/800/800", alt: "Breakfast Setup" }
      ],
      bar: [
        { src: "/api/placeholder/800/900", alt: "Bar Counter" },
        { src: "/api/placeholder/800/700", alt: "Cocktail Selection" },
        { src: "/api/placeholder/800/1000", alt: "Sunset Bar View" },
        { src: "/api/placeholder/800/800", alt: "Signature Cocktails" }
      ]
    };
  </script>
  
  <div class="min-h-screen bg-white">
    <!-- Hero Section -->
    <div class="relative h-[60vh] overflow-hidden">
      <img 
        src="/api/placeholder/1920/1080" 
        alt="Restaurant hero"
        class="w-full h-full object-cover"
      />
      <div class="absolute inset-0 bg-black/50 flex items-center justify-center">
        <div class="text-center text-white">
          <h1 class="text-5xl font-bold mb-4">The Cliffs Restaurant</h1>
          <p class="text-xl opacity-90">{info.description}</p>
        </div>
      </div>
    </div>
  
    <!-- Main Content -->
    <div class="max-w-7xl mx-auto px-4 py-16">
      <!-- Restaurant Info -->

  
      <!-- Restaurant and Bar Displays -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <RestaurantBarDisplay 
          title="Restaurant"
          description="Experience our exquisite dining atmosphere and culinary delights"
          menuItems={menu}
          galleryImages={images.restaurant}
        />
    
        <RestaurantBarDisplay 
          title="Bar & Lounge"
          description="Experience our exquisite dining atmosphere and culinary delights"
          menuItems={barMenu}
          galleryImages={images.bar}
        />
      </div>
      <div class="bg-orange-50 rounded-xl p-8 mb-16">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div class="text-center">
            <h3 class="text-orange-600 font-semibold mb-2">Operating Hours</h3>
            <p class="text-gray-700">{info.hours}</p>
          </div>
          <div class="text-center">
            <h3 class="text-orange-600 font-semibold mb-2">Location</h3>
            <p class="text-gray-700">{info.location}</p>
          </div>
          <div class="text-center">
            <h3 class="text-orange-600 font-semibold mb-2">Reservations</h3>
            <p class="text-gray-700">+63 917 123 4567</p>
          </div>
        </div>
      </div>
      <!-- Call to Action -->
      <div class="text-center mt-16">
        <button class="bg-orange-600 text-white px-8 py-3 rounded-lg hover:bg-orange-700 transition-colors">
          Make a Reservation
        </button>
      </div>
    </div>
  </div>
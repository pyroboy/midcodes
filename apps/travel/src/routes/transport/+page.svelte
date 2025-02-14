<script lang="ts">
  interface TransportRate {
    vehicle: string;
    tubigonPort: string;
    tagbilaranRate: string;
    airportRate: string;
    maxPax: string;
  }

  const rates: TransportRate[] = [
    {
      vehicle: "Sedan / Car",
      tubigonPort: "P1000 /unit / way",
      tagbilaranRate: "P2,000net/unit/way",
      airportRate: "P2,300net/unit/way",
      maxPax: "2pax"
    },
    {
      vehicle: "Van",
      tubigonPort: "P1500 / unit / way",
      tagbilaranRate: "P2,300net/unit/way",
      airportRate: "P2,800net/unit/way",
      maxPax: "10pax"
    },
    {
      vehicle: "Coaster",
      tubigonPort: "P10,000 / unit / wa",
      tagbilaranRate: "P7,000net/unit/way",
      airportRate: "P7,000net/unit/way",
      maxPax: "22pax"
    },
    {
      vehicle: "Bus",
      tubigonPort: "P12,000 / unit / way",
      tagbilaranRate: "P8,500net/unit/way",
      airportRate: "P8,500net/unit/way",
      maxPax: "45pax"
    }
  ];

  const terms = [
    "Kids rate range from 4-8 yrs Old (50% off) / Included in the headcount.",
    "0-3 Yrs old, Free of Charge (Max of 2Kids) / Not included in the headcount.",
    "Transportation cancellation must be done at least one week prior to arrival or use of vehicle."
  ];
</script>

<div class="min-h-screen bg-white">
  <div class="relative h-[40vh] overflow-hidden">
    <img 
      src="https://res.cloudinary.com/ddlz560fk/image/upload/v1707628800/transport-hero_kj8f9p.jpg" 
      alt="Transport hero"
      class="w-full h-full object-cover"
    />
    <div class="absolute inset-0 bg-black/50 flex items-center justify-center">
      <div class="text-center text-white">
        <h1 class="text-4xl font-bold mb-4">BOHOL TRANSFER RATES</h1>
      </div>
    </div>
  </div>

  <div class="max-w-7xl mx-auto px-4 py-12">
    <!-- Rates Table -->
    <div class="overflow-x-auto">
      <table class="w-full border-collapse">
        <thead>
          <tr class="bg-gray-100">
            <th class="border p-4 text-left">VEHICLE</th>
            <th class="border p-4 text-left">Tubigon Sea Port</th>
            <th class="border p-4 text-left">Tagbilaran Transfer rates</th>
            <th class="border p-4 text-left">Airport Transfer rates</th>
            <th class="border p-4 text-left">Maximum number of pax</th>
          </tr>
        </thead>
        <tbody>
          {#each rates as rate}
            <tr class="hover:bg-gray-50">
              <td class="border p-4">{rate.vehicle}</td>
              <td class="border p-4">{rate.tubigonPort}</td>
              <td class="border p-4">{rate.tagbilaranRate}</td>
              <td class="border p-4">{rate.airportRate}</td>
              <td class="border p-4">{rate.maxPax}</td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>

    <!-- Terms & Conditions -->
    <div class="mt-12">
      <h2 class="text-xl font-bold mb-4">Terms & Conditions:</h2>
      <ul class="space-y-2 list-disc pl-5">
        {#each terms as term}
          <li class="text-gray-700">{term}</li>
        {/each}
      </ul>
    </div>

    <!-- Contact Information -->
    <div class="mt-8">
      <p class="text-gray-700">
        Looking for partners and enjoying the agreed price, as long as you love traveling and islands, both travel agencies and backpackers can become our partners and enjoy our preferential price and special courtesy.
      </p>
      <p class="mt-4">
        Please send your name, date of birth and country information to 
        <a href="mailto:eomortal@gmail.com" class="text-orange-600 hover:underline">eomortal@gmail.com</a>
        .Thank you!
      </p>
    </div>
  </div>
</div>
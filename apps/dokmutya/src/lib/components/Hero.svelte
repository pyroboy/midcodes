<script lang="ts">
    import { scrollState } from '$lib/stores/scrollStore';
</script>

<style>
    :global(body) {
        margin: 0;
        padding: 0;
        width: 100%;
        overflow-x: hidden;
    }

    :global(#app) {
        overflow-x: hidden;
        width: 100%;
        position: relative;
    }

    section {
        width: 100vw;
        overflow-x: hidden;
        position: relative;
    }
</style>

<section class="relative min-h-screen bg-gradient-to-b from-[#15B392] to-[#264b45] overflow-hidden">
    <!-- Contact Information -->
    <div class="absolute top-4 right-4 md:top-8 md:right-8 text-right z-30">
        <p class="text-white text-sm md:text-base">Contact: <a href="tel:+639123456789" class="underline">+63 912 345 6789</a></p>
        <p class="text-white text-sm md:text-base">Email: <a href="mailto:info@dokmutya.com" class="underline">info@dokmutya.com</a></p>
    </div>
    
    <!-- Main Content -->
    <div class="relative h-full px-4 md:px-8 lg:px-16 xl:px-24">
        <div class="text-white leading-tight pt-[9%] relative z-30 max-w-4xl">
            <p class="text-[2.5rem] sm:text-[3.5rem] md:text-[5.2rem] font-bold mb-2 md:mb-4">Dok</p>
            <h1 class="transition-all duration-300 
                text-[2.5rem] sm:text-[3.5rem] md:text-[5.2rem]
                -mt-2 sm:-mt-3 md:-mt-4 font-bold mb-3 md:mb-6">
                MUTYA TIROL
            </h1>
            
            <div class="flex items-center gap-2 sm:gap-3 md:gap-4 -mt-2 sm:-mt-3 md:mt-0 mb-3 md:mb-6 max-w-xl">
                <span class="text-xl sm:text-2xl md:text-3xl font-medium whitespace-nowrap">For FIRST DISTRICT</span>
                <div class="h-0.5 bg-white flex-grow"></div>
            </div>
            
            <h2 class="text-3xl sm:text-4xl md:text-6xl font-bold mb-4 md:mb-8">BOARD MEMBER</h2>
            <p class="text-base sm:text-lg md:text-2xl font-light leading-relaxed max-w-xl">
                With a passion for service, Dok Mutya believes that true wellness comes from nurturing both body and community.
            </p>
            
            <div class="flex flex-col space-y-3 mt-6 md:mt-10 w-[8rem] sm:w-[9rem] md:w-[10rem]">
                <button class="px-4 sm:px-6 md:px-8 py-2 sm:py-3 md:py-4 bg-black/20 border-2 border-white text-white text-sm sm:text-base md:text-xl font-semibold hover:bg-black/30 transition-all">
                    Libreng Serbisyo
                </button>
            </div>
        </div>
    </div>

    <!-- Image Container -->
    <div class="absolute bottom-0 w-screen overflow-visible z-20" 
    style="height: calc(100% - 120px);">
   <img 
       src="https://res.cloudinary.com/dexcw6vg0/image/upload/v1738468771/AOEwLogo_se84km.webp" 
       alt="AOEw Logo" 
       class="absolute bottom-0
              w-auto h-full
              object-contain object-bottom
              transform -translate-x-1/2"
       style="left: 75%"
   />
</div>
    
    <!-- Gradient Overlays -->
    <div class="block md:hidden absolute inset-0 w-full h-full bg-gradient-to-tr from-[#34635b] to-[#15B392] z-10"></div>
    <div class="block xl:hidden absolute inset-0 w-full h-full transition-opacity duration-300 bg-[#34635b] pointer-events-none z-15" 
         style="opacity: {$scrollState.hasScrolled ? '0.5' : '0'}">
    </div>
</section>

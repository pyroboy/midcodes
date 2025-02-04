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
        overflow: hidden;
        position: relative;
        mask-image: linear-gradient(to bottom, black 0%, black 100%);
        -webkit-mask-image: linear-gradient(to bottom, black 0%, black 100%);
    }

    .content-container {
        position: relative;
        width: 100%;
        height: 100vh;
        overflow: hidden;
    }
</style>

<section class="relative min-h-screen bg-gradient-to-b from-[#15B392] to-[#264b45] z-10">
    <!-- Contact Information -->
    <!-- <div class="absolute top-4 right-4 md:top-8 md:right-8 text-right z-20">
        <p class="text-white text-sm md:text-base">Contact: <a href="tel:+639123456789" class="underline">+63 912 345 6789</a></p>
        <p class="text-white text-sm md:text-base">Email: <a href="mailto:info@dokmutya.com" class="underline">info@dokmutya.com</a></p>
    </div> -->
    
    <!-- {$scrollState.hasScrolled ? 'left-1/2 transform -translate-x-1/2 text-center' : 'left-0'}
    px-4 md:px-8 lg:px-16 xl:px-24 pt-[9vh]"  -->
    <!-- Main Content -->
    <div class="content-container">
        <div class="fixed text-white leading-tight  top-0 left-1/2 transform -translate-x-1/2 text-center pt-[4vh]"
        
             style="z-index: {$scrollState.hasScrolled ? '5' : '30'}">
            <p class="text-[2.5rem] sm:text-[3.5rem] md:text-[5.2rem] font-bold mb-2 md:mb-4 transition-transform duration-300">Dok</p>
            <h1 class="transition-all duration-300 
                text-[5.5rem] sm:text-[5.5rem] md:text-[8.2rem]
                -mt-2 sm:-mt-3 md:-mt-4 font-bold mb-3 md:mb-6 leading-[5.5rem] sm:leading-[5.5rem] md:leading-[8.2rem]">
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
            
            <div class="flex flex-col space-y-3 mt-10 md:mt-[6rem] w-[8rem] sm:w-[9rem] md:w-[20rem] left-[20%] md:left-[40%]  translate-x-[20%]  md:translate-x-[40%] ">
                <button class="px-4 sm:px-6 md:px-8 py-2 sm:py-3 md:py-4 bg-red-500 border-2 border-white text-white text-sm sm:text-base md:text-xl font-semibold hover:bg-black/30 transition-all">
                    Libreng Serbisyo
                </button>
            </div>
        </div>
    </div>

    <!-- Image Container -->
    <div class="absolute bottom-0 w-screen overflow-visible transition-all duration-300  {$scrollState.hasScrolled ? 'blur-sm' : ''}" 
    style="height: calc(80%); z-index: {$scrollState.hasScrolled ? '1' : '40'}">
   <img 
       src="https://res.cloudinary.com/dexcw6vg0/image/upload/v1738468771/AOEwLogo_se84km.webp" 
       alt="AOEw Logo" 
       class="absolute bottom-0
              w-auto h-full
                  object-bottom
              transform -translate-x-1/2 transition-all duration-300"
       style="left: 66%"
   />
</div>
    
    <!-- Gradient Overlays -->
    <!-- <div class="block md:hidden absolute inset-0 w-full h-full bg-gradient-to-tr from-[#34635b] to-[#15B392]" style="z-index: 2"></div> -->
    <div class="block absolute inset-0 w-full h-full bg-[#34635b] pointer-events-none transition-opacity duration-1000"
         style="opacity: {$scrollState.hasScrolled ? '0.5' : '0'}; z-index: {$scrollState.hasScrolled ? '3' : '0'}">
    </div>
</section>

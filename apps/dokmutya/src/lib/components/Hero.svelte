<script lang="ts">
import { scrollState } from '$lib/stores/scrollStore';
</script>

<section class="relative h-screen w-full overflow-x-visible bg-gradient-to-b from-[#15B392] to-[#264b45]">
    <!-- Contact Information - Top Right -->
    <div class="absolute top-4 right-4 md:top-8 md:right-8 text-right z-20">
        <p class="text-white text-sm md:text-base">Contact us: <a href="tel:+639123456789" class="underline">+63 912 345 6789</a></p>
        <p class="text-white text-sm md:text-base">Email: <a href="mailto:info@dokmutya.com" class="underline">info@dokmutya.com</a></p>
    </div>
    
    <!-- Main Content -->
    <div class="relative container h-full justify-start transition-all duration-300
    pt-[9%]
    ml-[5%] 
    sm:ml-[5%] 
    md:ml-[5%]  
    lg:ml-[5%]  
    xl:ml-[7%] 
    2xl:ml-[8%]
    2xl:pt-[7%]" 
    
    style="position: relative;">
        <div class="max-w-[55rem] text-white leading-none" style="position: absolute; z-index: {$scrollState.hasScrolled ? 20 : 5};">
                <p class="text-9xl md:text-7xl font-bold mb-2 md:mb-3">Dok</p>
                <h1 class="transition-all duration-300 
                text-[9.2rem]
                 md:text-[8.1rem] 
                 -mt-4 font-bold mb-3 md:mb-4
                 2xl:text-[8.5rem]
                 2xl:whitespace-nowrap
                 ">MUTYA TIROL</h1>
                <div class="flex items-center gap-2 -mt-4 md:gap-4 mb-3 md:mb-4">
                    <span class="text-3xl md:text-3xl font-medium">For FIRST DISTRICT</span>
                    <div class="h-0.5 bg-white flex-none md:flex-grow"></div>
                </div>
                <h2 class="text-6xl md:text-6xl font-bold mb-4 md:mb-6">BOARD MEMBER</h2>
                <p class="text-lg md:text-2xl font-light leading-relaxed max-w-xl">
                    With a passion for service, Dok Mutya believes that true wellness comes from nurturing both body and community.
                </p>
                <div class="flex flex-col space-y-3 mt-6 md:mt-8 w-[20rem]">
                    <button
                        class="px-6 md:px-8 py-3 md:py-4 bg-black/20 border-2 border-white text-white text-lg md:text-xl font-semibold hover:bg-black/30 transition-all"
                    >
                        Libreng Serbisyo
                    </button>
                    <!-- <button
                        class="px-6 md:px-8 py-3 md:py-4 bg-black/20 border-2 border-white text-white text-lg md:text-xl font-semibold hover:bg-black/30 transition-all"
                    >
                        Sama-ka
                    </button>
                    <button
                        class="px-6 md:px-8 py-3 md:py-4 bg-black/20 border-2 border-white text-white text-lg md:text-xl font-semibold hover:bg-black/30 transition-all"
                    >
                        Suporta
                    </button> -->
                </div>
            </div>
    </div>
    <div class="block md:hidden absolute inset-0 bg-gradient-to-tr from-[#34635b] to-[#15B392]"></div>
    <div class="block xl:hidden absolute inset-0 transition-opacity duration-300 bg-[#34635b] pointer-events-none" style="opacity: {$scrollState.hasScrolled ? '0.5' : '0'}; z-index: 15;"></div>
    <img 
        src="https://res.cloudinary.com/dexcw6vg0/image/upload/v1738468771/AOEwLogo_se84km.webp" 
        alt="AOEw Logo" 
        class="min-w-[730px] max-w-[42%] min-h-[700px] absolute bottom-0 right-0 pt-auto transition-all duration-300 -mr-[40%] xs:-mr-[35%] sm:-mr-[30%] md:-mr-[20%] lg:-mr-[15%] xl:mr-[0.5%] 2xl:mr-[7%] 3xl:mr-[9%] 2xl:min-w-[750px] 3xl:min-w-[800px]"
        style="z-index: {$scrollState.hasScrolled ? 5 : 20};"
    />
</section>

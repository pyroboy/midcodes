<script lang="ts">
    import { onMount } from 'svelte';

    let currentDate: string;
    let currentTime: string;
    let showNavBar = false;

    function updateDateTime() {
        currentDate = new Date().toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric'
        });

        currentTime = new Date().toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });
    }

    onMount(() => {
        updateDateTime();
        const interval = setInterval(updateDateTime, 60000);
        return () => clearInterval(interval);
    });
</script>

<div class="relative w-full ">
    <div>
        {#if showNavBar}
        <div class="absolute top-0 left-0 right-0">
            <div class="bg-white h-12 md:h-16 shadow-sm flex justify-end items-center px-4 md:px-6">
                <div class="flex gap-2">
                    <button class="px-4 md:px-6 py-1.5 md:py-2 text-sm md:text-base bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors">
                        Live Tally
                    </button>
                    <button class="px-4 md:px-6 py-1.5 md:py-2 text-sm md:text-base bg-white text-gray-700 rounded-full border border-gray-300 hover:bg-gray-50 transition-colors">
                        About Us
                    </button>
                </div>
            </div>
        </div>
        {/if}

        <div class="absolute top-0 left-0 z-10">
            <img 
                src="/images/cornerTag.png" 
                alt="UB Logo" 
                class="w-40 md:w-60 h-auto object-contain"
            />
        </div>

        <div class="flex flex-col items-center justify-center pt-16 md:pt-20 pb-6 md:pb-8 px-4 md:px-6">
            <img 
                src="/images/title.png" 
                alt="UB Days 2024" 
                class="h-14 md:h-20 w-auto"
            />
            
            <h1 class="albert-sans-large text-center">
                Official Medal Tally
            </h1>
            <p class="text-base md:text-lg text-gray-600 albert-sans-bold text-center">
                As of {currentDate} | {currentTime}
            </p>
        </div>
    </div>
</div>

<style>
    @import url('https://fonts.googleapis.com/css2?family=Albert+Sans:ital,wght@0,100..900;1,100..900&display=swap');

    .albert-sans-large {
        font-family: "Albert Sans", sans-serif;
        font-weight: 700;
        font-size: clamp(2rem, 4vw, 7rem);
        line-height: 1.1;
        letter-spacing: -0.05em;
        color: #3B3B3B;
    }

    .albert-sans-bold {
        font-family: "Albert Sans", sans-serif;
        font-weight: 700;
        font-style: normal;
    }

    @media (max-width: 640px) {
        .albert-sans-large {
            letter-spacing: -0.03em;
        }
    }
</style>
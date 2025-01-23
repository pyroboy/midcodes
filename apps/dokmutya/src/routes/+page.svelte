<script lang="ts">
    let stats = [
        { number: '20+', label: 'Years in Healthcare' },
        { number: '12', label: 'Municipalities Served' },
        { number: '300K+', label: 'Citizens Reached' }
    ];

    let priorities = [
        {
            title: 'Modern Healthcare Facilities',
            description: 'Upgrading medical equipment and infrastructure'
        },
        {
            title: 'Accessible Healthcare',
            description: 'Bringing medical services closer to communities'
        },
        {
            title: 'Emergency Response',
            description: 'Strengthening rapid medical response capabilities'
        }
    ];

    let events = [
        {
            date: 'June 15, 2024',
            title: 'Medical Mission - Tagbilaran City',
            location: 'City Health Office'
        },
        {
            date: 'June 22, 2024',
            title: 'Healthcare Forum',
            location: 'Bohol Cultural Center'
        }
    ];
</script>

<main class="font-inter">
    <section class="relative h-screen w-full overflow-hidden">
        <!-- Background Image Container -->
        <div 
            class="absolute inset-0 w-full h-full bg-cover bg-center bg-no-repeat"
            style="background-image: url('https://i.ibb.co/sjwDsCJ/anang.jpg'); background-size: cover;"
        ></div>
        <div class="absolute inset-0 bg-emerald-600 opacity-30 md:opacity-0"></div>
        <!-- Contact Information - Top Right -->
        <div class="absolute top-4 right-4 md:top-8 md:right-8 text-right z-20">
            <p class="text-white text-base md:text-lg mb-1 md:mb-2">To support, please contact:</p>
            <p class="text-white text-2xl md:text-4xl font-bold mb-1">09188888888</p>
            <p class="text-white text-xl md:text-2xl">mktm@gmail.com</p>
        </div>
        
        <!-- Main Content -->
        <div class="relative z-10 container px-4 h-full flex items-center justify-start ml-[5%] md:ml-[15%]">
            <div class="max-w-2xl">
                <div class="text-white">
                    <p class="text-3xl md:text-5xl font-bold mb-2 md:mb-3">Dok</p>
                    <h1 class="text-5xl md:text-8xl -mt-4 font-bold mb-3 md:mb-4">MUTYA TIROL</h1>
                    <div class="flex items-center gap-2 -mt-4 md:gap-4 mb-3 md:mb-4">
                        <span class="text-xl md:text-3xl font-medium">For FIRST DISTRICT</span>
                        <div class="h-0.5 bg-white flex-none md:flex-grow"></div>
                    </div>
                    <h2 class="text-4xl md:text-6xl font-bold mb-4 md:mb-6">BOARD MEMBER</h2>
                    <p class="text-lg md:text-2xl font-light leading-relaxed max-w-xl">
                        With a passion for service, Dok Mutya believes that true wellness comes from nurturing both body and community.
                    </p>
                    <button
                        class="mt-6 md:mt-8 px-6 md:px-8 py-3 md:py-4 bg-black/20 border-2 border-white text-white text-lg md:text-xl font-semibold hover:bg-black/30 transition-all"
                    >
                        Support Her Cause
                    </button>
                </div>
            </div>
        </div>
        
        
        
        
    </section>
    <section id="about" >
<!-- Navigation Menu -->
<!-- Navigation Menu -->
<div class="w-full grid grid-cols-3">
    <a href="#biography" class="flex flex-col items-center justify-center py-6 bg-[#3CB4AC] text-white hover:brightness-95 transition-all">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 mb-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z" />
            <path d="M8 7h8" />
            <path d="M8 11h8" />
            <path d="M8 15h5" />
        </svg>
        <span class="text-lg font-medium">Education</span>
    </a>
    
    <a href="#biography" class="flex flex-col items-center justify-center py-6 bg-[#CC0001] text-white hover:brightness-95 transition-all">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 mb-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
        </svg>
        <span class="text-lg font-medium">Public Service</span>
    </a>
    
    <a href="#biography" class="flex flex-col items-center justify-center py-6 bg-[#1B4D4C] text-white hover:brightness-95 transition-all">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 mb-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
        </svg>
        <span class="text-lg font-medium">Biography</span>
    </a>
</div>

<!-- Content Sections -->
<div class="container mx-auto px-4 py-12">
    <!-- First Achievement Block -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
        <div class="bg-[#EDF1F1] aspect-video">
            <div class="w-full h-full flex items-center justify-center text-[#3CB4AC]">
                IMAGE HERE
            </div>
        </div>
        <div class="flex flex-col justify-center">
            <h2 class="text-3xl md:text-4xl font-bold text-[#1B4D4C] mb-4">
                Founded the largest hospital in Bohol
            </h2>
            <p class="text-gray-700">
                Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
            </p>
        </div>
    </div>

    <!-- Second Achievement Block -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div class="flex flex-col justify-center md:order-1 order-2">
            <h2 class="text-3xl md:text-4xl font-bold text-[#1B4D4C] mb-4">
                Headed 3 Major Hospitals in Bohol
            </h2>
            <p class="text-gray-700 mb-6">
                Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat.
            </p>
            <button class="text-[#3CB4AC] border-2 border-[#3CB4AC] px-8 py-2 w-fit hover:bg-[#3CB4AC] hover:text-white transition-all">
                See Statistic
            </button>
        </div>
        <div class="bg-[#EDF1F1] aspect-video md:order-2 order-1">
            <div class="w-full h-full flex items-center justify-center text-[#3CB4AC]">
                IMAGE HERE
            </div>
        </div>
    </div>
</div>
    </section>

    <section id="priorities">
      <!-- Career Highlights Section -->
<div class="bg-[#3CB4AC] p-8 md:p-12">
    <div class="container mx-auto">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <!-- Left Content -->
            <div class="text-white">
                <h3 class="uppercase text-sm font-medium mb-4">CAREER HIGHLIGHTS</h3>
                <h2 class="text-4xl md:text-5xl font-bold mb-4">Put the Title of the Photo Here</h2>
                <p class="text-lg opacity-90">
                    Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore
                </p>
            </div>
            <!-- Right Image -->
            <div class="relative">
                <img 
                    src="https://i.ibb.co/sjwDsCJ/anang.jpg" 
                    alt="Career Highlight" 
                    class="w-full rounded-lg"
                />
                <!-- Dots Navigation -->
                <div class="flex justify-center mt-4 gap-1">
                    <div class="h-2 w-2 rounded-full bg-white"></div>
                    <div class="h-2 w-2 rounded-full bg-white opacity-50"></div>
                    <div class="h-2 w-2 rounded-full bg-white opacity-50"></div>
                    <div class="h-2 w-2 rounded-full bg-white opacity-50"></div>
                    <div class="h-2 w-2 rounded-full bg-white opacity-50"></div>
                </div>
            </div>
        </div>
    </div>
</div>

<!-- Statistics Section -->
<div class="container mx-auto py-12">
    <div class="grid grid-cols-3 gap-4 text-center">
        <!-- Years in Healthcare -->
        <div>
            <h3 class="text-[#CC0001] text-4xl md:text-5xl font-bold mb-2">20+</h3>
            <p class="text-[#3CB4AC] text-sm">Years in Healthcare</p>
        </div>
        <!-- Municipalities Served -->
        <div>
            <h3 class="text-[#CC0001] text-4xl md:text-5xl font-bold mb-2">30</h3>
            <p class="text-[#3CB4AC] text-sm">Municipalities Served</p>
        </div>
        <!-- Health Outreach -->
        <div>
            <h3 class="text-[#CC0001] text-4xl md:text-5xl font-bold mb-2">300+</h3>
            <p class="text-[#3CB4AC] text-sm">Health Outreach</p>
        </div>
    </div>
</div>
</section>

<section id="biography">
<!-- Short Bio Section -->
<div class="bg-[#EDF1F1] p-8 md:p-12">
    <div class="container mx-auto">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-12">
            <!-- Left Images -->
            <div class="space-y-6">
                <div class="bg-white p-4 aspect-square">
                    <div class="w-full h-full flex items-center justify-center text-[#3CB4AC]">
                        IMAGE HERE
                    </div>
                </div>
                <div class="bg-white p-4 aspect-square">
                    <div class="w-full h-full flex items-center justify-center text-[#3CB4AC]">
                        IMAGE HERE
                    </div>
                </div>
            </div>
            <!-- Right Content -->
            <div>
                <h3 class="uppercase text-[#3CB4AC] text-sm font-medium mb-4">SHORT BIO</h3>
                <h2 class="text-3xl md:text-4xl text-[#1B4D4C] font-bold mb-6">
                    Service runs in their family
                </h2>
                <div class="space-y-4 text-gray-700">
                    <p>
                        Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
                    </p>
                    <p>
                        Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
                    </p>
                </div>
            </div>
        </div>
    </div>
</div>
    </section>

    <section id="contact">
       <!-- Final Section Container -->
<!-- Final Section Container -->
<div class="relative bg-[#3CB4AC] min-h-[600px]">
    <!-- Navigation Tabs -->
    <div class="grid grid-cols-4 text-white">
        <a href="#biography" class="bg-[#3CB4AC] py-4 text-center hover:bg-opacity-90 transition-all text-xl font-medium">
            Mothers
        </a>
        <a href="#biography" class="bg-[#1B4D4C] py-4 text-center hover:bg-opacity-90 transition-all text-xl font-medium">
            Tourism
        </a>
        <a href="#biography" class="bg-[#3CB4AC] py-4 text-center hover:bg-opacity-90 transition-all text-xl font-medium">
            Youth
        </a>
        <a href="#biography" class="bg-[#1A4D3E] py-4 text-center hover:bg-opacity-90 transition-all text-xl font-medium">
            Agriculture
        </a>
    </div>

    <!-- Content Container -->
    <div class="container mx-auto px-4 md:px-8 relative">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-8 items-center py-12">
            <!-- Left Content -->
            <div class="text-white z-10">
                <h2 class="text-5xl md:text-6xl font-bold leading-tight mb-12">
                    Healthier and<br />
                    Happier 2025 Sa<br />
                    Tanang Bol-anon!
                </h2>
                
                <!-- Buttons -->
                <div class="space-y-4">
                    <button class="block w-full md:w-72 bg-[#1B4D4C] text-white py-3 text-xl font-medium hover:bg-opacity-90 transition-all">
                        Support Dok Mutya
                    </button>
                    <button class="block w-full md:w-72 bg-[#1B4D4C] text-white py-3 text-xl font-medium hover:bg-opacity-90 transition-all">
                        Follow Our Socials
                    </button>
                </div>
            </div>

            <!-- Right Image -->
            <div class="relative">
                <img 
                    src="https://i.ibb.co/sjwDsCJ/anang.jpg" 
                    alt="Dok Mutya" 
                    class="w-full h-auto"
                />
                <!-- Number 8 Overlay -->
                <div class="absolute -right-4 -top-8 text-white text-[320px] font-bold opacity-20 leading-none">
                    8
                </div>
                <!-- Heart Logo -->
                <div class="absolute bottom-4 right-4 bg-[#CC0001] text-white p-3 rounded-full transform rotate-[-15deg]">
                    <div class="text-center leading-tight">
                        <div class="text-sm">DOK</div>
                        <div class="text-sm font-bold">MUTYA</div>
                        <div class="text-sm font-bold">TIROL</div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>
    </section>
</main>
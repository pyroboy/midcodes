<script lang="ts">
    import Hero from '$lib/components/Hero.svelte';

    let stats = [
        { number: '20+', label: 'Years in Healthcare' },
        { number: '12', label: 'Municipalities Served' },
        { number: '1000+', label: 'Patients Helped' },
        { number: '24/7', label: 'Availability' }
    ];

    let achievements = [
        {
            title: "Healthcare Advocacy",
            description: "Spearheaded initiatives to improve healthcare accessibility in rural areas.",
            icon: "🏥"
        },
        {
            title: "Community Development",
            description: "Led various community development projects focusing on health and wellness.",
            icon: "🌟"
        },
        {
            title: "Medical Missions",
            description: "Organized and participated in numerous medical missions across the province.",
            icon: "⚕️"
        },
        {
            title: "Youth Empowerment",
            description: "Mentored young healthcare professionals and supported educational programs.",
            icon: "👥"
        }
    ];
</script>

<main class="font-inter">
    <Hero />
    
    <!-- Stats Section -->
    <section class="py-16 md:py-24 bg-white">
        <div class="container mx-auto px-4">
            <div class="grid grid-cols-2 md:grid-cols-4 gap-8">
                {#each stats as stat}
                    <div class="text-center">
                        <div class="text-4xl md:text-5xl font-bold text-[#1B4D4C] mb-2">{stat.number}</div>
                        <div class="text-gray-600">{stat.label}</div>
                    </div>
                {/each}
            </div>
        </div>
    </section>

    <!-- Achievements Section -->
    <section class="py-16 md:py-24 bg-gray-50">
        <div class="container mx-auto px-4">
            <h2 class="text-4xl md:text-5xl font-bold text-center mb-16 text-[#1B4D4C]">
                Achievements & Impact
            </h2>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                {#each achievements as achievement}
                    <div class="bg-white p-6 rounded-lg shadow-lg">
                        <div class="text-4xl mb-4">{achievement.icon}</div>
                        <h3 class="text-xl font-bold mb-2 text-[#1B4D4C]">{achievement.title}</h3>
                        <p class="text-gray-600">{achievement.description}</p>
                    </div>
                {/each}
            </div>
        </div>
    </section>

    <!-- Video Section -->
    <section class="py-16 md:py-24 bg-white">
        <div class="container mx-auto px-4">
            <div class="max-w-3xl mx-auto text-center mb-12">
                <h2 class="text-4xl md:text-5xl font-bold mb-6 text-[#1B4D4C]">Watch Our Campaign</h2>
                <p class="text-xl text-gray-600">See how we're making a difference in the community</p>
            </div>
            <div class="aspect-w-16 aspect-h-9 max-w-4xl mx-auto">
                <div class="w-full h-[480px] bg-gray-200 rounded-lg flex items-center justify-center">
                    <span class="text-gray-500">Video Placeholder</span>
                </div>
            </div>
        </div>
    </section>

    <!-- Priorities Section -->
    <section id="priorities" class="py-16 md:py-24 bg-gray-50">
        <div class="container mx-auto px-4">
            <h2 class="text-4xl md:text-5xl font-bold text-center mb-16 text-[#1B4D4C]">
                Our Priorities
            </h2>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
                <!-- Priority 1 -->
                <div class="bg-white p-8 rounded-lg shadow-lg">
                    <div class="text-4xl mb-4">🏥</div>
                    <h3 class="text-2xl font-bold mb-4 text-[#1B4D4C]">Healthcare for All</h3>
                    <p class="text-gray-600 mb-6">
                        Ensuring accessible and quality healthcare services for every Boholano family.
                    </p>
                    <a href="/healthcare" class="text-[#1B4D4C] font-medium hover:underline">Learn More →</a>
                </div>

                <!-- Priority 2 -->
                <div class="bg-white p-8 rounded-lg shadow-lg">
                    <div class="text-4xl mb-4">📚</div>
                    <h3 class="text-2xl font-bold mb-4 text-[#1B4D4C]">Education Support</h3>
                    <p class="text-gray-600 mb-6">
                        Supporting educational programs and scholarships for deserving students.
                    </p>
                    <a href="/education" class="text-[#1B4D4C] font-medium hover:underline">Learn More →</a>
                </div>

                <!-- Priority 3 -->
                <div class="bg-white p-8 rounded-lg shadow-lg">
                    <div class="text-4xl mb-4">💪</div>
                    <h3 class="text-2xl font-bold mb-4 text-[#1B4D4C]">Community Development</h3>
                    <p class="text-gray-600 mb-6">
                        Implementing sustainable projects that improve community well-being.
                    </p>
                    <a href="/community" class="text-[#1B4D4C] font-medium hover:underline">Learn More →</a>
                </div>
            </div>
        </div>
    </section>

    <!-- Biography Section -->
    <section id="biography" class="relative py-16 md:py-24 bg-white overflow-hidden">
        <div class="container mx-auto px-4">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                <div>
                    <h2 class="text-4xl md:text-5xl font-bold mb-6 text-[#1B4D4C]">Meet Dok Mutya</h2>
                    <p class="text-gray-600 text-lg mb-6">
                        With over 20 years of experience in healthcare and public service, Dok Mutya has dedicated her life to improving the well-being of Boholanos.
                    </p>
                    <p class="text-gray-600 text-lg mb-8">
                        Her vision is to create a healthier, more prosperous Bohol where every family has access to quality healthcare and opportunities for growth.
                    </p>
                    <a href="/about" class="inline-block bg-[#1B4D4C] text-white px-8 py-3 rounded-lg hover:bg-opacity-90 transition-all">
                        Read Full Biography
                    </a>
                </div>
                <div class="relative">
                    <img 
                        src="https://i.ibb.co/sjwDsCJ/anang.jpg" 
                        alt="Dok Mutya Portrait" 
                        class="w-full h-auto rounded-lg shadow-xl"
                    />
                    <div class="absolute -bottom-6 -right-6 w-48 h-48 bg-[#3CB4AC] rounded-full -z-10"></div>
                    <div class="absolute -top-6 -left-6 w-32 h-32 bg-[#1B4D4C] rounded-full -z-10"></div>
                </div>
            </div>
        </div>
    </section>
</main>
<script lang="ts">
    import { base } from "$app/paths";
    import { Facebook, Twitter, Instagram, Phone, Mail, MapPin } from 'lucide-svelte';

    const quickLinks = [
        { href: "/about", label: "About" },
        { href: "/priorities", label: "Priorities" },
        { href: "/events", label: "Events" },
        { href: "/contact", label: "Contact" }
    ];

    const programs = [
        { href: "/mothers", label: "Mothers" },
        { href: "/tourism", label: "Tourism" },
        { href: "/youth", label: "Youth" },
        { href: "/agriculture", label: "Agriculture" }
    ];

    const socialLinks = [
        { href: "https://facebook.com", label: "Facebook", icon: Facebook },
        { href: "https://twitter.com", label: "Twitter", icon: Twitter },
        { href: "https://instagram.com", label: "Instagram", icon: Instagram }
    ];
</script>

<footer class="bg-[#1B4D4C] text-white">
    <!-- Programs Navigation -->
    <div class="grid grid-cols-4 text-white border-b border-white/10">
        {#each programs as { href, label }}
            <a 
                href="{base}{href}" 
                class="py-4 text-center hover:bg-[#3CB4AC] transition-all text-lg font-medium"
            >
                {label}
            </a>
        {/each}
    </div>

    <div class="container mx-auto px-4 py-12 md:py-16">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-12">
            <!-- Contact Info -->
            <div>
                <h3 class="text-2xl font-bold mb-6">Contact Us</h3>
                <div class="space-y-3">
                    <p class="flex items-center gap-3">
                        <Phone class="w-5 h-5 text-[#3CB4AC]" />
                        <span>09188888888</span>
                    </p>
                    <p class="flex items-center gap-3">
                        <Mail class="w-5 h-5 text-[#3CB4AC]" />
                        <span>mktm@gmail.com</span>
                    </p>
                    <p class="flex items-center gap-3">
                        <MapPin class="w-5 h-5 text-[#3CB4AC]" />
                        <span>Bohol, Philippines</span>
                    </p>
                </div>
            </div>

            <!-- Quick Links -->
            <div>
                <h3 class="text-2xl font-bold mb-6">Quick Links</h3>
                <ul class="space-y-3">
                    {#each quickLinks as { href, label }}
                        <li>
                            <a 
                                href="{base}{href}" 
                                class="hover:text-[#3CB4AC] transition-colors"
                            >
                                {label}
                            </a>
                        </li>
                    {/each}
                </ul>
            </div>

            <!-- Social Links & CTA -->
            <div>
                <h3 class="text-2xl font-bold mb-6">Follow Us</h3>
                <div class="flex gap-4 mb-8">
                    {#each socialLinks as { href, label, icon: Icon }}
                        <a 
                            href={href}
                            target="_blank"
                            rel="noopener noreferrer"
                            class="bg-[#3CB4AC] hover:bg-[#2A8A84] p-3 rounded-full transition-colors"
                            aria-label={label}
                        >
                            <svelte:component this={Icon} class="w-5 h-5" />
                        </a>
                    {/each}
                </div>
                <button class="w-full bg-[#3CB4AC] hover:bg-[#2A8A84] py-3 px-6 rounded-lg transition-colors text-lg font-medium">
                    Support Dok Mutya
                </button>
            </div>
        </div>
    </div>

    <!-- Copyright -->
    <div class="border-t border-white/10 py-6">
        <div class="container mx-auto px-4 text-center text-white/60">
            <p> {new Date().getFullYear()} Dok Mutya Tirol. All rights reserved.</p>
        </div>
    </div>
</footer>

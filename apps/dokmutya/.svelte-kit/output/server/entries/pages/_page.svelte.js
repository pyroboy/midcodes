import { c as create_ssr_component, e as each } from "../../chunks/ssr.js";
import { e as escape } from "../../chunks/escape.js";
const Page = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let stats = [
    {
      number: "20+",
      label: "Years in Healthcare"
    },
    {
      number: "12",
      label: "Municipalities Served"
    },
    {
      number: "300K+",
      label: "Citizens Reached"
    }
  ];
  let priorities = [
    {
      title: "Modern Healthcare Facilities",
      description: "Upgrading medical equipment and infrastructure"
    },
    {
      title: "Accessible Healthcare",
      description: "Bringing medical services closer to communities"
    },
    {
      title: "Emergency Response",
      description: "Strengthening rapid medical response capabilities"
    }
  ];
  let events = [
    {
      date: "June 15, 2024",
      title: "Medical Mission - Tagbilaran City",
      location: "City Health Office"
    },
    {
      date: "June 22, 2024",
      title: "Healthcare Forum",
      location: "Bohol Cultural Center"
    }
  ];
  return `<main class="font-inter"><section class="relative bg-cover bg-center text-white pt-40 pb-20 -mt-20" style="background-image: url('https://images.unsplash.com/photo-1551076805-e1869033e561?ixlib=rb-1.2.1&amp;auto=format&amp;fit=crop&amp;w=1350&amp;q=80')"><div class="absolute inset-0 bg-gradient-to-br from-blue-900/90 to-cyan-800/80"></div> <div class="relative z-10 container mx-auto px-4 text-center"><h1 class="text-5xl md:text-6xl font-bold mb-4" data-svelte-h="svelte-1i6umnr">Building a Healthier First District</h1> <p class="text-xl md:text-2xl font-light mb-12" data-svelte-h="svelte-tpefon">Leadership that Heals, Experience that Matters</p> <div class="flex flex-col md:flex-row justify-center gap-16 my-12">${each(stats, (stat) => {
    return `<div class="flex flex-col items-center"><span class="text-4xl font-bold text-yellow-400">${escape(stat.number)}</span> <span class="text-base text-white/90">${escape(stat.label)}</span> </div>`;
  })}</div> <div class="flex flex-col md:flex-row gap-4 justify-center" data-svelte-h="svelte-1qjqe26"><a href="#contact" class="inline-block px-8 py-4 bg-blue-600 text-white font-semibold uppercase tracking-wider text-sm rounded hover:bg-blue-500 transform hover:-translate-y-0.5 transition-all">Join Our Campaign</a> <a href="#priorities" class="inline-block px-8 py-4 border-2 border-white text-white font-semibold uppercase tracking-wider text-sm rounded hover:bg-white/10 transform hover:-translate-y-0.5 transition-all">Learn More</a></div></div></section> <section id="about" class="py-20" data-svelte-h="svelte-7p1knj"><div class="container mx-auto px-4"><div class="text-center mb-16"><h2 class="text-3xl font-bold">Mission &amp; Vision</h2> <div class="w-16 h-1 bg-blue-600 mx-auto mt-4"></div></div> <div class="grid md:grid-cols-2 gap-12"><div class="bg-white p-8 rounded-lg shadow-lg hover:-translate-y-1 transition-transform"><div class="text-2xl font-semibold text-blue-600 mb-4">Mission</div> <p class="text-gray-700">To provide accessible, quality healthcare services to every citizen of Bohol&#39;s First District through innovative programs and dedicated leadership.</p></div> <div class="bg-white p-8 rounded-lg shadow-lg hover:-translate-y-1 transition-transform"><div class="text-2xl font-semibold text-blue-600 mb-4">Vision</div> <p class="text-gray-700">A First District where every resident has access to modern, efficient, and compassionate healthcare services.</p></div></div></div></section> <section id="priorities" class="bg-gray-50 py-20"><div class="container mx-auto px-4"><div class="text-center mb-16" data-svelte-h="svelte-plxxb9"><h2 class="text-3xl font-bold">Healthcare Priorities</h2> <div class="w-16 h-1 bg-blue-600 mx-auto mt-4"></div></div> <div class="grid md:grid-cols-3 gap-8">${each(priorities, (priority) => {
    return `<div class="bg-white p-8 rounded-lg shadow-md hover:-translate-y-1 transition-transform"><h3 class="text-xl font-semibold mb-4">${escape(priority.title)}</h3> <div class="w-10 h-0.5 bg-blue-600 mb-4"></div> <p class="text-gray-600">${escape(priority.description)}</p> </div>`;
  })}</div></div></section> <section id="events" class="py-20"><div class="container mx-auto px-4"><div class="text-center mb-16" data-svelte-h="svelte-17e3h93"><h2 class="text-3xl font-bold">Upcoming Events</h2> <div class="w-16 h-1 bg-blue-600 mx-auto mt-4"></div></div> <div class="grid md:grid-cols-2 gap-8">${each(events, (event) => {
    return `<div class="bg-white p-8 rounded-lg shadow-md"><div class="text-lg font-semibold text-blue-600">${escape(event.date)}</div> <h3 class="text-xl font-semibold mt-2">${escape(event.title)}</h3> <div class="w-10 h-0.5 bg-blue-600 my-4"></div> <p class="text-gray-600">${escape(event.location)}</p> </div>`;
  })}</div></div></section> <section id="contact" class="bg-gray-50 py-20" data-svelte-h="svelte-1c2qkty"><div class="container mx-auto px-4"><div class="text-center mb-16"><h2 class="text-3xl font-bold">Contact Us</h2> <div class="w-16 h-1 bg-blue-600 mx-auto mt-4"></div></div> <div class="grid md:grid-cols-2 gap-16"><div><div class="bg-white p-8 rounded-lg shadow-md mb-8"><h3 class="text-xl font-semibold mb-4">Campaign Headquarters</h3> <div class="w-10 h-0.5 bg-blue-600 mb-4"></div> <p class="text-gray-600 mb-2">123 Main Street, Tagbilaran City, Bohol</p> <p class="text-gray-600 mb-2">Hotline: (038) 411-2345</p> <p class="text-gray-600 mb-2">Mobile: +63 912 345 6789</p> <p class="text-gray-600">Email: info@mariasantos.ph</p></div> <div class="flex gap-4"><a href="https://facebook.com" target="_blank" rel="noopener noreferrer" class="flex-1 px-6 py-3 bg-white text-blue-600 font-medium rounded shadow-sm hover:bg-blue-600 hover:text-white transition-colors text-center">Facebook</a> <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" class="flex-1 px-6 py-3 bg-white text-blue-600 font-medium rounded shadow-sm hover:bg-blue-600 hover:text-white transition-colors text-center">Twitter</a> <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" class="flex-1 px-6 py-3 bg-white text-blue-600 font-medium rounded shadow-sm hover:bg-blue-600 hover:text-white transition-colors text-center">LinkedIn</a></div></div> <form class="space-y-6"><div><label for="name" class="block text-sm font-medium text-gray-700 mb-2">Full Name</label> <input type="text" id="name" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent" required></div> <div><label for="email" class="block text-sm font-medium text-gray-700 mb-2">Email Address</label> <input type="email" id="email" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent" required></div> <div><label for="message" class="block text-sm font-medium text-gray-700 mb-2">Message</label> <textarea id="message" rows="4" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent" required></textarea></div> <button type="submit" class="w-full px-8 py-4 bg-blue-600 text-white font-semibold uppercase tracking-wider text-sm rounded hover:bg-blue-500 transform hover:-translate-y-0.5 transition-all">Send Message</button></form></div></div></section></main>`;
});
export {
  Page as default
};

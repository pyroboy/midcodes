<script lang="ts">
  import { onMount } from 'svelte';

  let features = [
    {
      title: 'Request Transcripts',
      description: 'Submit requests for official academic transcripts online',
      icon: '📝'
    },
    {
      title: 'Track Status',
      description: 'Monitor the progress of your transcript requests in real-time',
      icon: '🔍'
    },
    {
      title: 'Secure Processing',
      description: 'Your academic records are handled with utmost security and confidentiality',
      icon: '🔒'
    },
    {
      title: 'Fast Delivery',
      description: 'Quick processing and multiple delivery options available',
      icon: '🚀'
    }
  ];
</script>

<div class="py-12 bg-white">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div class="lg:text-center">
      <h2 class="text-base text-indigo-600 font-semibold tracking-wide uppercase">Transcript System</h2>
      <p class="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-gray-900 sm:text-4xl">
        Request Your Academic Transcripts Online
      </p>
      <p class="mt-4 max-w-2xl text-xl text-gray-500 lg:mx-auto">
        A simple and secure way to request and track your academic transcripts.
      </p>
    </div>

    <div class="mt-10">
      <dl class="space-y-10 md:space-y-0 md:grid md:grid-cols-2 md:gap-x-8 md:gap-y-10">
        {#each features as feature}
          <div class="relative">
            <dt>
              <div class="absolute flex items-center justify-center h-12 w-12 rounded-md bg-indigo-500 text-white text-2xl">
                {feature.icon}
              </div>
              <p class="ml-16 text-lg leading-6 font-medium text-gray-900">{feature.title}</p>
            </dt>
            <dd class="mt-2 ml-16 text-base text-gray-500">
              {feature.description}
            </dd>
          </div>
        {/each}
      </dl>
    </div>

    <div class="mt-10 flex justify-center space-x-6">
      <a
        href="/request"
        class="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
      >
        Request Transcript
      </a>
      <a
        href="/status"
        class="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200"
      >
        Check Status
      </a>
    </div>
  </div>
</div>
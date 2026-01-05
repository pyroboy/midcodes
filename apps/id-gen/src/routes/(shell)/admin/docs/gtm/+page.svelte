<script lang="ts">
  import type { PageData } from './$types';
  export let data: PageData;
  $: ({ ...$props() } = data);
</script>

<svelte:head>
  <title>Master GTM Launch Roadmap | Admin Docs</title>
</svelte:head>

<div class="gtm-roadmap">
  <header class="mb-8">
    <h1 class="text-3xl font-bold text-gray-900 dark:text-white mb-2">Master GTM Launch Roadmap</h1>
    <p class="text-gray-600 dark:text-gray-300">Comprehensive go-to-market strategy and execution plan</p>
  </header>

  <div class="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 p-4 mb-8 rounded-r">
    <div class="flex">
      <div class="flex-shrink-0">
        <svg class="h-5 w-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h2a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" />
        </svg>
      </div>
      <div class="ml-3">
        <h3 class="text-sm font-medium text-blue-800 dark:text-blue-200">Strategic Overview</h3>
        <div class="mt-2 text-sm text-blue-700 dark:text-blue-300">
          <p>This document outlines our phased approach to launching our product, from initial market validation to full-scale growth. Each phase has specific objectives, KPIs, and resource allocations.</p>
        </div>
      </div>
    </div>
  </div>

  <div class="mb-12">
    <h2 class="text-2xl font-semibold text-gray-800 dark:text-white mb-6">Phase 1: Foundation (Weeks 1-4)</h2>
    
    <div class="grid md:grid-cols-3 gap-6 mb-8">
      <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
        <h3 class="font-medium text-lg text-gray-900 dark:text-white mb-3">Market Research</h3>
        <ul class="space-y-2">
          <li class="flex items-start">
            <svg class="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
            <span>Complete competitive analysis</span>
          </li>
          <li class="flex items-start">
            <svg class="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
            <span>Finalize customer personas</span>
          </li>
          <li class="flex items-start">
            <svg class="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
            <span>Define value proposition</span>
          </li>
        </ul>
      </div>

      <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
        <h3 class="font-medium text-lg text-gray-900 dark:text-white mb-3">Brand Development</h3>
        <ul class="space-y-2">
          <li class="flex items-start">
            <svg class="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
            <span>Finalize brand guidelines</span>
          </li>
          <li class="flex items-start">
            <svg class="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
            <span>Design key marketing assets</span>
          </li>
          <li class="flex items-start">
            <svg class="h-5 w-5 text-yellow-500 mr-2 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Develop brand voice guide</span>
          </li>
        </ul>
      </div>

      <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
        <h3 class="font-medium text-lg text-gray-900 dark:text-white mb-3">Infrastructure</h3>
        <ul class="space-y-2">
          <li class="flex items-start">
            <svg class="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
            <span>Set up analytics</span>
          </li>
          <li class="flex items-start">
            <svg class="h-5 w-5 text-yellow-500 mr-2 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Implement CRM</span>
          </li>
          <li class="flex items-start">
            <svg class="h-5 w-5 text-red-500 mr-2 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
            <span>Marketing automation setup</span>
          </li>
        </ul>
      </div>
    </div>

    <div class="mb-8">
      <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-3">Success Metrics</h3>
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead class="bg-gray-50 dark:bg-gray-800">
            <tr>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">KPI</th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Target</th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Current</th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
            </tr>
          </thead>
          <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            <tr>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-200">Market Research Completion</td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">100%</td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">85%</td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100">In Progress</span>
              </td>
            </tr>
            <tr>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-200">Brand Assets Ready</td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">100%</td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">60%</td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100">In Progress</span>
              </td>
            </tr>
            <tr>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-200">Tech Stack Implementation</td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">100%</td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">40%</td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100">Delayed</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>

  <div class="mb-12">
    <h2 class="text-2xl font-semibold text-gray-800 dark:text-white mb-6">Phase 2: Soft Launch (Weeks 5-8)</h2>
    
    <div class="grid md:grid-cols-2 gap-6 mb-8">
      <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
        <h3 class="font-medium text-lg text-gray-900 dark:text-white mb-3">Pilot Program</h3>
        <ul class="space-y-2">
          <li class="flex items-start">
            <svg class="h-5 w-5 text-gray-300 mr-2 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Recruit beta testers</span>
          </li>
          <li class="flex items-start">
            <svg class="h-5 w-5 text-gray-300 mr-2 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Gather feedback</span>
          </li>
          <li class="flex items-start">
            <svg class="h-5 w-5 text-gray-300 mr-2 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Iterate on product</span>
          </li>
        </ul>
      </div>

      <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
        <h3 class="font-medium text-lg text-gray-900 dark:text-white mb-3">Initial Marketing</h3>
        <ul class="space-y-2">
          <li class="flex items-start">
            <svg class="h-5 w-5 text-gray-300 mr-2 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Launch landing page</span>
          </li>
          <li class="flex items-start">
            <svg class="h-5 w-5 text-gray-300 mr-2 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Start content marketing</span>
          </li>
          <li class="flex items-start">
            <svg class="h-5 w-5 text-gray-300 mr-2 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Begin paid acquisition</span>
          </li>
        </ul>
      </div>
    </div>

    <div class="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-lg mb-8">
      <h3 class="text-lg font-medium text-blue-800 dark:text-blue-200 mb-3">Key Dependencies</h3>
      <ul class="list-disc pl-5 space-y-1 text-blue-700 dark:text-blue-300">
        <li>Completion of Phase 1 infrastructure setup</li>
        <li>Core product features fully functional</li>
        <li>Analytics and tracking in place</li>
        <li>Support systems ready</li>
      </ul>
    </div>
  </div>

  <div class="mb-12">
    <h2 class="text-2xl font-semibold text-gray-800 dark:text-white mb-6">Phase 3: Scale (Weeks 9-16)</h2>
    
    <div class="grid md:grid-cols-3 gap-6 mb-8">
      <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
        <h3 class="font-medium text-lg text-gray-900 dark:text-white mb-3">Marketing Expansion</h3>
        <ul class="space-y-2">
          <li>Scale paid campaigns</li>
          <li>Partnership development</li>
          <li>Referral program launch</li>
        </ul>
      </div>

      <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
        <h3 class="font-medium text-lg text-gray-900 dark:text-white mb-3">Product Growth</h3>
        <ul class="space-y-2">
          <li>Feature prioritization</li>
          <li>User feedback implementation</li>
          <li>Performance optimization</li>
        </ul>
      </div>

      <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
        <h3 class="font-medium text-lg text-gray-900 dark:text-white mb-3">Team Scaling</h3>
        <ul class="space-y-2">
          <li>Hire additional staff</li>
          <li>Process documentation</li>
          <li>Team training</li>
        </ul>
      </div>
    </div>

    <div class="bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-400 p-4 mb-8 rounded-r">
      <div class="flex">
        <div class="flex-shrink-0">
          <svg class="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
          </svg>
        </div>
        <div class="ml-3">
          <h3 class="text-sm font-medium text-yellow-800 dark:text-yellow-200">Scaling Considerations</h3>
          <div class="mt-2 text-sm text-yellow-700 dark:text-yellow-300">
            <p>Monitor infrastructure closely during scaling phase. Be prepared to adjust resources based on user growth and feedback.</p>
          </div>
        </div>
      </div>
    </div>
  </div>

  <div class="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-lg mb-8">
    <div class="px-4 py-5 sm:px-6">
      <h3 class="text-lg leading-6 font-medium text-gray-900 dark:text-white">GTM Timeline Overview</h3>
      <p class="mt-1 max-w-2xl text-sm text-gray-500 dark:text-gray-400">Key milestones and deliverables by phase</p>
    </div>
    <div class="border-t border-gray-200 dark:border-gray-700">
      <dl>
        <div class="bg-gray-50 dark:bg-gray-700 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
          <dt class="text-sm font-medium text-gray-500 dark:text-gray-300">Phase 1: Foundation</dt>
          <dd class="mt-1 text-sm text-gray-900 dark:text-white sm:mt-0 sm:col-span-2">
            <p>Weeks 1-4: Market research, brand development, and infrastructure setup</p>
          </dd>
        </div>
        <div class="bg-white dark:bg-gray-800 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
          <dt class="text-sm font-medium text-gray-500 dark:text-gray-300">Phase 2: Soft Launch</dt>
          <dd class="mt-1 text-sm text-gray-900 dark:text-white sm:mt-0 sm:col-span-2">
            <p>Weeks 5-8: Beta testing, initial marketing, and feedback collection</p>
          </dd>
        </div>
        <div class="bg-gray-50 dark:bg-gray-700 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
          <dt class="text-sm font-medium text-gray-500 dark:text-gray-300">Phase 3: Scale</dt>
          <dd class="mt-1 text-sm text-gray-900 dark:text-white sm:mt-0 sm:col-span-2">
            <p>Weeks 9-16: Marketing expansion, product growth, and team scaling</p>
          </dd>
        </div>
      </dl>
    </div>
  </div>

  <div class="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-lg">
    <div class="px-4 py-5 sm:px-6">
      <h3 class="text-lg leading-6 font-medium text-gray-900 dark:text-white">Risk Assessment</h3>
      <p class="mt-1 max-w-2xl text-sm text-gray-500 dark:text-gray-400">Potential challenges and mitigation strategies</p>
    </div>
    <div class="border-t border-gray-200 dark:border-gray-700">
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead class="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Risk</th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Impact</th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Likelihood</th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Mitigation</th>
            </tr>
          </thead>
          <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            <tr>
              <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">Market Saturation</td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">High</td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">Medium</td>
              <td class="px-6 py-4 text-sm text-gray-900 dark:text-gray-200">Differentiate through unique value proposition and targeted messaging</td>
            </tr>
            <tr>
              <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">Technical Issues</td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">High</td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">Low</td>
              <td class="px-6 py-4 text-sm text-gray-900 dark:text-gray-200">Comprehensive testing and monitoring systems</td>
            </tr>
            <tr>
              <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">Budget Overruns</td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">Medium</td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">Medium</td>
              <td class="px-6 py-4 text-sm text-gray-900 dark:text-gray-200">Regular budget reviews and contingency planning</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</div>

<style>
  .gtm-roadmap {
    max-width: 1200px;
    margin: 0 auto;
    padding: 2rem 1rem;
  }
  
  @media (min-width: 768px) {
    .gtm-roadmap {
      padding: 3rem 2rem;
    }
  }
  
  .gtm-roadmap h2 {
    border-bottom: 1px solid #e5e7eb;
    padding-bottom: 0.5rem;
  }
  
  .gtm-roadmap h3 {
    margin-top: 1.5rem;
  }
  
  .gtm-roadmap ul {
    margin-top: 0.5rem;
    padding-left: 1.5rem;
  }
  
  .gtm-roadmap li {
    margin-bottom: 0.5rem;
  }
  
  /* Dark mode overrides */
  .dark .gtm-roadmap h2 {
    border-color: #374151;
  }
  
  .dark .gtm-roadmap {
    color: #e5e7eb;
  }
  
  .dark .gtm-roadmap h1,
  .dark .gtm-roadmap h2,
  .dark .gtm-roadmap h3 {
    color: #f9fafb;
  }
</style>

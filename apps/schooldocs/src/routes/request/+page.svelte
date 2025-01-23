<script lang="ts">
  import { onMount } from 'svelte';

  let formData = {
    studentId: '',
    fullName: '',
    email: '',
    program: '',
    yearLevel: '',
    purpose: '',
    copies: 1,
    deliveryMethod: 'pickup'
  };

  let isSubmitting = false;
  let submitError = '';
  let submitSuccess = false;

  async function handleSubmit() {
    isSubmitting = true;
    submitError = '';
    submitSuccess = false;

    try {
      // TODO: Implement actual API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      submitSuccess = true;
      formData = {
        studentId: '',
        fullName: '',
        email: '',
        program: '',
        yearLevel: '',
        purpose: '',
        copies: 1,
        deliveryMethod: 'pickup'
      };
    } catch (error) {
      submitError = 'Failed to submit request. Please try again.';
    } finally {
      isSubmitting = false;
    }
  }
</script>

<div class="py-6">
  <div class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
    <h1 class="text-2xl font-semibold text-gray-900">Request Transcript</h1>
    <p class="mt-2 text-sm text-gray-600">
      Fill out the form below to request your academic transcript.
    </p>

    {#if submitSuccess}
      <div class="mt-4 p-4 bg-green-50 rounded-md">
        <p class="text-green-700">
          Your transcript request has been submitted successfully. You can track its status using your student ID.
        </p>
      </div>
    {/if}

    {#if submitError}
      <div class="mt-4 p-4 bg-red-50 rounded-md">
        <p class="text-red-700">{submitError}</p>
      </div>
    {/if}

    <form on:submit|preventDefault={handleSubmit} class="mt-6 space-y-6">
      <div>
        <label for="studentId" class="block text-sm font-medium text-gray-700">Student ID</label>
        <input
          type="text"
          id="studentId"
          bind:value={formData.studentId}
          required
          class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
        />
      </div>

      <div>
        <label for="fullName" class="block text-sm font-medium text-gray-700">Full Name</label>
        <input
          type="text"
          id="fullName"
          bind:value={formData.fullName}
          required
          class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
        />
      </div>

      <div>
        <label for="email" class="block text-sm font-medium text-gray-700">Email</label>
        <input
          type="email"
          id="email"
          bind:value={formData.email}
          required
          class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
        />
      </div>

      <div>
        <label for="program" class="block text-sm font-medium text-gray-700">Program</label>
        <input
          type="text"
          id="program"
          bind:value={formData.program}
          required
          class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
        />
      </div>

      <div>
        <label for="yearLevel" class="block text-sm font-medium text-gray-700">Year Level</label>
        <input
          type="text"
          id="yearLevel"
          bind:value={formData.yearLevel}
          required
          class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
        />
      </div>

      <div>
        <label for="purpose" class="block text-sm font-medium text-gray-700">Purpose</label>
        <textarea
          id="purpose"
          bind:value={formData.purpose}
          required
          rows="3"
          class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
        ></textarea>
      </div>

      <div>
        <label for="copies" class="block text-sm font-medium text-gray-700">Number of Copies</label>
        <input
          type="number"
          id="copies"
          bind:value={formData.copies}
          min="1"
          required
          class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
        />
      </div>

      <div>
        <label for="deliveryMethod" class="block text-sm font-medium text-gray-700">Delivery Method</label>
        <select
          id="deliveryMethod"
          bind:value={formData.deliveryMethod}
          required
          class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
        >
          <option value="pickup">Pickup</option>
          <option value="courier">Courier</option>
          <option value="email">Email (Digital Copy)</option>
        </select>
      </div>

      <div class="pt-5">
        <button
          type="submit"
          disabled={isSubmitting}
          class="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
        >
          {isSubmitting ? 'Submitting...' : 'Submit Request'}
        </button>
      </div>
    </form>
  </div>
</div>
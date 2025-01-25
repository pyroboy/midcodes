<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  export let student: {
    id: string;
    studentNumber: string;
    name: string;
    course: string;
    yearLevel: string;
    status: string;
    uploadedAt: string;
  };
  export let show = false;

  let showFlagOptions = false;
  let selectedFlag = '';
  let flagReason = '';

  const flagOptions = [
    { value: 'invalid_data', label: 'Invalid or Incomplete Data' },
    { value: 'suspicious', label: 'Suspicious Entry' },
    { value: 'duplicate', label: 'Duplicate Record' },
    { value: 'deceased', label: 'Student Deceased' },
    { value: 'old_record', label: 'Outdated Record' },
    { value: 'other', label: 'Other' }
  ];

  const dispatch = createEventDispatcher();

  function closeModal() {
    showFlagOptions = false;
    selectedFlag = '';
    flagReason = '';
    dispatch('close');
  }

  async function handleVerify() {
    dispatch('verify', student.id);
    closeModal();
  }

  async function handleFlag() {
    if (!selectedFlag) return;
    dispatch('flag', {
      studentId: student.id,
      reason: selectedFlag,
      comment: flagReason
    });
    closeModal();
  }
</script>

{#if show}
  <div class="fixed inset-0 z-10 overflow-y-auto">
    <div class="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
      <!-- Add role and keyboard event handler for the backdrop -->
      <div 
        class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" 
        role="button"
        tabindex="0"
        on:click={closeModal}
        on:keydown={e => e.key === 'Escape' && closeModal()}
      ></div>

      <div class="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
        <div>
          <div class="mt-3 text-center sm:mt-5">
            <h3 class="text-lg font-semibold leading-6 text-gray-900">
              Verify Student
            </h3>
            <div class="mt-4">
              <dl class="space-y-4 text-left">
                <div>
                  <dt class="text-sm font-medium text-gray-700">Student Number</dt>
                  <dd class="mt-1 text-sm text-gray-900">{student.studentNumber}</dd>
                </div>
                <div>
                  <dt class="text-sm font-medium text-gray-700">Name</dt>
                  <dd class="mt-1 text-sm text-gray-900">{student.name}</dd>
                </div>
                <div>
                  <dt class="text-sm font-medium text-gray-700">Course</dt>
                  <dd class="mt-1 text-sm text-gray-900">{student.course}</dd>
                </div>
                <div>
                  <dt class="text-sm font-medium text-gray-700">Year Level</dt>
                  <dd class="mt-1 text-sm text-gray-900">{student.yearLevel}</dd>
                </div>
                <div>
                  <dt class="text-sm font-medium text-gray-700">Upload Date</dt>
                  <dd class="mt-1 text-sm text-gray-900">{new Date(student.uploadedAt).toLocaleDateString()}</dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
        <!-- Flag Options Section -->
        {#if showFlagOptions}
          <div class="mt-4 space-y-4">
            <div>
              <label for="flag-reason" class="block text-sm font-medium text-gray-700">Flag Reason</label>
              <select
                id="flag-reason"
                bind:value={selectedFlag}
                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              >
                <option value="">Select a reason</option>
                {#each flagOptions as option}
                  <option value={option.value}>{option.label}</option>
                {/each}
              </select>
            </div>
        
            <div>
              <label for="flag-comment" class="block text-sm font-medium text-gray-700">Additional Comments</label>
              <textarea
                id="flag-comment"
                bind:value={flagReason}
                rows="3"
                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                placeholder="Add any additional details..."
              ></textarea>
            </div>
        
            <div class="mt-5 sm:mt-6 sm:grid sm:grid-flow-row-dense sm:grid-cols-2 sm:gap-3">
              <button
                type="button"
                class="inline-flex w-full justify-center rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500 sm:col-start-2"
                on:click={handleFlag}
              >
                Flag Student
              </button>
              <button
                type="button"
                class="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:col-start-1 sm:mt-0"
                on:click={() => showFlagOptions = false}
              >
                Back
              </button>
            </div>
          </div>
        {:else}
          <div class="mt-5 sm:mt-6 sm:grid sm:grid-flow-row-dense sm:grid-cols-3 sm:gap-3">
            <button
              type="button"
              class="inline-flex w-full justify-center rounded-md bg-green-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-green-500 sm:col-start-3"
              on:click={handleVerify}
            >
              Verify
            </button>
            <button
              type="button"
              class="inline-flex w-full justify-center rounded-md bg-yellow-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-yellow-500 sm:col-start-2"
              on:click={() => showFlagOptions = true}
            >
              Flag
            </button>
            <button
              type="button"
              class="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:col-start-1 sm:mt-0"
              on:click={closeModal}
            >
              Cancel
            </button>
          </div>
        {/if}
      </div>
    </div>
  </div>
{/if}
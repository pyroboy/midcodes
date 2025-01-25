<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import StatusSection from './sections/StatusSection.svelte';
  import DocumentInfo from './sections/DocumentInfo.svelte';
  import ProcessingSteps from './sections/ProcessingSteps.svelte';
  import FlagManager from './sections/FlagManager.svelte';
  import type { Flags, ProcessingStep, FlagOptions, FlagEventDetail } from '$lib/types/requestTypes';

  const dispatch = createEventDispatcher();

  let showFlagSelector = false;
  let flags: Flags = {
    blocking: ['UNVERIFIABLE'],
    nonBlocking: ['PRIORITY']
  };
  let flagNotes = '';

  let steps: ProcessingStep[] = [
    { step: 'Verify info', done: true },
    { step: 'Check requirements', done: false },
    { step: 'Prepare template', done: false },
    { step: 'Print document', done: false },
    { step: 'Quality check', done: false },
    { step: 'Record', done: false }
  ];

  const flagOptions: FlagOptions = {
    blocking: [
      { id: 'UNVERIFIABLE', label: 'Unverifiable Information' },
      { id: 'INCOMPLETE', label: 'Incomplete Requirements' },
      { id: 'EXPIRED', label: 'Expired Documents' },
      { id: 'INVALID_ID', label: 'Invalid Identification' }
    ],
    nonBlocking: [
      { id: 'PRIORITY', label: 'Priority Processing' },
      { id: 'RUSH', label: 'Rush Request' },
      { id: 'SPECIAL_HANDLING', label: 'Special Handling' },
      { id: 'NEEDS_REVIEW', label: 'Needs Review' }
    ]
  };

  function handleAddFlag(event: CustomEvent<FlagEventDetail>) {
    const { type, flagId } = event.detail;
    if (flagId && !flags[type].includes(flagId)) {
      flags[type] = [...flags[type], flagId];
      showFlagSelector = false;
    }
  }

  function handleRemoveFlag(event: CustomEvent<FlagEventDetail>) {
    const { type, flag } = event.detail;
    if (flag) {
      flags[type] = flags[type].filter((f: string) => f !== flag);
      flags = flags;
    }
  }

  function toggleStep(index: number) {
    const nextUndoneIndex = steps.findIndex(step => !step.done);
    
    if (index === nextUndoneIndex || (index === nextUndoneIndex - 1 && steps[index].done)) {
      steps[index].done = !steps[index].done;
      steps = steps;
    }
  }

  $: hasBlockingFlag = flags.blocking.length > 0;
  $: hasNonBlockingFlag = flags.nonBlocking.length > 0;
  $: completedSteps = steps.filter(step => step.done).length;
  $: totalSteps = steps.length;
</script>

<div class="min-h-screen w-full bg-gray-100 p-8 flex items-center justify-center">
  <div class={`w-full max-w-7xl aspect-[16/9] bg-white rounded-xl shadow-lg p-6 ${
    hasBlockingFlag && hasNonBlockingFlag
      ? 'border-2 border-yellow-400 outline outline-2 outline-red-500'
      : hasBlockingFlag
      ? 'border-4 border-red-500'
      : hasNonBlockingFlag
      ? 'border-4 border-yellow-400'
      : ''
  }`}>
    <div class="h-full grid grid-rows-[auto_1fr_auto] gap-4">
      <!-- Top Section -->
      <div class="grid gap-4">
        <StatusSection
          {hasBlockingFlag}
          {hasNonBlockingFlag}
          blockingFlag={flags.blocking[0]}
          nonBlockingFlag={flags.nonBlocking[0]}
          {completedSteps}
          {totalSteps}
          {flagNotes}
        />

        <DocumentInfo
          referenceNumber="REF-2024-001"
          documentType="Transcript of Records"
          copies={2}
          amount={600}
          paymentDate="2024-02-15"
          studentName="John Doe"
          studentId="2020-00001"
          purpose="Employment"
          status="Processing"
        />
      </div>

      <!-- Middle Section -->
      <div class="grid md:grid-cols-3 gap-4">
        <div class="md:col-span-2"></div>
        <ProcessingSteps
          {steps}
          onToggle={toggleStep}
        />
      </div>

      <!-- Bottom Section -->
      <FlagManager
        {showFlagSelector}
        {flags}
        {flagOptions}
        {flagNotes}
        onToggleSelector={() => showFlagSelector = !showFlagSelector}
        onAddFlag={handleAddFlag}
        onRemoveFlag={handleRemoveFlag}
      />
    </div>
  </div>
</div>
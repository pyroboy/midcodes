import { writable, get } from 'svelte/store';
import type { ProcessingStep } from '$lib/types/print-steps';

type StepsStore = {
  [key: string]: ProcessingStep[];
};

function createDocumentSteps() {
  const { subscribe, set, update } = writable<StepsStore>({});

  return {
    subscribe,
    initialize: (referenceNumber: string) => {
      const defaultSteps: ProcessingStep[] = [
        {
          id: crypto.randomUUID(),
          request_id: referenceNumber,
          step_number: 1,
          name: 'Verify student information',
          status: 'pending'
        },
        {
          id: crypto.randomUUID(),
          request_id: referenceNumber,
          step_number: 2,
          name: 'Check document requirements',
          status: 'pending'
        },
        {
          id: crypto.randomUUID(),
          request_id: referenceNumber,
          step_number: 3,
          name: 'Prepare document template',
          status: 'pending'
        },
        {
          id: crypto.randomUUID(),
          request_id: referenceNumber,
          step_number: 4,
          name: 'Print document',
          status: 'pending'
        },
        {
          id: crypto.randomUUID(),
          request_id: referenceNumber,
          step_number: 5,
          name: 'Quality check',
          status: 'pending'
        },
        {
          id: crypto.randomUUID(),
          request_id: referenceNumber,
          step_number: 6,
          name: 'Record in logbook',
          status: 'pending'
        }
      ];

      update(store => ({
        ...store,
        [referenceNumber]: defaultSteps
      }));
    },
    toggleStep: (referenceNumber: string, stepId: string) => {
      update(store => {
        const steps = store[referenceNumber];
        if (!steps) return store;

        return {
          ...store,
          [referenceNumber]: steps.map(step =>
            step.id === stepId 
              ? { ...step, status: step.status === 'completed' ? 'pending' : 'completed' }
              : step
          )
        };
      });
    }
  };
}

export const documentSteps = createDocumentSteps();
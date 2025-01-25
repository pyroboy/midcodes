import { writable, get } from 'svelte/store';
import type { EnhancedFlagsStore, EnhancedStepsStore, RequestMetadata, StoreAction, EnhancedPrintRequest } from '$lib/types/enhanced-request-types';
import type { FlagOption, ProcessingStep } from '$lib/types/requestTypes';
import { MockPrintRequestService, type PrintRequestService } from '$lib/services/print-request.service';
import { mockPrintRequests } from '$lib/data/mock-print-requests';

// Default steps for new requests
const DEFAULT_STEPS: ProcessingStep[] = [
  { step: 'Verify info', done: false },
  { step: 'Check requirements', done: false },
  { step: 'Prepare template', done: false },
  { step: 'Print document', done: false },
  { step: 'Quality check', done: false },
  { step: 'Record', done: false }
];

function createEnhancedRequestStore() {
  const flags = writable<EnhancedFlagsStore>({});
  const steps = writable<EnhancedStepsStore>({});
  const metadata = writable<Record<string, RequestMetadata>>({});
  const requests = writable<EnhancedPrintRequest[]>([]);
  const service: PrintRequestService = new MockPrintRequestService();

  const createDefaultFlags = () => ({
    blocking: [],
    nonBlocking: [],
    notes: '',
    timestamp: new Date().toISOString()
  });

  const createDefaultSteps = () => ({
    steps: DEFAULT_STEPS.map(step => ({ ...step })),
    currentStep: 0,
    lastUpdated: new Date().toISOString()
  });

  // Initialize store with mock data
  const initializeStore = () => {
    mockPrintRequests.forEach(request => {
      // Initialize metadata
      metadata.update(store => ({
        ...store,
        [request.reference_number]: {
          referenceNumber: request.reference_number,
          documentType: request.document_type,
          studentName: request.student_name,
          studentNumber: request.student_number,
          createdAt: request.created_at
        }
      }));

      // Initialize flags
      flags.update(store => ({
        ...store,
        [request.reference_number]: request.flags || createDefaultFlags()
      }));

      // Initialize steps
      steps.update(store => ({
        ...store,
        [request.reference_number]: request.steps || createDefaultSteps()
      }));
    });

    // Set initial requests
    requests.set(mockPrintRequests);
  };

  // Call initialization
  initializeStore();

  return {
    // Request operations
    requests: {
      subscribe: requests.subscribe,
      addRequest: async (request: EnhancedPrintRequest) => {
        try {
          await service.updatePrintRequest(request);
          requests.update(store => [...store, request]);
          
          // Initialize metadata
          metadata.update(store => ({
            ...store,
            [request.reference_number]: {
              referenceNumber: request.reference_number,
              documentType: request.document_type,
              studentName: request.student_name,
              studentNumber: request.student_number,
              createdAt: request.created_at
            }
          }));

          // Initialize flags
          flags.update(store => ({
            ...store,
            [request.reference_number]: request.flags || createDefaultFlags()
          }));

          // Initialize steps
          steps.update(store => ({
            ...store,
            [request.reference_number]: request.steps || createDefaultSteps()
          }));
        } catch (error) {
          console.error('Failed to add request:', error);
          throw error;
        }
      }
    },

    // Flag operations
    flags: {
      subscribe: flags.subscribe,
      addFlag: async (referenceNumber: string, type: 'blocking' | 'nonBlocking', flag: FlagOption) => {
        try {
          await service.addFlag(referenceNumber, type, flag);
          flags.update(store => {
            const current = store[referenceNumber] || createDefaultFlags();

            return {
              ...store,
              [referenceNumber]: {
                ...current,
                [type]: [...current[type], flag],
                timestamp: new Date().toISOString()
              }
            };
          });
        } catch (error) {
          console.error('Failed to add flag:', error);
          throw error;
        }
      },
      removeFlag: async (referenceNumber: string, type: 'blocking' | 'nonBlocking', flagId: string) => {
        try {
          await service.removeFlag(referenceNumber, type, flagId);
          flags.update(store => {
            const current = store[referenceNumber];
            if (!current) return store;

            return {
              ...store,
              [referenceNumber]: {
                ...current,
                [type]: current[type].filter(f => f.id !== flagId),
                timestamp: new Date().toISOString()
              }
            };
          });
        } catch (error) {
          console.error('Failed to remove flag:', error);
          throw error;
        }
      },
      updateNotes: async (referenceNumber: string, notes: string) => {
        try {
          await service.updateNotes(referenceNumber, notes);
          flags.update(store => {
            const current = store[referenceNumber] || createDefaultFlags();
            if (!current) return store;

            return {
              ...store,
              [referenceNumber]: {
                ...current,
                notes,
                timestamp: new Date().toISOString()
              }
            };
          });
        } catch (error) {
          console.error('Failed to update notes:', error);
          throw error;
        }
      }
    },

    // Steps operations
    steps: {
      subscribe: steps.subscribe,
      initialize: async (referenceNumber: string) => {
        try {
          const request = await service.getPrintRequest(referenceNumber);
          steps.update(store => ({
            ...store,
            [referenceNumber]: request.steps || createDefaultSteps()
          }));
        } catch (error) {
          console.error('Failed to initialize steps:', error);
          throw error;
        }
      },
      updateStep: async (referenceNumber: string, stepIndex: number, done: boolean) => {
        try {
          await service.updateStep(referenceNumber, stepIndex, done);
          steps.update(store => {
            const current = store[referenceNumber] || createDefaultSteps();
            if (!current) return store;

            const updatedSteps = [...current.steps];
            updatedSteps[stepIndex] = { ...updatedSteps[stepIndex], done };

            return {
              ...store,
              [referenceNumber]: {
                ...current,
                steps: updatedSteps,
                currentStep: done ? stepIndex + 1 : stepIndex,
                lastUpdated: new Date().toISOString()
              }
            };
          });
        } catch (error) {
          console.error('Failed to update step:', error);
          throw error;
        }
      }
    },

    // Metadata operations
    metadata: {
      subscribe: metadata.subscribe,
      set: async (referenceNumber: string, data: RequestMetadata) => {
        try {
          const request = await service.getPrintRequest(referenceNumber);
          await service.updatePrintRequest({
            ...request,
            document_type: data.documentType,
            student_name: data.studentName,
            student_number: data.studentNumber,
            reference_number: data.referenceNumber
          });
          metadata.update(store => ({
            ...store,
            [referenceNumber]: data
          }));
        } catch (error) {
          console.error('Failed to set metadata:', error);
          throw error;
        }
      }
    },

    // Utility functions
    getRequestState: async (referenceNumber: string) => {
      try {
        const request = await service.getPrintRequest(referenceNumber);
        return {
          flags: request.flags || createDefaultFlags(),
          steps: request.steps || createDefaultSteps(),
          metadata: {
            referenceNumber: request.reference_number,
            documentType: request.document_type,
            studentName: request.student_name,
            studentNumber: request.student_number,
            createdAt: request.created_at
          }
        };
      } catch (error) {
        console.error('Failed to get request state:', error);
        throw error;
      }
    }
  };
}

export const enhancedRequestStore = createEnhancedRequestStore();

import { writable, derived } from 'svelte/store';
import type { PrintRequest } from '$lib/types/print-request';
import type { ProcessingStep } from '$lib/types/print-steps';
// Remove this line as it's redundant
// import { writable as svelteWritable } from 'svelte/store';
// Remove this line as we'll define the type locally
// import type { PrintRequestWithSteps } from '../types/print-request';

// Add the type definition here
type PrintRequestWithSteps = PrintRequest & {
  steps: ProcessingStep[];
};

export const printRequests = writable<PrintRequest[]>([
  {
    id: '1',
    order_id: 'ORD-2024-001',
    reference_number: 'REF-2024-001',
    document_type: 'Transcript of Records',
    student_name: 'John Doe',
    student_number: '2020-00001',
    purpose: 'Employment',
    quantity: 2,
    payment_status: 'paid',
    payment_date: '2024-02-15T08:30:00Z',
    amount_paid: 600.00,
    status: 'pending',
    created_at: '2024-02-15T08:00:00Z'
  },
  {
    id: '2',
    order_id: 'ORD-2024-002',
    reference_number: 'REF-2024-002',
    document_type: 'Transcript of Records',
    student_name: 'John Doe',
    student_number: '2020-00002',
    purpose: 'Employment',
    quantity: 2,
    payment_status: 'paid',
    payment_date: '2024-02-15T08:30:00Z',
    amount_paid: 600.00,
    status: 'pending',
    created_at: '2024-02-15T08:00:00Z'
  },
  {
    id: '3',
    order_id: 'ORD-2024-003',
    reference_number: 'REF-2024-003',
    document_type: 'Transcript of Records',
    student_name: 'John Doe',
    student_number: '2020-00003',
    purpose: 'Employment',
    quantity: 2,
    payment_status: 'paid',
    payment_date: '2024-02-15T08:30:00Z',
    amount_paid: 600.00,
    status: 'pending',
    created_at: '2024-02-15T08:00:00Z'
  },
  {
    id: '4',
    order_id: 'ORD-2024-004',
    reference_number: 'REF-2024-004',
    document_type: 'Transcript of Records',
    student_name: 'John Doe',
    student_number: '2020-00004',
    purpose: 'Employment',
    quantity: 2,
    payment_status: 'paid',
    payment_date: '2024-02-15T08:30:00Z',
    amount_paid: 600.00,
    status: 'pending',
    created_at: '2024-02-15T08:00:00Z'
  },
  {
    id: '5',
    order_id: 'ORD-2024-005',
    reference_number: 'REF-2024-005',
    document_type: 'Transcript of Records',
    student_name: 'John Doe',
    student_number: '2020-00005',
    purpose: 'Employment',
    quantity: 2,
    payment_status: 'paid',
    payment_date: '2024-02-15T08:30:00Z',
    amount_paid: 600.00,
    status: 'pending',
    created_at: '2024-02-15T08:00:00Z'
  },
  {
    id: '6',
    order_id: 'ORD-2024-006',
    reference_number: 'REF-2024-006',
    document_type: 'Form 137',
    student_name: 'Emily Davis',
    student_number: '2020-00006',
    purpose: 'School Transfer',
    quantity: 2,
    payment_status: 'paid',
    payment_date: '2024-02-15T11:30:00Z',
    amount_paid: 500.00,
    status: 'pending',
    created_at: '2024-02-15T11:15:00Z'
  },
  {
    id: '7',
    order_id: 'ORD-2024-007',
    reference_number: 'REF-2024-007',
    document_type: 'Certificate of Enrollment',
    student_name: 'Robert Wilson',
    student_number: '2020-00007',
    purpose: 'Scholarship Application',
    quantity: 1,
    payment_status: 'paid',
    payment_date: '2024-02-15T12:00:00Z',
    amount_paid: 250.00,
    status: 'pending',
    created_at: '2024-02-15T11:45:00Z'
  }
]);

export const selectedRequest = writable<PrintRequestWithSteps | null>(null);

// Modify the processing steps store to use a map with request_id as key
export const processingSteps = writable<{ [key: string]: ProcessingStep[] }>({});

// Update the derived store to use the map structure
export const requestsWithSteps = derived(
  [printRequests, processingSteps],
  ([$printRequests, $processingSteps]) => {
    return $printRequests.map(request => ({
      ...request,
      steps: $processingSteps[request.id] || []
    }));
  }
);

// Update the initialize function to handle the map structure
export const initializeRequestSteps = (requestId: string) => {
    const defaultSteps = [
        {
          id: crypto.randomUUID(),
          request_id: requestId,
          step_number: 1,
          name: 'Verify student information',
          status: 'pending' as const
        },
        {
          id: crypto.randomUUID(),
          request_id: requestId,
          step_number: 2,
          name: 'Check document requirements',
          status: 'pending' as const
        },
        {
          id: crypto.randomUUID(),
          request_id: requestId,
          step_number: 3,
          name: 'Prepare document template',
          status: 'pending' as const
        },
        {
          id: crypto.randomUUID(),
          request_id: requestId,
          step_number: 4,
          name: 'Print document',
          status: 'pending' as const
        },
        {
          id: crypto.randomUUID(),
          request_id: requestId,
          step_number: 5,
          name: 'Quality check',
          status: 'pending' as const
        },
        {
          id: crypto.randomUUID(),
          request_id: requestId,
          step_number: 6,
          name: 'Record in logbook',
          status: 'pending' as const
        }
      ];

 processingSteps.update(steps => ({
    ...steps,
    [requestId]: defaultSteps
  }));
};
// Update the status update function to handle the map structure
export const updateStepStatus = (
  requestId: string,
  stepId: string,
  status: 'pending' | 'completed' | 'skipped',
  notes?: string
) => {
  processingSteps.update(stepsMap => ({
    ...stepsMap,
    [requestId]: (stepsMap[requestId] || []).map(step =>
      step.id === stepId
        ? {
            ...step,
            status,
            notes,
            completed_at: status === 'completed' ? new Date().toISOString() : undefined
          }
        : step
    )
  }));
};

export const updateRequestStatus = (requestId: string, status: "pending" | "printed" | "cancelled") => {
  printRequests.update(requests => 
    requests.map(request => 
      request.id === requestId 
        ? { ...request, status }
        : request
    )
  );
};
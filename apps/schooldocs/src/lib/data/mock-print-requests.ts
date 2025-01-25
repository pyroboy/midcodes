import type { EnhancedPrintRequest } from '../types/enhanced-request-types';

const commonProcessingSteps = [
  { step: 'Document verification', done: false },
  { step: 'Payment confirmation', done: false },
  { step: 'Document preparation', done: false },
  { step: 'Quality check', done: false },
  { step: 'Ready for pickup', done: false }
];

// Helper function to clone steps
const cloneSteps = (steps: typeof commonProcessingSteps) => 
  steps.map(step => ({ ...step }));

export const mockPrintRequests: EnhancedPrintRequest[] = [
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
    created_at: '2024-02-15T08:00:00Z',
    flags: {
      blocking: [
        { id: 'b1', text: 'Missing grades for SY 2023', timestamp: '2024-02-15T09:00:00Z' }
      ],
      nonBlocking: [],
      notes: 'Waiting for grade submission from Math department',
      timestamp: '2024-02-15T09:00:00Z'
    },
    steps: {
      steps: cloneSteps(commonProcessingSteps.slice(0, 3)),
      currentStep: 1,
      lastUpdated: '2024-02-15T09:00:00Z'
    }
  },
  {
    id: '2',
    order_id: 'ORD-2024-002',
    reference_number: 'REF-2024-002',
    document_type: 'Diploma',
    student_name: 'Jane Smith',
    student_number: '2020-00002',
    purpose: 'Further Studies',
    quantity: 1,
    payment_status: 'paid',
    payment_date: '2024-02-14T10:15:00Z',
    amount_paid: 1000.00,
    status: 'printed',
    created_at: '2024-02-14T10:00:00Z',
    flags: {
      blocking: [],
      nonBlocking: [
        { id: 'nb1', text: 'Special paper stock required', timestamp: '2024-02-14T11:00:00Z' }
      ],
      notes: 'Using premium paper stock as requested',
      timestamp: '2024-02-14T11:00:00Z'
    },
    steps: {
      steps: cloneSteps(commonProcessingSteps),
      currentStep: 4,
      lastUpdated: '2024-02-15T14:00:00Z'
    }
  },
  {
    id: '3',
    order_id: 'ORD-2024-003',
    reference_number: 'REF-2024-003',
    document_type: 'Certificate of Good Moral',
    student_name: 'Mike Johnson',
    student_number: '2020-00003',
    purpose: 'Transfer',
    quantity: 3,
    payment_status: 'pending',
    payment_date: '',
    amount_paid: 0,
    status: 'pending',
    created_at: '2024-02-15T09:30:00Z',
    flags: {
      blocking: [
        { id: 'b2', text: 'Payment verification needed', timestamp: '2024-02-15T10:00:00Z' }
      ],
      nonBlocking: [],
      notes: 'Awaiting payment confirmation from accounting',
      timestamp: '2024-02-15T10:00:00Z'
    },
    steps: {
      steps: cloneSteps(commonProcessingSteps.slice(0, 2)),
      currentStep: 0,
      lastUpdated: '2024-02-15T09:30:00Z'
    }
  },
  {
    id: '4',
    order_id: 'ORD-2024-004',
    reference_number: 'REF-2024-004',
    document_type: 'Form 137',
    student_name: 'Sarah Wilson',
    student_number: '2020-00004',
    purpose: 'School Transfer',
    quantity: 1,
    payment_status: 'paid',
    payment_date: '2024-02-13T13:45:00Z',
    amount_paid: 300.00,
    status: 'cancelled',
    created_at: '2024-02-13T13:30:00Z',
    flags: {
      blocking: [],
      nonBlocking: [
        { id: 'nb2', text: 'Student requested cancellation', timestamp: '2024-02-14T09:00:00Z' }
      ],
      notes: 'Refund process initiated',
      timestamp: '2024-02-14T09:00:00Z'
    },
    steps: {
      steps: cloneSteps(commonProcessingSteps.slice(0, 2)),
      currentStep: 1,
      lastUpdated: '2024-02-14T09:00:00Z'
    }
  },
  {
    id: '5',
    order_id: 'ORD-2024-005',
    reference_number: 'REF-2024-005',
    document_type: 'Certification of Enrollment',
    student_name: 'Emily Brown',
    student_number: '2020-00005',
    purpose: 'Scholarship Application',
    quantity: 2,
    payment_status: 'paid',
    payment_date: '2024-02-15T11:20:00Z',
    amount_paid: 400.00,
    status: 'pending',
    created_at: '2024-02-15T11:00:00Z',
    flags: {
      blocking: [],
      nonBlocking: [
        { id: 'nb3', text: 'Rush processing requested', timestamp: '2024-02-15T11:30:00Z' }
      ],
      notes: 'Priority processing due to scholarship deadline',
      timestamp: '2024-02-15T11:30:00Z'
    },
    steps: {
      steps: cloneSteps(commonProcessingSteps.slice(0, 4)),
      currentStep: 2,
      lastUpdated: '2024-02-15T12:00:00Z'
    }
  },
  {
    id: '6',
    order_id: 'ORD-2024-006',
    reference_number: 'REF-2024-006',
    document_type: 'Transcript of Records',
    student_name: 'David Lee',
    student_number: '2020-00006',
    purpose: 'Board Exam Application',
    quantity: 3,
    payment_status: 'failed',
    payment_date: '2024-02-15T14:10:00Z',
    amount_paid: 0,
    status: 'pending',
    created_at: '2024-02-15T14:00:00Z',
    flags: {
      blocking: [
        { id: 'b3', text: 'Payment failed - insufficient funds', timestamp: '2024-02-15T14:15:00Z' }
      ],
      nonBlocking: [],
      notes: 'Student notified about payment failure',
      timestamp: '2024-02-15T14:15:00Z'
    },
    steps: {
      steps: cloneSteps(commonProcessingSteps.slice(0, 1)),
      currentStep: 0,
      lastUpdated: '2024-02-15T14:15:00Z'
    }
  },
  {
    id: '7',
    order_id: 'ORD-2024-007',
    reference_number: 'REF-2024-007',
    document_type: 'Certificate of Units Earned',
    student_name: 'Alex Martinez',
    student_number: '2020-00007',
    purpose: 'Credit Transfer',
    quantity: 1,
    payment_status: 'paid',
    payment_date: '2024-02-14T15:30:00Z',
    amount_paid: 250.00,
    status: 'printed',
    created_at: '2024-02-14T15:00:00Z',
    flags: {
      blocking: [],
      nonBlocking: [],
      notes: 'Processed without issues',
      timestamp: '2024-02-15T10:00:00Z'
    },
    steps: {
      steps: cloneSteps(commonProcessingSteps),
      currentStep: 4,
      lastUpdated: '2024-02-15T10:00:00Z'
    }
  },
  {
    id: '8',
    order_id: 'ORD-2024-008',
    reference_number: 'REF-2024-008',
    document_type: 'Diploma',
    student_name: 'Rachel Green',
    student_number: '2020-00008',
    purpose: 'Employment Abroad',
    quantity: 2,
    payment_status: 'paid',
    payment_date: '2024-02-15T16:45:00Z',
    amount_paid: 2000.00,
    status: 'pending',
    created_at: '2024-02-15T16:30:00Z',
    flags: {
      blocking: [
        { id: 'b4', text: 'Requires authentication from DFA', timestamp: '2024-02-15T17:00:00Z' }
      ],
      nonBlocking: [
        { id: 'nb4', text: 'Red ribbon requested', timestamp: '2024-02-15T17:00:00Z' }
      ],
      notes: 'Special handling required for authentication process',
      timestamp: '2024-02-15T17:00:00Z'
    },
    steps: {
      steps: cloneSteps(commonProcessingSteps.slice(0, 3)),
      currentStep: 1,
      lastUpdated: '2024-02-15T17:00:00Z'
    }
  },
  {
    id: '9',
    order_id: 'ORD-2024-009',
    reference_number: 'REF-2024-009',
    document_type: 'Certificate of Good Moral',
    student_name: 'Tom Wilson',
    student_number: '2020-00009',
    purpose: 'Visa Application',
    quantity: 4,
    payment_status: 'paid',
    payment_date: '2024-02-15T09:15:00Z',
    amount_paid: 800.00,
    status: 'pending',
    created_at: '2024-02-15T09:00:00Z',
    flags: {
      blocking: [],
      nonBlocking: [
        { id: 'nb5', text: 'Multiple copies requested', timestamp: '2024-02-15T09:30:00Z' }
      ],
      notes: 'Bulk processing required',
      timestamp: '2024-02-15T09:30:00Z'
    },
    steps: {
      steps: cloneSteps(commonProcessingSteps.slice(0, 4)),
      currentStep: 2,
      lastUpdated: '2024-02-15T10:30:00Z'
    }
  },
  {
    id: '10',
    order_id: 'ORD-2024-010',
    reference_number: 'REF-2024-010',
    document_type: 'Form 137',
    student_name: 'Lisa Anderson',
    student_number: '2020-00010',
    purpose: 'School Requirements',
    quantity: 1,
    payment_status: 'paid',
    payment_date: '2024-02-14T11:45:00Z',
    amount_paid: 300.00,
    status: 'printed',
    created_at: '2024-02-14T11:30:00Z',
    flags: {
      blocking: [],
      nonBlocking: [],
      notes: 'Ready for pickup',
      timestamp: '2024-02-15T13:00:00Z'
    },
    steps: {
      steps: cloneSteps(commonProcessingSteps),
      currentStep: 4,
      lastUpdated: '2024-02-15T13:00:00Z'
    }
  }
];

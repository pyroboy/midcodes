import type { FlagOption, ProcessingStep } from './requestTypes';

export interface EnhancedFlagsStore {
  [referenceNumber: string]: {
    blocking: FlagOption[];
    nonBlocking: FlagOption[];
    notes: string;
    timestamp: string;
  };
}

export interface EnhancedStepsStore {
  [referenceNumber: string]: {
    steps: ProcessingStep[];
    currentStep: number;
    lastUpdated: string;
  };
}

export interface RequestMetadata {
  referenceNumber: string;
  documentType: string;
  studentName: string;
  studentNumber: string;
  createdAt: string;
}

export interface EnhancedPrintRequest {
  id: string;
  order_id: string;
  reference_number: string;
  document_type: string;
  student_name: string;
  student_number: string;
  purpose: string;
  quantity: number;
  payment_status: 'paid' | 'pending' | 'failed';
  payment_date: string;
  amount_paid: number;
  status: 'pending' | 'printed' | 'cancelled';
  created_at: string;
  flags?: {
    blocking: FlagOption[];
    nonBlocking: FlagOption[];
    notes: string;
    timestamp: string;
  };
  steps?: {
    steps: ProcessingStep[];
    currentStep: number;
    lastUpdated: string;
  };
}

// Utility type for store actions
export type StoreAction<T> = {
  subscribe: (callback: (value: T) => void) => () => void;
  set: (value: T) => void;
  update: (updater: (value: T) => T) => void;
};

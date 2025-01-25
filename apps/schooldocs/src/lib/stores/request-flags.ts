import { writable, get } from 'svelte/store';

export type DocumentFlag = {
  type: 'BLOCKING' | 'NON_BLOCKING';
  code: string;
  message: string;
  timestamp: string;
};

type FlagsStore = {
  [referenceNumber: string]: DocumentFlag[];
};

// Define the flag types and their messages
export const BLOCKING_FLAGS = {
  UNVERIFIABLE: 'Cannot verify document authenticity',
  FORGED_DOCUMENTS: 'Suspected document forgery',
  PAYMENT_FAILED: 'Payment verification failed',
  INCOMPLETE_DOCUMENTS: 'Required documents are incomplete',
  EXPIRED_DOCUMENTS: 'One or more documents have expired',
  EXPIRED_REQUEST: 'Request has expired',
  NEGATIVE: 'Invalid document submission',
  PRINTING_FAILED: 'Document printing failed',
  SYSTEM_ERROR: 'System processing error',
  INVALID_REQUEST: 'Invalid request parameters'
} as const;

export const NON_BLOCKING_FLAGS = {
  PRIORITY: 'Priority processing requested',
  ON_HOLD: 'Request temporarily on hold',
  PROCESSING_DELAY: 'Processing delayed',
  DUPLICATE_REQUEST: 'Duplicate request detected',
  SPECIAL_CASE: 'Special handling required',
  PAYMENT_PENDING: 'Payment verification pending',
  SHIPPING_PENDING: 'Shipping arrangement pending',
  QUALITY_CHECK_FAILED: 'Quality check retry needed',
  EMAIL_FAILED: 'Email delivery failed',
  WRONG_ADDRESS: 'Incorrect address provided',
  RETURNED: 'Document returned',
  PAYMENT_VERIFIED: 'Payment verified',
  SCANNING_FAILED: 'Document scanning failed',
  INCOMPLETE_COPIES: 'Incomplete number of copies'
} as const;

function createDocumentFlags() {
  const { subscribe, update } = writable<FlagsStore>({});

  return {
    subscribe,
    addFlag: (referenceNumber: string, flagType: 'BLOCKING' | 'NON_BLOCKING', flagCode: string) => {
      update(store => {
        const flags = store[referenceNumber] || [];
        const message = flagType === 'BLOCKING' 
          ? BLOCKING_FLAGS[flagCode as keyof typeof BLOCKING_FLAGS]
          : NON_BLOCKING_FLAGS[flagCode as keyof typeof NON_BLOCKING_FLAGS];

        const newFlag: DocumentFlag = {
          type: flagType,
          code: flagCode,
          message,
          timestamp: new Date().toISOString()
        };

        return {
          ...store,
          [referenceNumber]: [...flags, newFlag]
        };
      });
    },
    removeFlag: (referenceNumber: string, flagCode: string) => {
      update(store => {
        const flags = store[referenceNumber] || [];
        return {
          ...store,
          [referenceNumber]: flags.filter(flag => flag.code !== flagCode)
        };
      });
    },
    clearFlags: (referenceNumber: string) => {
      update(store => {
        const { [referenceNumber]: _, ...rest } = store;
        return rest;
      });
    },
    getFlags: (referenceNumber: string) => {
      const store = get(requestFlags);
      return store[referenceNumber] || [];
    }
  };
}

export const requestFlags = createDocumentFlags();
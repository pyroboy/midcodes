export type FlagType = 'blocking' | 'nonBlocking';

export interface FlagOption {
  id: string;
  text: string;
  timestamp: string;
}

export interface FlagOptions {
  blocking: FlagOption[];
  nonBlocking: FlagOption[];
}

export interface Flags {
  blocking: FlagOption[];
  nonBlocking: FlagOption[];
  notes: string;
}

export interface ProcessingStep {
  step: string;
  done: boolean;
}

export interface FlagEventDetail {
  type: 'blocking' | 'nonBlocking';
  flag?: string;
  id?: string;
}
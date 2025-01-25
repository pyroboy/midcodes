export type FlagType = 'blocking' | 'nonBlocking';

export interface FlagOption {
  id: string;
  label: string;
}

export interface Flags {
  blocking: string[];
  nonBlocking: string[];
}

export interface ProcessingStep {
  step: string;
  done: boolean;
}

export interface FlagOptions {
  blocking: FlagOption[];
  nonBlocking: FlagOption[];
}

export interface FlagEventDetail {
  type: FlagType;
  flagId?: string;
  flag?: string;
}
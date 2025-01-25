export type ProcessingStep = {
  id: string;
  request_id: string;
  step_number: number;
  name: string;
  status: 'pending' | 'completed' | 'skipped';
  completed_at?: string;
  notes?: string;
};
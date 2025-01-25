export interface PrintRequest {
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
}
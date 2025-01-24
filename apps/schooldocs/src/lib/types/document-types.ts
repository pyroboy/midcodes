export interface DocumentType {
    id: string;
    organization_id: string;
    name: string;
    description: string | null;
    price: number;
    processing_time_hours: number;
    requirements: string[];
    max_copies: number;
    purpose_required: boolean;
    status: 'active' | 'inactive' | 'archived';
    metadata: Record<string, any>;
    created_at: string;
    updated_at: string;
}
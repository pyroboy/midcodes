export interface HeaderRow {
	id: string;
	name: string;
	type: string;
	required: boolean;
	options?: string[];
	metadata?: {
		templates?: Record<string, any>;
		[key: string]: any;
	};
}

export interface FieldData {
	value: string;
	type: string;
	required: boolean;
	options?: string[];
}

export interface DataRow {
	id: string;
	created_at: string;
	fields: Record<string, FieldData>;
	status: 'pending' | 'approved' | 'rejected';
	template_id: string;
	user_id: string;
	idcard_id?: string;
	front_image?: string;
	back_image?: string;
	template_name: string;
	images?: {
		front?: string;
		back?: string;
	};
	is_header?: boolean;
}

export interface ValidationError {
	field: string;
	message: string;
}

export interface TemplateMetadata {
	id: string;
	name: string;
	description?: string;
	created_at: string;
	updated_at: string;
	created_by: string;
	status: 'draft' | 'published' | 'archived';
	version: number;
	thumbnail?: string;
}

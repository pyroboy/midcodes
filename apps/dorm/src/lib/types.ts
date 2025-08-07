export interface TemplateElement {
	variableName: string;
	type: 'text' | 'photo' | 'signature';
	content?: string;
	x: number;
	y: number;
	side?: 'front' | 'back';
	font?: string;
	size?: number;
	color?: string;
	width?: number;
	height?: number;
	alignment?: 'left' | 'center' | 'right';
}

export interface TemplateData {
	id: string;
	user_id: string;
	name: string;
	front_background: string;
	back_background: string;
	orientation: 'landscape' | 'portrait';
	template_elements: TemplateElement[];
}

export interface IDCardField {
	value: string;
	side: 'front' | 'back';
}

export interface HeaderMetadata {
	organization_name: string;
	templates: {
		[templateName: string]: TemplateElement[];
	};
}

export interface HeaderRow {
	is_header: true;
	metadata: HeaderMetadata;
	id: null;
	idcard_id: null;
	template_name: null;
	front_image: null;
	back_image: null;
	created_at: null;
	fields: null;
}

export interface DataRow {
	is_header: false;
	metadata: null;
	id: string;
	idcard_id?: string;
	template_name: string;
	front_image: string | null;
	back_image: string | null;
	created_at: string;
	fields: {
		[fieldName: string]: IDCardField;
	};
}

import type { ComponentType } from 'svelte';

export interface SearchItem {
	id: string;
	type: 'template' | 'id-card' | 'navigation' | 'action';
	title: string;
	subtitle?: string;
	href?: string;
	action?: () => void;
	icon: ComponentType;
	keywords: string[];
}

export interface TemplateElement {
	id: string;
	type: 'text' | 'image' | 'qr' | 'photo' | 'signature' | 'selection' | 'graphic';
	x: number;
	y: number;
	width: number;
	height: number;
	rotation?: number; // degrees 0-360, default 0
	content?: string;
	variableName: string;
	fontSize?: number;
	fontFamily?: string;
	fontWeight?: string;
	fontStyle?: 'normal' | 'italic' | 'oblique';
	color?: string;
	textDecoration?: 'none' | 'underline';
	textTransform?: 'none' | 'uppercase' | 'lowercase' | 'capitalize';
	opacity?: number;
	visible?: boolean;
	font?: string;
	size?: number;
	alignment?: 'left' | 'center' | 'right' | 'justify';
	options?: string[];
	side: 'front' | 'back';
	letterSpacing?: number;
	lineHeight?: number | string;
	defaultValue?: string;
	placeholder?: string;
	// Graphic element properties
	src?: string; // URL for graphic elements
	fit?: 'cover' | 'contain' | 'fill' | 'none';
	alt?: string;
	maintainAspectRatio?: boolean;
	borderRadius?: number;
	// QR element properties
	contentMode?: 'auto' | 'custom'; // 'auto' = digital profile URL, 'custom' = manual content
	errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H';
	foregroundColor?: string;
	backgroundColor?: string;
}

export interface TemplateData {
	id: string;
	user_id: string;
	name: string;
	description?: string;
	org_id: string;
	front_background: string;
	back_background: string;
	front_background_url?: string;
	back_background_url?: string;
	orientation: 'landscape' | 'portrait';
	template_elements: TemplateElement[];
	created_at: string;
	updated_at?: string;
	width_pixels: number;
	height_pixels: number;
	dpi: number;
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

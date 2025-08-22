import { writable } from 'svelte/store';

export interface TemplateElement {
	id: string;
	type: 'text' | 'image' | 'qr' | 'photo' | 'signature' | 'selection';
	x: number;
	y: number;
	width: number;
	height: number;
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
	// New fields for flexible sizing
	width_inches?: number;
	height_inches?: number;
	dpi: number;
	// Pixel dimensions for display
	width_pixels: number;
	height_pixels: number;
}

function createTemplateStore() {
	const { subscribe, set, update } = writable<TemplateData>({
		id: '',
		user_id: '',
		name: '',
		front_background: '',
		back_background: '',
		orientation: 'landscape',
		template_elements: [],
		created_at: new Date().toISOString(),
		org_id: '',
		// Default values for new size fields
		width_inches: 3.375, // Credit card width
		height_inches: 2.125, // Credit card height
		dpi: 300,
		// Default pixel dimensions (3.375" * 300 DPI = 1012.5px, 2.125" * 300 DPI = 637.5px)
		width_pixels: 1013,
		height_pixels: 638
	});

	return {
		subscribe,
		set,
		update,
		select: (template: TemplateData) => {
			set(template);
		},
		loadTemplate: (template: TemplateData) => {
			set(template);
		},
		updateElement: (elementId: string, updates: Partial<TemplateElement>) => {
			update(template => {
				const updatedElements = template.template_elements.map(element =>
					element.id === elementId ? { ...element, ...updates } : element
				);
				return { ...template, template_elements: updatedElements };
			});
		},
		updateTemplateName: (name: string) => {
			update(template => ({ ...template, name }));
		},
		reset: () =>
			set({
				id: '',
				user_id: '',
				name: '',
				front_background: '',
				back_background: '',
				orientation: 'landscape',
				template_elements: [],
				created_at: new Date().toISOString(),
				org_id: '',
				// Default values for new size fields
				width_inches: 3.375, // Credit card width
				height_inches: 2.125, // Credit card height
				dpi: 300,
				// Default pixel dimensions (3.375" * 300 DPI = 1012.5px, 2.125" * 300 DPI = 637.5px)
				width_pixels: 1013,
				height_pixels: 638
			})
	};
}

export const templateData = createTemplateStore();

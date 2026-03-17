/**
 * Shared template types for the templates page refactoring
 * Single source of truth for DatabaseTemplate and related types
 */

import type { TemplateElement } from '$lib/stores/templateStore';

/**
 * Type for database template records
 * This matches the templates table schema in the database
 */
export interface DatabaseTemplate {
	id: string;
	user_id: string;
	name: string;
	description?: string | null;
	org_id: string;
	front_background: string;
	back_background: string;
	front_background_low_res?: string | null;
	back_background_low_res?: string | null;
	orientation: 'landscape' | 'portrait';
	template_elements: TemplateElement[];
	width_pixels?: number;
	height_pixels?: number;
	dpi?: number;
	created_at: string;
	updated_at?: string | null;
	// Asset variant URLs (thumbnails, previews, samples)
	thumb_front_url?: string | null;
	thumb_back_url?: string | null;
	preview_front_url?: string | null;
	preview_back_url?: string | null;
	blank_front_url?: string | null;
	blank_back_url?: string | null;
	sample_front_url?: string | null;
	sample_back_url?: string | null;
	// Template metadata
	tags?: string[];
	usage_count?: number;
}

/**
 * Extended template data used in the editor
 * Includes all DatabaseTemplate fields with proper typing
 */
export interface EditorTemplateData extends DatabaseTemplate {
	// Editor-specific fields can be added here if needed
}

/**
 * Server response type for template operations
 */
export interface TemplateServerResponse {
	success: boolean;
	data: DatabaseTemplate;
	message: string;
}

/**
 * Type for template list item (minimal data for list display)
 */
export interface TemplateListItem {
	id: string;
	name: string;
	front_background: string;
	back_background: string;
	orientation: 'landscape' | 'portrait';
	width_pixels?: number;
	height_pixels?: number;
	thumb_front_url?: string | null;
	thumb_back_url?: string | null;
	created_at: string;
	updated_at?: string | null;
}

// Re-export TemplateElement for convenience
export type { TemplateElement } from '$lib/stores/templateStore';

import { writable } from 'svelte/store';

// Define the shape of the template data object
export interface TemplateData {
  id: string;
  user_id: string;
  name: string;
  front_background: string;
  back_background: string;
  orientation: 'landscape' | 'portrait';
  template_elements: TemplateElement[];
}

export interface TemplateElement {
  variableName: string;
  type: 'text' | 'photo' | 'signature' | 'selection';
  side: 'front' | 'back';
  content?: string;
  options?: string[];
  x: number;
  y: number;
  width?: number;
  height?: number;
  font?: string;
  size?: number;
  color?: string;
  alignment?: string;
  fontWeight?: string;
  fontStyle?: 'normal' | 'italic' | 'oblique';
  textDecoration?: 'none' | 'underline' | 'overline' | 'line-through';
  letterSpacing?: number;
  lineHeight?: number | string;
  textTransform?: 'none' | 'capitalize' | 'uppercase' | 'lowercase';
  opacity?: number; // Stored as a decimal (0-1)
  visible?: boolean;
}

// Initialize the template data store with a default value
export const templateData = writable<TemplateData>({
  id: '',
  user_id: '',
  name: '',
  front_background: '',
  back_background: '',
  orientation: 'landscape',
  template_elements: [],
});
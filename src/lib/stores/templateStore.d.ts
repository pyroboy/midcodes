import type { Writable } from 'svelte/store';

export interface TemplateElement {
  variableName: string;
  type: 'text' | 'photo'|'signature';
  side: 'front' | 'back';
  content?: string;
  font?: string;
  size?: number
  x: number;
  y: number;
  width?: number;
  height?: number;
  color?: string;
  alignment?: string;
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

export declare const templateData: Writable<TemplateData>;
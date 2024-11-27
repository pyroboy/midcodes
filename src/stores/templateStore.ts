import { writable } from 'svelte/store';

// Define the shape of the template data object
export interface TemplateData {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  front_background: string;
  back_background: string;
  front_background_url?: string;
  back_background_url?: string;
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

function createTemplateStore() {
  const { subscribe, set, update } = writable<TemplateData>({
    id: '',
    user_id: '',
    name: '',
    front_background: '',
    back_background: '',
    orientation: 'landscape',
    template_elements: [],
  });

  return {
    subscribe,
    set,
    update,
    select: (template: TemplateData) => {
      set(template);
    },
    reset: () => {
      set({
        id: '',
        user_id: '',
        name: '',
        front_background: '',
        back_background: '',
        orientation: 'landscape',
        template_elements: [],
      });
    }
  };
}

export const templateData = createTemplateStore();
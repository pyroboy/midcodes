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
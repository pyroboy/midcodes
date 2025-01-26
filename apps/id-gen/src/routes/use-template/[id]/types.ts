export interface SelectItem {
    value: string;
    label: string;
}

export interface FormData {
    [key: string]: string;
}

export interface FileUploads {
    [key: string]: File | null;
}

export interface ImagePosition {
    x: number;
    y: number;
    width: number;
    height: number;
    scale: number;
}

export interface ImagePositions {
    [key: string]: ImagePosition;
}

export interface CachedFileUrls {
    [key: string]: string;
}

export interface DebugMessage {
    message: string;
    timestamp: Date;
}

export interface SelectedOptions {
    [key: string]: SelectItem;
}

export type TemplateElementSide = {
    front: 'front';
    back: 'back';
};

export interface TemplateElement {
    variableName: string;
    type: 'text' | 'selection' | 'photo' | 'signature';
    side: keyof TemplateElementSide;
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
}

export interface Template {
    id: string;
    user_id: string;
    name: string;
    orientation: 'portrait' | 'landscape';
    front_background: string;
    back_background: string;
    template_elements: TemplateElement[];
}
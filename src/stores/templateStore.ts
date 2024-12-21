import { writable } from 'svelte/store';

export interface TemplateElement {
    id: string;
    type: 'text' | 'image' | 'qr' | 'photo' | 'signature' | 'selection';
    x: number;
    y: number;
    width: number;
    height: number;
    content?: string;
    variableName?: string;
    fontSize?: number;
    fontFamily?: string;
    fontWeight?: string;
    fontStyle?: string;
    textAlign?: 'left' | 'center' | 'right' | 'justify';
    color?: string;
    textDecoration?: 'none' | 'underline';
    textTransform?: 'none' | 'uppercase';
    opacity?: number;
    visible?: boolean;
    font?: string;
    size?: number;
    alignment?: 'left' | 'center' | 'right' | 'justify';
    options?: string[];
}

export interface TemplateData {
    id: string;
    name: string;
    description?: string;
    width: number;
    height: number;
    background_url?: string;
    template_elements: TemplateElement[];
    created_at?: string;
    updated_at?: string;
    org_id: string;
}

const createTemplateStore = () => {
    const { subscribe, set, update } = writable<TemplateData | null>(null);

    return {
        subscribe,
        set,
        update,
        reset: () => set(null)
    };
};

export const templateStore = createTemplateStore();

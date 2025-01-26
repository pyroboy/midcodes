import type { ImagePosition, CachedFileUrls, DebugMessage } from './types';
import type { TemplateData } from '$lib/stores/templateStore';

export function isValidOption(value: string, options: string[]): value is string {
    return options.includes(value);
}

export function handleImageUpdate(event: CustomEvent, variableName: string, imagePositions: { [key: string]: ImagePosition }) {
    const { scale, x, y } = event.detail;
    imagePositions[variableName] = {
        ...imagePositions[variableName],
        scale,
        x,
        y
    };
}

export function createAndCacheFileUrl(file: File, variableName: string, cachedFileUrls: CachedFileUrls): string {
    if (cachedFileUrls[variableName]) {
        URL.revokeObjectURL(cachedFileUrls[variableName]);
    }
    const url = URL.createObjectURL(file);
    cachedFileUrls[variableName] = url;
    return url;
}

export function addDebugMessage(message: string, debugMessages: DebugMessage[]) {
    debugMessages.push({
        message,
        timestamp: new Date()
    });
}

export function initializeFormData(template: TemplateData | null, formData: { [key: string]: string }) {
    if (template) {
        template.template_elements.forEach((el) => {
            if (!el.variableName) {
                console.warn('Element missing variable name:', el);
                return;
            }
            if (!(el.variableName in formData)) {
                formData[el.variableName] = '';
            }
        });
    }
}

export function handleFileUpload(event: Event, variableName: string, fileUploads: { [key: string]: File | null }, cachedFileUrls: CachedFileUrls) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
        const file = input.files[0];
        fileUploads[variableName] = file;
        createAndCacheFileUrl(file, variableName, cachedFileUrls);
    }
}

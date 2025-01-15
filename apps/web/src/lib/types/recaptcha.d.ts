interface Window {
    __recaptchaLoaded: () => void;
    onRecaptchaSuccess: (token: string) => void;
    onRecaptchaError: () => void;
    onRecaptchaExpired: () => void;
    grecaptcha: {
        execute: (sitekey: string, options: { action: string }) => Promise<string>;
        ready: (callback: () => void) => void;
        render: (container: string | HTMLElement, parameters: object) => number;
        reset: (widgetId?: number) => void;
        getResponse: (widgetId?: number) => string;
    };
}

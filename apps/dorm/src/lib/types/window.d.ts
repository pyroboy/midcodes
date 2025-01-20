export {};

declare global {
    interface Window {
        onRecaptchaSuccess: (token: string) => void;
        onRecaptchaError: () => void;
        onRecaptchaExpired: () => void;
        grecaptcha: any;
    }
}

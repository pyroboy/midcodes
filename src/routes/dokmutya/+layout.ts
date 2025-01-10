export const ssr = false;
export const csr = true;

// Return empty data to bypass auth and prevent layout inheritance
export function load() {
    return {
        // Override root layout data
        user: null,
        profile: null,
        navigation: null,
        session: null,
        emulation: null,
        special_url: null,
        // Prevent layout inheritance
        layout: 'none'
    };
}

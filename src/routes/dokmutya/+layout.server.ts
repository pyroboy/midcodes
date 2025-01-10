// Return empty data to bypass server-side auth
export function load() {
    return {
        user: null,
        profile: null,
        navigation: null,
        session: null,
        emulation: null,
        special_url: null
    };
}

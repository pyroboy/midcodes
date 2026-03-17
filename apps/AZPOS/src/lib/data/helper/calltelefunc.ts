/**
 * Generic helper function for making Telefunc calls
 * @param functionName - The name of the telefunc function to call
 * @param args - Array of arguments to pass to the telefunc function
 * @returns Promise resolving to the telefunc return value
 * @throws Error if the telefunc call fails
 */
export async function callTelefunc<T = unknown>(
    functionName: string,
    args: unknown[] = []
): Promise<T> {
    const res = await fetch('/api/telefunc', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ telefuncName: functionName, telefuncArgs: args })
    });
    
    if (!res.ok) {
        throw new Error(`Telefunc call failed: ${res.status} ${res.statusText}`);
    }
    
    const { ret } = await res.json();
    return ret;
}
/**
 * Server epoch — a timestamp set once at module load time.
 * Changes every time the server process restarts.
 * Clients compare this to their last-known epoch to detect restarts
 * and trigger a full re-sync (generation bump).
 *
 * Also bumped on RESET_ALL to force all clients to resync.
 */
export let SERVER_EPOCH = Date.now();

/** Bump the epoch (e.g., on RESET_ALL) so clients detect a state change. */
export function bumpServerEpoch() {
	SERVER_EPOCH = Date.now();
}

import { resyncCollection } from '$lib/db/replication';

/** Standard 409 conflict message shown to users. */
export const CONFLICT_MESSAGE =
	'This record was modified by someone else. Please refresh and try again.';

/** Check if a SvelteKit action result is a 409 conflict. */
export function isConflictResult(result: any): boolean {
	return result?.type === 'failure' && result?.status === 409;
}
import { getDb } from '$lib/db';
import { syncStatus } from '$lib/stores/sync-status.svelte';
import { mutationQueue } from '$lib/stores/mutation-queue.svelte';
import { toast } from 'svelte-sonner';

// ─── Wall Integrity Protection ──────────────────────────────────────────────
// Snapshots all WALL items before a floor_layout_items resync. After resync,
// restores any walls that were lost (present before, missing after).
// This prevents pull replication from accidentally dropping optimistic walls.

type WallSnapshot = Record<string, any>;

async function snapshotWalls(): Promise<WallSnapshot[]> {
	try {
		const db = await getDb();
		const allDocs = await db.floor_layout_items.find({
			selector: { item_type: 'WALL', deleted_at: { $eq: null } }
		}).exec();
		return allDocs.map((doc: any) => doc.toJSON(true));
	} catch {
		return [];
	}
}

async function restoreLostWalls(preSnapshot: WallSnapshot[]): Promise<void> {
	try {
		const db = await getDb();
		let restored = 0;

		for (const wall of preSnapshot) {
			const current = await db.floor_layout_items.findOne(wall.id).exec();
			if (!current) {
				// Wall doc was completely removed — re-insert it
				await db.floor_layout_items.upsert(wall);
				restored++;
			} else if (current.deleted_at !== null && wall.deleted_at === null) {
				// Wall was soft-deleted by resync but was alive before — restore it
				await current.incrementalPatch({ deleted_at: null, updated_at: new Date().toISOString() });
				restored++;
			}
		}

		if (restored > 0) {
			console.warn(`[WallGuard] Restored ${restored} wall(s) lost during resync`);
			syncStatus.addLog(`WallGuard: restored ${restored} wall(s) lost during resync`, 'warn');
		}
	} catch (err) {
		console.warn('[WallGuard] Failed to restore walls:', err);
	}
}

/**
 * Safely get an RxDB collection by name.
 * Returns null (instead of throwing) if DB is unavailable, collection doesn't exist,
 * or getDb() takes longer than 5s (avoids hanging writes).
 */
export async function safeGetCollection(name: string) {
	try {
		const db = await Promise.race([
			getDb(),
			new Promise<never>((_, reject) =>
				setTimeout(() => reject(new Error('getDb timeout (5s)')), 5000)
			)
		]);
		const col = (db as any)[name];
		if (!col || col.destroyed) return null;
		return col;
	} catch {
		return null;
	}
}

const debounceTimers = new Map<string, ReturnType<typeof setTimeout>>();

/**
 * Background resync — fire and forget, never blocks UI.
 * Debounced per collection (500ms) to coalesce rapid successive calls.
 * Shared across all optimistic write modules.
 *
 * W6: Shows a toast if the server rejects the write (resync fails or reverts).
 */
export function bgResync(collection: string) {
	// Mark push flow — a form action just wrote to Neon, now we're about to pull back
	syncStatus.recordPush(collection);

	const existing = debounceTimers.get(collection);
	if (existing) clearTimeout(existing);

	debounceTimers.set(
		collection,
		setTimeout(() => {
			debounceTimers.delete(collection);

			// DD5: Don't attempt resync when offline — queue for when connectivity returns
			if (typeof navigator !== 'undefined' && !navigator.onLine) {
				syncStatus.addLog(`Offline — ${collection} resync deferred`, 'warn');
				const onOnline = () => {
					window.removeEventListener('online', onOnline);
					bgResync(collection); // Re-trigger when back online
				};
				window.addEventListener('online', onOnline);
				return;
			}

			// Don't resync while there are still pending mutations for this collection —
			// pull replication would overwrite unconfirmed optimistic writes.
			// The last mutation's onSuccess will trigger bgResync again.
			const pendingForCollection = mutationQueue.items.filter(
				(m) => m.collection === collection && (m.status === 'queued' || m.status === 'syncing')
			);
			if (pendingForCollection.length > 0) {
				syncStatus.addLog(`Resync: ${collection} deferred — ${pendingForCollection.length} mutation(s) still pending`, 'info');
				return;
			}

			console.log(`[Optimistic] Resync "${collection}" → pulling from Neon...`);
			syncStatus.addLog(`Resync: pulling ${collection} from Neon...`, 'info');

			// Wall integrity protection: snapshot WALL items before resync so we can restore any lost
			const wallGuard = collection === 'floor_layout_items'
				? snapshotWalls()
				: Promise.resolve(null);

			wallGuard.then((wallSnapshot) => {
				resyncCollection(collection)
					.then(async () => {
						// Restore any walls lost during resync
						if (wallSnapshot && wallSnapshot.length > 0) {
							await restoreLostWalls(wallSnapshot);
						}
						console.log(`[Optimistic] Resync "${collection}" complete ✓`);
						syncStatus.addLog(`Resync: ${collection} reconciled with Neon ✓`, 'success');
						syncStatus.markMutationResolved();
					})
					.catch((err) => {
						// W6: Optimistic rollback toast — server rejected or resync failed
						console.warn(`[Optimistic] Resync "${collection}" failed:`, err);
						syncStatus.addLog(`Resync: ${collection} failed — ${err?.message || err}`, 'error');
						syncStatus.markMutationResolved();
						toast.error('Save failed — data reverted to server version', {
							description: `${collection}: ${err?.message || 'Sync error'}`,
							duration: 5000
						});
					});
			});
		}, 500)
	);
}

/**
 * Buffered mutation — the generic helper for all form modals.
 *
 * 1. Runs optimisticWrite immediately (for updates where ID is known)
 * 2. Enqueues serverAction into the mutation queue
 * 3. On success: bgResync to confirm + optional onSuccess callback
 * 4. On failure: bgResync to revert + toast error + optional onFailure callback
 */
export async function bufferedMutation(opts: {
	label: string;
	collection: string;
	type: 'create' | 'update' | 'delete';
	optimisticWrite?: () => Promise<void>;
	serverAction: () => Promise<any>;
	onSuccess?: (result: any) => Promise<void>;
	onFailure?: (error: any) => Promise<void>;
}) {
	// Step 1: Run optimistic write immediately (if provided)
	if (opts.optimisticWrite) {
		try {
			await opts.optimisticWrite();
		} catch (err) {
			console.warn(`[Buffered] Optimistic write failed for "${opts.label}":`, err);
			// Continue anyway — the server action is the source of truth
		}
	}

	// Step 2: Enqueue server action
	mutationQueue.enqueue({
		label: opts.label,
		collection: opts.collection,
		type: opts.type,
		serverAction: opts.serverAction,
		onSuccess: async (result: any) => {
			// Run caller's onSuccess (e.g., optimisticUpsert with real ID for creates)
			if (opts.onSuccess) {
				try { await opts.onSuccess(result); } catch { /* non-critical */ }
			}
			// Resync to confirm
			bgResync(opts.collection);
		},
		onFailure: async (error: any) => {
			// Run caller's onFailure
			if (opts.onFailure) {
				try { await opts.onFailure(error); } catch { /* non-critical */ }
			}
			// Resync to revert optimistic write
			bgResync(opts.collection);
			toast.error(`${opts.label} failed`, {
				description: error?.message || 'Server rejected the change',
				duration: 5000
			});
		}
	});
}

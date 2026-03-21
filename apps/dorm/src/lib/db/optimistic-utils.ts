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

// ─── Layout Integrity Protection (M1: protects ALL items, not just walls) ────
// Snapshots all active floor_layout_items before a resync. After resync,
// restores any items that were lost (present before, missing after).
// This prevents pull replication from accidentally dropping optimistic writes
// for walls, room assignments, and all other item types.

type LayoutItemSnapshot = Record<string, any>;

async function snapshotLayoutItems(): Promise<LayoutItemSnapshot[]> {
	try {
		const db = await getDb();
		const allDocs = await db.floor_layout_items.find({
			selector: { deleted_at: { $eq: null } }
		}).exec();
		return allDocs.map((doc: any) => doc.toJSON(true));
	} catch {
		return [];
	}
}

/**
 * Remove temp-ID docs (negative IDs) that have been replaced by real server records.
 * A temp doc is only removed when a matching real record exists locally
 * (same floor_id + item_type + grid position) AND the real record's updated_at
 * is within 5 minutes of the temp doc's (M2: reduces false positives from
 * overlapping items at the same position).
 */
/** Build a position signature for matching temp docs against real server records. */
function layoutSignature(doc: any): string {
	return JSON.stringify([doc.floor_id, doc.item_type, doc.grid_x, doc.grid_y, doc.grid_w, doc.grid_h]);
}

/** Max age difference (ms) between temp and real doc to consider them a match. */
const TEMP_MATCH_WINDOW_MS = 5 * 60 * 1000; // 5 minutes

async function cleanupReplacedTempIds(collectionName: string): Promise<void> {
	try {
		const db = await getDb();
		const col = (db as any)[collectionName];
		if (!col) return;
		const allDocs = await col.find({ selector: { deleted_at: { $eq: null } } }).exec();

		// Build signature map of real (server) records with their updated_at
		const realRecords = new Map<string, number>(); // sig -> updated_at epoch
		const tempDocs: { id: string; sig: string; updatedAt: number }[] = [];

		for (const doc of allDocs) {
			const sig = layoutSignature(doc);
			const docTs = doc.updated_at ? new Date(doc.updated_at).getTime() : 0;
			if (Number(doc.id) > 0) {
				// Keep the most recent real record's timestamp per signature
				const existing = realRecords.get(sig);
				if (!existing || docTs > existing) {
					realRecords.set(sig, docTs);
				}
			} else {
				tempDocs.push({ id: doc.id, sig, updatedAt: docTs });
			}
		}

		// Only remove temp docs whose real counterpart exists AND was created
		// within a reasonable time window (prevents false positives from
		// unrelated items that happen to share the same grid position)
		const toRemove = tempDocs.filter((t) => {
			const realTs = realRecords.get(t.sig);
			if (realTs === undefined) return false;
			// If either timestamp is 0 (missing), fall back to signature-only match
			if (realTs === 0 || t.updatedAt === 0) return true;
			return Math.abs(realTs - t.updatedAt) < TEMP_MATCH_WINDOW_MS;
		});
		if (toRemove.length === 0) return;

		await col.bulkRemove(toRemove.map((t) => t.id));
		const kept = tempDocs.length - toRemove.length;
		console.log(`[TempCleanup] Removed ${toRemove.length} replaced temp doc(s) from ${collectionName}${kept > 0 ? `, kept ${kept} unsynced` : ''}`);
		syncStatus.addLog(`Cleanup: removed ${toRemove.length} replaced temp doc(s) from ${collectionName}${kept > 0 ? ` (${kept} unsaved kept)` : ''}`, 'info');
	} catch (err) {
		console.warn(`[TempCleanup] Failed for ${collectionName}:`, err);
	}
}

async function restoreLostItems(preSnapshot: LayoutItemSnapshot[]): Promise<void> {
	try {
		const db = await getDb();
		let restored = 0;

		for (const item of preSnapshot) {
			const current = await db.floor_layout_items.findOne(item.id).exec();
			if (!current) {
				// Item was completely removed — re-insert it
				await db.floor_layout_items.upsert(item);
				restored++;
			} else if (current.deleted_at !== null && item.deleted_at === null) {
				// Item was soft-deleted by resync but was alive before — restore it
				await current.incrementalPatch({ deleted_at: null, updated_at: new Date().toISOString() });
				restored++;
			}
		}

		if (restored > 0) {
			console.warn(`[LayoutGuard] Restored ${restored} item(s) lost during resync`);
			syncStatus.addLog(`LayoutGuard: restored ${restored} item(s) lost during resync`, 'warn');
		}
	} catch (err) {
		console.warn('[LayoutGuard] Failed to restore items:', err);
	}
}

/**
 * Deduplication guard: after resync + restore, detect duplicate items at the
 * same grid position with the same type. Keeps the real (positive) ID and
 * removes the temp (negative) duplicate.
 */
async function deduplicateLayoutItems(): Promise<void> {
	try {
		const db = await getDb();
		const allDocs = await db.floor_layout_items.find({
			selector: { deleted_at: { $eq: null } }
		}).exec();

		// Group by position signature
		const groups = new Map<string, { id: string; isTemp: boolean }[]>();
		for (const doc of allDocs) {
			const sig = layoutSignature(doc);
			if (!groups.has(sig)) groups.set(sig, []);
			groups.get(sig)!.push({ id: doc.id, isTemp: Number(doc.id) < 0 });
		}

		const toRemove: string[] = [];
		for (const [, items] of groups) {
			if (items.length <= 1) continue;
			// If both real and temp exist at same position, remove the temp(s)
			const hasReal = items.some((i) => !i.isTemp);
			if (hasReal) {
				for (const item of items) {
					if (item.isTemp) toRemove.push(item.id);
				}
			}
		}

		if (toRemove.length > 0) {
			await db.floor_layout_items.bulkRemove(toRemove);
			console.log(`[Dedup] Removed ${toRemove.length} duplicate temp item(s)`);
			syncStatus.addLog(`Dedup: removed ${toRemove.length} duplicate temp item(s)`, 'info');
		}
	} catch (err) {
		console.warn('[Dedup] Failed:', err);
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

			// Layout integrity protection: snapshot ALL items before resync so we can restore any lost
			const layoutGuard = collection === 'floor_layout_items'
				? snapshotLayoutItems()
				: Promise.resolve(null);

			layoutGuard.then((layoutSnapshot) => {
				resyncCollection(collection)
					.then(async () => {
						// Restore any items lost during resync (walls, rooms, etc.)
						if (layoutSnapshot && layoutSnapshot.length > 0) {
							await restoreLostItems(layoutSnapshot);
						}
						// Clean up temp-ID docs and deduplicate after resync
						if (collection === 'floor_layout_items') {
							await cleanupReplacedTempIds('floor_layout_items');
							await deduplicateLayoutItems();
						}
						console.log(`[Optimistic] Resync "${collection}" complete ✓`);
						syncStatus.addLog(`Resync: ${collection} pulled from Neon ✓`, 'success');
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

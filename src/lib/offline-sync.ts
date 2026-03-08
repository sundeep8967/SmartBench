import { openDB, DBSchema, IDBPDatabase } from 'idb';

interface TimeClockActionPayload {
    action: "clock_in" | "clock_out" | "start_break" | "end_break" | "start_travel" | "end_travel";
    projectId?: string;
    photoUrl?: string;
    draftData?: {
        clock_in?: string;
        clock_out?: string;
        total_break_minutes?: number;
        travel_duration_minutes?: number;
    };
}

export interface PendingAction extends TimeClockActionPayload {
    id?: number; // Auto-incremented ID
    timestamp: number; // When the action occurred locally
}

interface SmartBenchDB extends DBSchema {
    pending_actions: {
        key: number;
        value: PendingAction;
    };
}

let dbPromise: Promise<IDBPDatabase<SmartBenchDB>> | null = null;

function getDb() {
    if (typeof window === 'undefined') return null; // Only run on client

    if (!dbPromise) {
        dbPromise = openDB<SmartBenchDB>('smartbench-offline-db', 1, {
            upgrade(db) {
                db.createObjectStore('pending_actions', {
                    keyPath: 'id',
                    autoIncrement: true,
                });
            },
        });
    }
    return dbPromise;
}

export async function savePendingAction(action: TimeClockActionPayload) {
    const db = await getDb();
    if (!db) return;

    await db.add('pending_actions', {
        ...action,
        timestamp: Date.now(),
    });
}

export async function getPendingActions(): Promise<PendingAction[]> {
    const db = await getDb();
    if (!db) return [];

    return await db.getAll('pending_actions');
}

export async function clearPendingActions() {
    const db = await getDb();
    if (!db) return;

    await db.clear('pending_actions');
}

export async function removePendingAction(id: number) {
    const db = await getDb();
    if (!db) return;

    await db.delete('pending_actions', id);
}

export interface OfflineDraft {
  id: string;
  uid: string;
  type: string; // 'image' | 'clip' | 'comment' | 'coach_chat'
  title: string;
  prompt?: string;
  style?: string;
  content?: string; // stringified nested data
  createdAt: number;
  status: 'pending' | 'syncing' | 'synced' | 'failed';
  error?: string;
}

const DB_NAME = 'nxclip-offline-db';
const STORE_NAME = 'offline-drafts';
const DB_VERSION = 1;

export function openDraftDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB is not supported in this environment.'));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      reject(request.error);
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onupgradeneeded = (event) => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
  });
}

export async function addOfflineDraft(draft: Omit<OfflineDraft, 'id' | 'createdAt' | 'status'>): Promise<OfflineDraft> {
  const newDraft: OfflineDraft = {
    ...draft,
    id: `${draft.type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    createdAt: Date.now(),
    status: 'pending'
  };

  const db = await openDraftDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.add(newDraft);

    request.onsuccess = () => {
      // Trigger Background Sync request (if browser supports it)
      if ('serviceWorker' in navigator && 'SyncManager' in window) {
        try {
          navigator.serviceWorker.ready.then((reg) => {
            // Tell service worker to sync
            (reg as any).sync.register('sync-drafts').catch((err: any) => {
              console.warn('[PWA Store] Background Sync registration failed:', err);
            });
          }).catch((err) => {
            console.warn('[PWA Store] Service Worker ready rejected:', err);
          });
        } catch (e) {
          console.warn('[PWA Store] Service Worker access failed in sandboxed context:', e);
        }
      }
      resolve(newDraft);
    };

    request.onerror = () => {
      reject(request.error);
    };
  });
}

export async function getOfflineDrafts(): Promise<OfflineDraft[]> {
  const db = await openDraftDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();

    request.onsuccess = () => {
      // Sort drafts by createdAt descending
      const sorted = (request.result as OfflineDraft[]).sort((a, b) => b.createdAt - a.createdAt);
      resolve(sorted);
    };

    request.onerror = () => {
      reject(request.error);
    };
  });
}

export async function updateDraftStatus(id: string, status: OfflineDraft['status'], error?: string): Promise<void> {
  const db = await openDraftDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const getRequest = store.get(id);

    getRequest.onsuccess = () => {
      const draft = getRequest.result as OfflineDraft;
      if (draft) {
        draft.status = status;
        if (error) draft.error = error;
        const updateRequest = store.put(draft);
        updateRequest.onsuccess = () => resolve();
        updateRequest.onerror = () => reject(updateRequest.error);
      } else {
        reject(new Error(`Draft with ID ${id} not found.`));
      }
    };

    getRequest.onerror = () => {
      reject(getRequest.error);
    };
  });
}

export async function deleteOfflineDraft(id: string): Promise<void> {
  const db = await openDraftDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(id);

    request.onsuccess = () => {
      resolve();
    };

    request.onerror = () => {
      reject(request.error);
    };
  });
}

export async function clearSyncedOfflineDrafts(): Promise<void> {
  const drafts = await getOfflineDrafts();
  const db = await openDraftDB();
  const transaction = db.transaction(STORE_NAME, 'readwrite');
  const store = transaction.objectStore(STORE_NAME);

  for (const draft of drafts) {
    if (draft.status === 'synced') {
      store.delete(draft.id);
    }
  }
}

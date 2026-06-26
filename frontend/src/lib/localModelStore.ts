const DB_NAME = "local-model-viewer-db";
const DB_VERSION = 1;
const STORE_NAME = "models";

function getDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      reject(request.error || new Error("Failed to open IndexedDB"));
    };
    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
  });
}

export const localModelStore = {
  async saveFile(modelId: string, file: File): Promise<void> {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, "readwrite");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put(file, modelId);

      request.onerror = () => {
        reject(request.error || new Error(`Failed to save model ${modelId}`));
      };
      request.onsuccess = () => {
        resolve();
      };
    });
  },

  async getFile(modelId: string): Promise<File | null> {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, "readonly");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(modelId);

      request.onerror = () => {
        reject(request.error || new Error(`Failed to get model ${modelId}`));
      };
      request.onsuccess = () => {
        const result = request.result as File | undefined;
        resolve(result || null);
      };
    });
  },

  async deleteFile(modelId: string): Promise<void> {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, "readwrite");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(modelId);

      request.onerror = () => {
        reject(request.error || new Error(`Failed to delete model ${modelId}`));
      };
      request.onsuccess = () => {
        resolve();
      };
    });
  },

  async hasFile(modelId: string): Promise<boolean> {
    const file = await this.getFile(modelId);
    return file !== null;
  },
};

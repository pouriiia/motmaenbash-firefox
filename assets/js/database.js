// Database module for MotmaenBash extension
// Handles SQLite operations for storing and retrieving data

class Database {
  constructor() {
    this.db = null;
    this.dbName = 'motmaenbash';
    this.initialized = false;
  }

  // Initialize the database
  async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, 1);

      request.onerror = (event) => {
        console.error('Database error:', event.target.error);
        reject(event.target.error);
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        if (!db.objectStoreNames.contains('domainHashes')) {
          const domainStore = db.createObjectStore('domainHashes', { keyPath: 'hash' });
          domainStore.createIndex('type', 'type', { unique: false });
          domainStore.createIndex('level', 'level', { unique: false });
        }

        if (!db.objectStoreNames.contains('urlHashes')) {
          const urlStore = db.createObjectStore('urlHashes', { keyPath: 'hash' });
          urlStore.createIndex('type', 'type', { unique: false });
          urlStore.createIndex('level', 'level', { unique: false });
        }

        if (!db.objectStoreNames.contains('metadata')) {
          db.createObjectStore('metadata', { keyPath: 'key' });
        }
      };

      request.onsuccess = (event) => {
        this.db = event.target.result;
        this.initialized = true;
        resolve();
      };
    });
  }

  async clearAll() {
    if (!this.initialized) await this.init();

    return Promise.all([
      this.clearStore('domainHashes'),
      this.clearStore('urlHashes')
    ]);
  }

  async clearStore(storeName) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.clear();

      request.onsuccess = () => resolve();
      request.onerror = (event) => reject(event.target.error);
    });
  }

  async storeHash(hash, type, level, match) {
    if (!this.initialized) await this.init();

    return new Promise((resolve, reject) => {
      const storeName = match === 1 ? 'domainHashes' : 'urlHashes';
      const transaction = this.db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);

      const hashData = {
        hash: hash,
        type: type,
        level: level
      };

      const request = store.put(hashData);

      request.onsuccess = () => resolve();
      request.onerror = (event) => reject(event.target.error);
    });
  }

  async checkDomainHash(hash) {
    if (!this.initialized) await this.init();

    const transaction = this.db.transaction(['domainHashes'], 'readonly');
    const store = transaction.objectStore('domainHashes');
    const request = store.get(hash);

    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        resolve(request.result);
      };
      request.onerror = (event) => {
        console.error('Error looking up domain hash:', event.target.error);
        reject(event.target.error);
      };
    });
  }

  async checkUrlHash(hash) {
    if (!this.initialized) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['urlHashes'], 'readonly');
      const store = transaction.objectStore('urlHashes');
      const request = store.get(hash);

      request.onsuccess = () => {
        resolve(request.result || null);
      };

      request.onerror = (event) => {
        console.error('Error looking up URL hash:', event.target.error);
        reject(event.target.error);
      };
    });
  }

  async storeMetadata(key, value) {
    if (!this.initialized) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['metadata'], 'readwrite');
      const store = transaction.objectStore('metadata');

      const data = {
        key: key,
        value: value
      };

      const request = store.put(data);

      request.onsuccess = () => resolve();
      request.onerror = (event) => reject(event.target.error);
    });
  }

  async getMetadata(key) {
    if (!this.initialized) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['metadata'], 'readonly');
      const store = transaction.objectStore('metadata');
      const request = store.get(key);

      request.onsuccess = () => {
        resolve(request.result ? request.result.value : null);
      };

      request.onerror = (event) => reject(event.target.error);
    });
  }
}
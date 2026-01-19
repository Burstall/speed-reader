/**
 * IndexedDB-based offline storage for articles.
 * Stores full article content for offline reading.
 */

const DB_NAME = 'speed-reader-offline';
const DB_VERSION = 1;
const STORE_NAME = 'articles';

export interface SavedArticle {
  id: string;           // URL hash or content hash
  url: string;          // Original URL
  title: string;
  content: string;      // Full text content
  wordCount: number;
  savedAt: number;      // Timestamp
  lastReadAt?: number;
  currentIndex: number; // Reading progress
  source: string;       // Domain name
  excerpt: string;      // First ~200 chars for preview
}

let dbPromise: Promise<IDBDatabase> | null = null;

function getDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('savedAt', 'savedAt', { unique: false });
        store.createIndex('url', 'url', { unique: true });
      }
    };
  });

  return dbPromise;
}

/**
 * Generate a unique ID for an article based on URL
 */
export function generateArticleId(url: string): string {
  let hash = 0;
  for (let i = 0; i < url.length; i++) {
    const char = url.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16).padStart(8, '0');
}

/**
 * Save an article for offline reading
 */
export async function saveArticle(article: Omit<SavedArticle, 'id' | 'savedAt' | 'excerpt'>): Promise<SavedArticle> {
  const db = await getDB();

  const savedArticle: SavedArticle = {
    ...article,
    id: generateArticleId(article.url),
    savedAt: Date.now(),
    excerpt: article.content.slice(0, 200).trim() + '...',
  };

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const request = store.put(savedArticle);

    request.onsuccess = () => resolve(savedArticle);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Get all saved articles, sorted by savedAt descending
 */
export async function getAllArticles(): Promise<SavedArticle[]> {
  const db = await getDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const index = store.index('savedAt');
    const request = index.openCursor(null, 'prev');
    const articles: SavedArticle[] = [];

    request.onsuccess = (event) => {
      const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
      if (cursor) {
        articles.push(cursor.value);
        cursor.continue();
      } else {
        resolve(articles);
      }
    };

    request.onerror = () => reject(request.error);
  });
}

/**
 * Get a single article by ID
 */
export async function getArticle(id: string): Promise<SavedArticle | null> {
  const db = await getDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const request = store.get(id);

    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Get article by URL
 */
export async function getArticleByUrl(url: string): Promise<SavedArticle | null> {
  const db = await getDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const index = store.index('url');
    const request = index.get(url);

    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Update reading progress for an article
 */
export async function updateProgress(id: string, currentIndex: number): Promise<void> {
  const db = await getDB();
  const article = await getArticle(id);

  if (!article) return;

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const request = store.put({
      ...article,
      currentIndex,
      lastReadAt: Date.now(),
    });

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

/**
 * Delete an article
 */
export async function deleteArticle(id: string): Promise<void> {
  const db = await getDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const request = store.delete(id);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

/**
 * Check if an article is saved
 */
export async function isArticleSaved(url: string): Promise<boolean> {
  const article = await getArticleByUrl(url);
  return article !== null;
}

/**
 * Get total storage used (approximate)
 */
export async function getStorageUsed(): Promise<number> {
  const articles = await getAllArticles();
  let totalBytes = 0;

  for (const article of articles) {
    totalBytes += new Blob([JSON.stringify(article)]).size;
  }

  return totalBytes;
}

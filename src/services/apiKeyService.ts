/**
 * API Key Service
 * Provides secure storage and retrieval of API keys using AES-GCM encryption
 */

const STORAGE_KEY = 'lp_generator_api_key';
const ENCRYPTION_KEY_NAME = 'lp_generator_encryption_key';

/**
 * Generate a cryptographic key for AES-GCM encryption
 */
async function getEncryptionKey(): Promise<CryptoKey> {
  // Try to retrieve existing key from IndexedDB
  const existingKey = await retrieveKeyFromStorage();
  if (existingKey) {
    return existingKey;
  }

  // Generate new key
  const key = await crypto.subtle.generateKey(
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  );

  // Store key in IndexedDB
  await storeKeyInStorage(key);

  return key;
}

/**
 * Store encryption key in IndexedDB
 */
async function storeKeyInStorage(key: CryptoKey): Promise<void> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('LPGeneratorKeys', 1);

    request.onerror = () => reject(request.error);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains('keys')) {
        db.createObjectStore('keys');
      }
    };

    request.onsuccess = async () => {
      const db = request.result;
      const exportedKey = await crypto.subtle.exportKey('jwk', key);

      const transaction = db.transaction(['keys'], 'readwrite');
      const store = transaction.objectStore('keys');
      store.put(exportedKey, ENCRYPTION_KEY_NAME);

      transaction.oncomplete = () => {
        db.close();
        resolve();
      };
      transaction.onerror = () => {
        db.close();
        reject(transaction.error);
      };
    };
  });
}

/**
 * Retrieve encryption key from IndexedDB
 */
async function retrieveKeyFromStorage(): Promise<CryptoKey | null> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('LPGeneratorKeys', 1);

    request.onerror = () => reject(request.error);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains('keys')) {
        db.createObjectStore('keys');
      }
    };

    request.onsuccess = async () => {
      const db = request.result;

      try {
        const transaction = db.transaction(['keys'], 'readonly');
        const store = transaction.objectStore('keys');
        const getRequest = store.get(ENCRYPTION_KEY_NAME);

        getRequest.onsuccess = async () => {
          const jwk = getRequest.result;
          db.close();

          if (!jwk) {
            resolve(null);
            return;
          }

          try {
            const key = await crypto.subtle.importKey(
              'jwk',
              jwk,
              { name: 'AES-GCM' },
              true,
              ['encrypt', 'decrypt']
            );
            resolve(key);
          } catch {
            resolve(null);
          }
        };

        getRequest.onerror = () => {
          db.close();
          resolve(null);
        };
      } catch {
        db.close();
        resolve(null);
      }
    };
  });
}

/**
 * Encrypt a string using AES-GCM
 */
async function encrypt(plaintext: string): Promise<string> {
  const key = await getEncryptionKey();
  const encoder = new TextEncoder();
  const data = encoder.encode(plaintext);

  // Generate random IV
  const iv = crypto.getRandomValues(new Uint8Array(12));

  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    data
  );

  // Combine IV and ciphertext
  const combined = new Uint8Array(iv.length + ciphertext.byteLength);
  combined.set(iv);
  combined.set(new Uint8Array(ciphertext), iv.length);

  // Return as base64
  return btoa(String.fromCharCode(...combined));
}

/**
 * Decrypt a string using AES-GCM
 */
async function decrypt(encryptedData: string): Promise<string> {
  const key = await getEncryptionKey();

  // Decode from base64
  const combined = new Uint8Array(
    atob(encryptedData)
      .split('')
      .map((c) => c.charCodeAt(0))
  );

  // Extract IV and ciphertext
  const iv = combined.slice(0, 12);
  const ciphertext = combined.slice(12);

  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    ciphertext
  );

  const decoder = new TextDecoder();
  return decoder.decode(decrypted);
}

/**
 * Save API key to localStorage with encryption
 */
export async function saveApiKey(apiKey: string): Promise<void> {
  if (!apiKey || apiKey.trim() === '') {
    throw new Error('API key cannot be empty');
  }

  const encryptedKey = await encrypt(apiKey.trim());
  localStorage.setItem(STORAGE_KEY, encryptedKey);
}

/**
 * Get API key from localStorage (decrypted)
 */
export async function getApiKey(): Promise<string | null> {
  const encryptedKey = localStorage.getItem(STORAGE_KEY);

  if (!encryptedKey) {
    return null;
  }

  try {
    return await decrypt(encryptedKey);
  } catch {
    // If decryption fails, clear the invalid data
    localStorage.removeItem(STORAGE_KEY);
    return null;
  }
}

/**
 * Check if API key is saved
 */
export function hasApiKey(): boolean {
  return localStorage.getItem(STORAGE_KEY) !== null;
}

/**
 * Get masked API key for display (e.g., "AIza****...****xyz")
 */
export async function getMaskedApiKey(): Promise<string | null> {
  const apiKey = await getApiKey();

  if (!apiKey) {
    return null;
  }

  if (apiKey.length <= 8) {
    return '****';
  }

  const prefix = apiKey.slice(0, 4);
  const suffix = apiKey.slice(-4);
  return `${prefix}****...****${suffix}`;
}

/**
 * Clear saved API key
 */
export function clearApiKey(): void {
  localStorage.removeItem(STORAGE_KEY);
}

/**
 * Validate API key format (basic validation for Gemini API keys)
 */
export function validateApiKeyFormat(apiKey: string): {
  valid: boolean;
  message?: string;
} {
  if (!apiKey || apiKey.trim() === '') {
    return { valid: false, message: 'APIキーを入力してください' };
  }

  const trimmedKey = apiKey.trim();

  // Gemini API keys typically start with 'AIza'
  if (!trimmedKey.startsWith('AIza')) {
    return {
      valid: false,
      message: 'Gemini APIキーの形式が正しくありません（AIzaで始まる必要があります）',
    };
  }

  // Check minimum length
  if (trimmedKey.length < 20) {
    return { valid: false, message: 'APIキーが短すぎます' };
  }

  return { valid: true };
}

/**
 * Test API key validity by making a simple API call
 */
export async function testApiKey(apiKey: string): Promise<{
  valid: boolean;
  message: string;
}> {
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (response.ok) {
      return { valid: true, message: 'APIキーは有効です' };
    }

    if (response.status === 400 || response.status === 401) {
      return { valid: false, message: 'APIキーが無効です' };
    }

    if (response.status === 429) {
      return { valid: false, message: 'レート制限に達しました。しばらく待ってください' };
    }

    return { valid: false, message: `APIエラー: ${response.status}` };
  } catch {
    return {
      valid: false,
      message: 'APIへの接続に失敗しました。ネットワークを確認してください',
    };
  }
}

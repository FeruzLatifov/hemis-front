/**
 * Async LocalStorage Wrapper
 * 
 * Provides non-blocking storage operations
 */

export const storage = {
  async getItem(key: string): Promise<string | null> {
    return new Promise((resolve) => {
      requestIdleCallback(() => {
        resolve(localStorage.getItem(key));
      });
    });
  },

  async setItem(key: string, value: string): Promise<void> {
    return new Promise((resolve) => {
      requestIdleCallback(() => {
        localStorage.setItem(key, value);
        resolve();
      });
    });
  },

  async removeItem(key: string): Promise<void> {
    return new Promise((resolve) => {
      requestIdleCallback(() => {
        localStorage.removeItem(key);
        resolve();
      });
    });
  },

  getItemSync(key: string): string | null {
    return localStorage.getItem(key);
  },

  setItemSync(key: string, value: string): void {
    localStorage.setItem(key, value);
  },
};

declare global {
  interface Window {
    requestIdleCallback: (
      callback: IdleRequestCallback,
      options?: IdleRequestOptions
    ) => number;
    cancelIdleCallback: (handle: number) => void;
  }
}

if (typeof window !== 'undefined' && !window.requestIdleCallback) {
  window.requestIdleCallback = function (cb) {
    const start = Date.now();
    return setTimeout(() => {
      cb({
        didTimeout: false,
        timeRemaining: () => Math.max(0, 50 - (Date.now() - start)),
      });
    }, 1);
  };

  window.cancelIdleCallback = function (id) {
    clearTimeout(id);
  };
}


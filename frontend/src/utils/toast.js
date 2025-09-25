import toast from 'react-hot-toast';

// Toast deduplication to prevent multiple identical messages
const toastCache = new Set();

export const showToast = (message, type = 'error') => {
  const toastKey = `${type}:${message}`;
  if (toastCache.has(toastKey)) return;

  toastCache.add(toastKey);
  toast[type](message);

  // Clear from cache after 3 seconds
  setTimeout(() => toastCache.delete(toastKey), 3000);
};

export const clearToastCache = () => {
  toastCache.clear();
};

export default { showToast, clearToastCache };
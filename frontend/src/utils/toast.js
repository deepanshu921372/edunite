import toast from 'react-hot-toast';

// Toast deduplication to prevent multiple identical messages
const toastCache = new Set();

export const showToast = (message, type = 'error') => {
  const toastKey = `${type}:${message}`;
  if (toastCache.has(toastKey)) return;

  toastCache.add(toastKey);

  // Handle different toast types properly for react-hot-toast
  switch (type) {
    case 'success':
      toast.success(message);
      break;
    case 'error':
      toast.error(message);
      break;
    case 'info':
      toast(message, { icon: 'ℹ️' });
      break;
    case 'warning':
      toast(message, { icon: '⚠️' });
      break;
    default:
      toast.error(message);
  }

  // Clear from cache after 3 seconds
  setTimeout(() => toastCache.delete(toastKey), 3000);
};

export const clearToastCache = () => {
  toastCache.clear();
};

export default { showToast, clearToastCache };
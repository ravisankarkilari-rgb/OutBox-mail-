// Universal persistent storage helper for Outbox & Dashboard

export const getSavedHistory = (userEmail) => {
  const mergedMap = new Map();

  // Known candidate keys across all past sessions
  const candidateKeys = [
    'outbox_history_permanent',
    'outbox_history_all',
    'outbox_history_default',
  ];
  if (userEmail) {
    candidateKeys.push(`outbox_history_${userEmail.toLowerCase()}`);
    candidateKeys.push(`outbox_history_${userEmail}`);
  }

  // Scan all localStorage keys starting with outbox_history_
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith('outbox_history_')) {
        candidateKeys.push(k);
      }
    }
  } catch (_) {}

  // Parse and merge items by ID
  Array.from(new Set(candidateKeys)).forEach((k) => {
    try {
      const raw = localStorage.getItem(k);
      if (raw) {
        const list = JSON.parse(raw);
        if (Array.isArray(list)) {
          list.forEach((item) => {
            if (item && item.id) {
              mergedMap.set(item.id, item);
            }
          });
        }
      }
    } catch (_) {}
  });

  return Array.from(mergedMap.values()).sort(
    (a, b) => new Date(b.scheduledAt || b.createdAt) - new Date(a.scheduledAt || a.createdAt)
  );
};

export const persistHistory = (list, userEmail) => {
  const keys = ['outbox_history_permanent', 'outbox_history_all', 'outbox_history_default'];
  if (userEmail) {
    keys.push(`outbox_history_${userEmail.toLowerCase()}`);
    keys.push(`outbox_history_${userEmail}`);
  }
  const cleanList = list.slice(0, 100);
  keys.forEach((k) => {
    try {
      localStorage.setItem(k, JSON.stringify(cleanList));
    } catch (_) {}
  });
};

export const saveEmailToHistory = (item, userEmail) => {
  const current = getSavedHistory(userEmail);
  const filtered = current.filter((e) => e.id !== item.id);
  const updated = [item, ...filtered];
  persistHistory(updated, userEmail);
  return updated;
};

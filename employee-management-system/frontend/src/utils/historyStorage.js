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

  // Parse and merge items by ID first
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

  // Strict deduplication by content signature to eliminate double-registration
  const signatureMap = new Map();
  Array.from(mergedMap.values()).forEach((item) => {
    // Content signature: subject + recipients + minute of scheduledAt/createdAt
    const timeKey = item.scheduledAt
      ? new Date(item.scheduledAt).toISOString().substring(0, 16)
      : new Date(item.createdAt || 0).toISOString().substring(0, 16);
    const sig = `${(item.subject || '').trim()}|${(item.recipients || '').trim()}|${timeKey}`;

    if (signatureMap.has(sig)) {
      const existing = signatureMap.get(sig);
      // Prefer real DB ID over temporary client ID
      if (item.id && !item.id.startsWith('mail_') && existing.id.startsWith('mail_')) {
        signatureMap.set(sig, item);
      } else if (item.status === 'SENT' && existing.status !== 'SENT') {
        signatureMap.set(sig, item);
      }
    } else {
      signatureMap.set(sig, item);
    }
  });

  const cleanList = Array.from(signatureMap.values()).sort(
    (a, b) => new Date(b.scheduledAt || b.createdAt) - new Date(a.scheduledAt || a.createdAt)
  );

  // Persist clean deduplicated list back to localStorage
  try {
    const serialized = JSON.stringify(cleanList.slice(0, 100));
    candidateKeys.forEach((k) => {
      try {
        localStorage.setItem(k, serialized);
      } catch (_) {}
    });
  } catch (_) {}

  return cleanList;
};

export const persistHistory = (list, userEmail) => {
  const keys = ['outbox_history_permanent', 'outbox_history_all', 'outbox_history_default'];
  if (userEmail) {
    keys.push(`outbox_history_${userEmail.toLowerCase()}`);
    keys.push(`outbox_history_${userEmail}`);
  }

  // Deduplicate before writing
  const signatureMap = new Map();
  list.forEach((item) => {
    if (!item) return;
    const timeKey = item.scheduledAt
      ? new Date(item.scheduledAt).toISOString().substring(0, 16)
      : new Date(item.createdAt || 0).toISOString().substring(0, 16);
    const sig = item.id ? `id_${item.id}` : `${(item.subject || '').trim()}|${(item.recipients || '').trim()}|${timeKey}`;
    signatureMap.set(sig, item);
  });

  const cleanList = Array.from(signatureMap.values()).slice(0, 100);
  keys.forEach((k) => {
    try {
      localStorage.setItem(k, JSON.stringify(cleanList));
    } catch (_) {}
  });
};

export const saveEmailToHistory = (item, userEmail, replaceId = null) => {
  const current = getSavedHistory(userEmail);
  const filtered = current.filter((e) => e.id !== item.id && (!replaceId || e.id !== replaceId));
  const updated = [item, ...filtered];
  persistHistory(updated, userEmail);
  return updated;
};


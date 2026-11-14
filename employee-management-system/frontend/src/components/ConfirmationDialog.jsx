import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { Modal } from './Modal';

export const ConfirmationDialog = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirm Action',
  message = 'Are you sure you want to proceed?',
  confirmText = 'Delete',
  isDestructive = true,
  loading = false,
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} maxWidth="max-w-md">
      <div className="text-center py-2">
        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-rose-100 mb-4">
          <AlertTriangle className="h-6 w-6 text-rose-600" />
        </div>
        <p className="text-sm text-slate-600">{message}</p>
        <div className="mt-6 flex justify-end space-x-3">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 transition"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`px-4 py-2 text-sm font-medium text-white rounded-xl transition ${
              isDestructive
                ? 'bg-rose-600 hover:bg-rose-700'
                : 'bg-primary-600 hover:bg-primary-700'
            } disabled:opacity-50`}
          >
            {loading ? 'Processing...' : confirmText}
          </button>
        </div>
      </div>
    </Modal>
  );
};


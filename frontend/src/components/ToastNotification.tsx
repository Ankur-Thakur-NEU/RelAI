'use client';

import { useState } from 'react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastProps {
  message: string;
  type?: ToastType;
  isVisible: boolean;
  onClose: () => void;
  duration?: number;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center';
}

const getToastStyles = (type: ToastType) => {
  switch (type) {
    case 'success':
      return { bg: 'bg-green-500', icon: '✓' };
    case 'error':
      return { bg: 'bg-red-500', icon: '✕' };
    case 'warning':
      return { bg: 'bg-yellow-500', icon: '⚠' };
    case 'info':
      return { bg: 'bg-blue-500', icon: 'ℹ' };
    default:
      return { bg: 'bg-gray-800', icon: '' };
  }
};

const getPositionStyles = (position: ToastProps['position']) => {
  switch (position) {
    case 'top-left': return 'top-4 left-4';
    case 'top-center': return 'top-4 left-1/2 transform -translate-x-1/2';
    case 'top-right': return 'top-4 right-4';
    case 'bottom-left': return 'bottom-4 left-4';
    case 'bottom-center': return 'bottom-4 left-1/2 transform -translate-x-1/2';
    case 'bottom-right': return 'bottom-4 right-4';
    default: return 'top-4 right-4';
  }
};

export default function ToastNotification({ message, type = 'success', isVisible, onClose, duration = 3000, position = 'top-right' }: ToastProps) {
  const [isLeaving, setIsLeaving] = useState(false);

  if (!isVisible) return null;

  const { bg, icon } = getToastStyles(type);
  const positionClass = getPositionStyles(position);

  const handleClose = () => {
    setIsLeaving(true);
    setTimeout(onClose, 200);
  };

  return (
    <div className={`fixed z-50 ${positionClass} ${isLeaving ? 'opacity-0 transition-opacity duration-200' : 'opacity-100 transition-opacity duration-200'}`} role="alert">
      <div className={`${bg} text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 min-w-64 max-w-md`}>
        <div>{icon}</div>
        <div className="flex-1"><p className="text-sm font-medium">{message}</p></div>
        <button onClick={handleClose} className="text-white/80 hover:text-white p-1 rounded-full">×</button>
      </div>
    </div>
  );
}

// Hook for managing multiple toasts
export function useToast() {
  const [toasts, setToasts] = useState<Array<{ id: string; message: string; type: ToastType; duration?: number }>>([]);

  const showToast = (message: string, type: ToastType = 'success', duration = 3000) => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts(prev => [...prev, { id, message, type, duration }]);
    if (duration > 0) setTimeout(() => removeToast(id), duration);
  };

  const removeToast = (id: string) => setToasts(prev => prev.filter(t => t.id !== id));

  return {
    toasts,
    showToast,
    removeToast,
    success: (msg: string, dur?: number) => showToast(msg, 'success', dur),
    error: (msg: string, dur?: number) => showToast(msg, 'error', dur),
    warning: (msg: string, dur?: number) => showToast(msg, 'warning', dur),
    info: (msg: string, dur?: number) => showToast(msg, 'info', dur),
  };
}

// Container for all toasts
export function ToastContainer() {
  const { toasts, removeToast } = useToast();

  return (
    <>
      {toasts.map(toast => (
        <ToastNotification
          key={toast.id}
          message={toast.message}
          type={toast.type}
          isVisible={true}
          onClose={() => removeToast(toast.id)}
          duration={toast.duration}
          position="top-right"
        />
      ))}
    </>
  );
}

'use client';

import { useState, type ReactNode } from 'react';
import {
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Info,
  X,
  Loader2,
} from 'lucide-react';

export type NotificationType = 'success' | 'error' | 'warning' | 'info' | 'confirm';

export interface NotificationModalProps {
  isOpen: boolean;
  type?: NotificationType;
  title: string;
  message: string | ReactNode;
  confirmText?: string;
  cancelText?: string;
  confirmVariant?: 'primary' | 'danger';
  isLoading?: boolean;
  closeOnBackdrop?: boolean;
  onConfirm?: () => void | Promise<void>;
  onClose: () => void;
}

export default function NotificationModal({
  isOpen,
  type = 'info',
  title,
  message,
  confirmText,
  cancelText = 'Hủy',
  confirmVariant = 'primary',
  isLoading = false,
  closeOnBackdrop = true,
  onConfirm,
  onClose,
}: NotificationModalProps) {
  if (!isOpen) return null;

  const isConfirm = type === 'confirm';
  const defaultConfirmText = isConfirm
    ? (confirmVariant === 'danger' ? 'Xác nhận xóa' : 'Xác nhận')
    : 'Đồng ý';

  const actionText = confirmText || defaultConfirmText;

  // Icon, color tokens aligned with CheckInn design system
  const typeConfig = {
    success: {
      icon: <CheckCircle2 className="w-8 h-8 text-[#16A34A]" />,
      badgeBg: 'bg-[#F0FDF4] border-[#DCFCE7]',
      btnBg: 'bg-[#16A34A] hover:bg-[#15803D]',
    },
    error: {
      icon: <AlertCircle className="w-8 h-8 text-[#DC2626]" />,
      badgeBg: 'bg-[#FEF2F2] border-[#FEE2E2]',
      btnBg: 'bg-[#DC2626] hover:bg-[#B91C1C]',
    },
    warning: {
      icon: <AlertTriangle className="w-8 h-8 text-[#D97706]" />,
      badgeBg: 'bg-[#FFFBEB] border-[#FEF3C7]',
      btnBg: 'bg-[#D97706] hover:bg-[#B45309]',
    },
    info: {
      icon: <Info className="w-8 h-8 text-[#0057FF]" />,
      badgeBg: 'bg-[#EFF6FF] border-[#DBEAFE]',
      btnBg: 'bg-[#0057FF] hover:bg-[#0046CC]',
    },
    confirm: {
      icon: confirmVariant === 'danger'
        ? <AlertTriangle className="w-8 h-8 text-[#DC2626]" />
        : <Info className="w-8 h-8 text-[#0057FF]" />,
      badgeBg: confirmVariant === 'danger' ? 'bg-[#FEF2F2] border-[#FEE2E2]' : 'bg-[#EFF6FF] border-[#DBEAFE]',
      btnBg: confirmVariant === 'danger' ? 'bg-[#DC2626] hover:bg-[#B91C1C]' : 'bg-[#0057FF] hover:bg-[#0046CC]',
    },
  }[type];

  const handleBackdropClick = () => {
    if (closeOnBackdrop && !isLoading) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/45 backdrop-blur-xs transition-opacity duration-200"
      onClick={handleBackdropClick}
    >
      <div
        className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-[#E8E9F1] text-center transform transition-all animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button (X) */}
        {!isLoading && (
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 rounded-full p-1.5 text-[#8B94A4] hover:bg-[#F3F4F6] hover:text-[#1F2226] transition"
            aria-label="Đóng"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {/* Icon Circle */}
        <div className="flex justify-center mb-4">
          <div className={`w-14 h-14 rounded-full flex items-center justify-center border ${typeConfig.badgeBg}`}>
            {typeConfig.icon}
          </div>
        </div>

        {/* Title */}
        <h3 className="text-xl font-bold text-[#1F2226] mb-2">{title}</h3>

        {/* Message */}
        <div className="text-sm text-[#656F81] leading-relaxed mb-6 whitespace-pre-line text-center">
          {message}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          {isConfirm ? (
            <>
              <button
                type="button"
                disabled={isLoading}
                onClick={onClose}
                className="flex-1 rounded-xl border border-[#E8E9F1] bg-white py-2.5 text-sm font-semibold text-[#1F2226] hover:bg-[#F9FAFB] transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {cancelText}
              </button>
              <button
                type="button"
                disabled={isLoading}
                onClick={onConfirm}
                className={`flex-1 inline-flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold text-white shadow-sm transition disabled:opacity-50 disabled:cursor-not-allowed ${typeConfig.btnBg}`}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Đang xử lý...
                  </>
                ) : (
                  actionText
                )}
              </button>
            </>
          ) : (
            <button
              type="button"
              disabled={isLoading}
              onClick={onConfirm || onClose}
              className={`w-full inline-flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold text-white shadow-sm transition disabled:opacity-50 disabled:cursor-not-allowed ${typeConfig.btnBg}`}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Đang xử lý...
                </>
              ) : (
                actionText
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export interface NotificationModalState {
  isOpen: boolean;
  type?: NotificationType;
  title: string;
  message: string | ReactNode;
  confirmText?: string;
  cancelText?: string;
  confirmVariant?: 'primary' | 'danger';
  isLoading?: boolean;
  closeOnBackdrop?: boolean;
  onConfirm?: () => void | Promise<void>;
  onClose?: () => void;
}

export function useNotificationModal() {
  const [modalState, setModalState] = useState<NotificationModalState>({
    isOpen: false,
    title: '',
    message: '',
  });

  const showModal = (config: Omit<NotificationModalState, 'isOpen'>) => {
    setModalState({
      ...config,
      isOpen: true,
    });
  };

  const closeModal = () => {
    setModalState((prev) => {
      prev.onClose?.();
      return { ...prev, isOpen: false, isLoading: false };
    });
  };

  const showSuccess = (title: string, message: string | ReactNode, onConfirm?: () => void) => {
    showModal({
      type: 'success',
      title,
      message,
      onConfirm,
    });
  };

  const showError = (title: string, message: string | ReactNode, onConfirm?: () => void) => {
    showModal({
      type: 'error',
      title,
      message,
      onConfirm,
    });
  };

  const showWarning = (title: string, message: string | ReactNode, onConfirm?: () => void) => {
    showModal({
      type: 'warning',
      title,
      message,
      onConfirm,
    });
  };

  const showInfo = (title: string, message: string | ReactNode, onConfirm?: () => void) => {
    showModal({
      type: 'info',
      title,
      message,
      onConfirm,
    });
  };

  const showConfirm = ({
    title,
    message,
    confirmText,
    cancelText = 'Hủy',
    confirmVariant = 'primary',
    onConfirm,
    onClose,
  }: {
    title: string;
    message: string | ReactNode;
    confirmText?: string;
    cancelText?: string;
    confirmVariant?: 'primary' | 'danger';
    onConfirm: () => void | Promise<void>;
    onClose?: () => void;
  }) => {
    showModal({
      type: 'confirm',
      title,
      message,
      confirmText,
      cancelText,
      confirmVariant,
      onConfirm,
      onClose,
    });
  };

  return {
    modalState,
    setModalState,
    showModal,
    closeModal,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    showConfirm,
  };
}

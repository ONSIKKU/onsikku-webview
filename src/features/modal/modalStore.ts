import { create } from 'zustand';

export type ModalType = 'alert' | 'confirm';

interface ModalState {
  isOpen: boolean;
  type: ModalType;
  title?: string;
  content: React.ReactNode;
  confirmText: string;
  cancelText: string;
  onConfirm?: () => void;
  onCancel?: () => void;
  
  // Actions
  openModal: (params: {
    type?: ModalType;
    title?: string;
    content: React.ReactNode;
    confirmText?: string;
    cancelText?: string;
    onConfirm?: () => void;
    onCancel?: () => void;
  }) => void;
  closeModal: () => void;
}

export const useModalStore = create<ModalState>((set) => ({
  isOpen: false,
  type: 'alert',
  title: '',
  content: '',
  confirmText: '확인',
  cancelText: '취소',
  onConfirm: undefined,
  onCancel: undefined,

  openModal: (params) =>
    set({
      isOpen: true,
      type: params.type || 'alert',
      title: params.title || '',
      content: params.content,
      confirmText: params.confirmText || '확인',
      cancelText: params.cancelText || '취소',
      onConfirm: params.onConfirm,
      onCancel: params.onCancel,
    }),
  closeModal: () => set({ isOpen: false }),
}));

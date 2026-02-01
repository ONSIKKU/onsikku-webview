import { useModalStore } from '@/features/modal/modalStore';

export default function GlobalModal() {
  const {
    isOpen,
    type,
    title,
    content,
    confirmText,
    cancelText,
    onConfirm,
    onCancel,
    closeModal,
  } = useModalStore();

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (onConfirm) onConfirm();
    closeModal();
  };

  const handleCancel = () => {
    if (onCancel) onCancel();
    closeModal();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-6 animate-fade-in">
      <div className="w-full max-w-sm overflow-hidden rounded-[24px] bg-white shadow-xl animate-scale-up">
        <div className="p-6 text-center">
          {title && (
            <h3 className="mb-2 text-lg font-bold text-gray-900">{title}</h3>
          )}
          <div className="text-base text-gray-600 whitespace-pre-wrap leading-relaxed">
            {content}
          </div>
        </div>

        <div className="flex border-t border-gray-100">
          {type === 'confirm' && (
            <button
              type="button"
              className="flex-1 py-4 text-base font-medium text-gray-500 active:bg-gray-50"
              onClick={handleCancel}
            >
              {cancelText}
            </button>
          )}
          {type === 'confirm' && <div className="w-[1px] bg-gray-100" />}
          <button
            type="button"
            className={`flex-1 py-4 text-base font-bold active:bg-gray-50 ${
              type === 'confirm' ? 'text-onsikku-dark-orange' : 'text-gray-900'
            }`}
            onClick={handleConfirm}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

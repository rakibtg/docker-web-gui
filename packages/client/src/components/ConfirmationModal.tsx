import { memo } from "react";
import { FaExclamationTriangle, FaTimes } from "react-icons/fa";

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  onConfirmWithForce?: () => void;
  title: string;
  message: string;
  confirmText?: string;
  confirmWithForceText?: string;
  cancelText?: string;
  type?: "warning" | "danger" | "info";
  showForceOption?: boolean;
}

const ConfirmationModal = memo(function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  onConfirmWithForce,
  title,
  message,
  confirmText = "Confirm",
  confirmWithForceText = "Force Remove",
  cancelText = "Cancel",
  type = "warning",
  showForceOption = false,
}: ConfirmationModalProps) {
  if (!isOpen) return null;

  const getIconColor = () => {
    switch (type) {
      case "danger":
        return "text-red-500";
      case "info":
        return "text-blue-500";
      default:
        return "text-yellow-500";
    }
  };

  const getConfirmButtonColor = () => {
    switch (type) {
      case "danger":
        return "bg-red-600 hover:bg-red-700";
      case "info":
        return "bg-blue-600 hover:bg-blue-700";
      default:
        return "bg-yellow-600 hover:bg-yellow-700";
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-800 rounded-lg shadow-xl max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <div className="flex items-center gap-3">
            <FaExclamationTriangle className={`h-6 w-6 ${getIconColor()}`} />
            <h3 className="text-lg font-semibold text-gray-100">
              {title}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            aria-label="Close modal"
          >
            <FaTimes size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-gray-300">{message}</p>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t border-gray-700">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-300 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-md transition-colors"
          >
            {cancelText}
          </button>

          {showForceOption && onConfirmWithForce && (
            <button
              onClick={onConfirmWithForce}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors"
            >
              {confirmWithForceText}
            </button>
          )}

          <button
            onClick={onConfirm}
            className={`px-4 py-2 text-white rounded-md transition-colors ${getConfirmButtonColor()}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
});

export { ConfirmationModal };

import { memo } from "react";
import { Button } from "./Button";
import { FaExclamationTriangle, FaTimes } from "react-icons/fa";

interface ConfirmationModalProps {
  title: string;
  message: string;
  isOpen: boolean;
  cancelText?: string;
  onClose: () => void;
  confirmText?: string;
  onConfirm: () => void;
  showForceOption?: boolean;
  confirmWithForceText?: string;
  onConfirmWithForce?: () => void;
  type?: "warning" | "danger" | "info";
}

const ConfirmationModal = memo(function ConfirmationModal({
  title,
  isOpen,
  message,
  onClose,
  onConfirm,
  type = "warning",
  onConfirmWithForce,
  cancelText = "Cancel",
  confirmText = "Confirm",
  showForceOption = false,
  confirmWithForceText = "Force Remove",
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

  const confirmVariant =
    type === "danger" ? "danger" : type === "info" ? "primary" : "warning";

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-800 rounded-lg shadow-xl max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <div className="flex items-center gap-3">
            <FaExclamationTriangle className={`h-6 w-6 ${getIconColor()}`} />
            <h3 className="text-lg font-semibold text-gray-100">{title}</h3>
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
          <Button onClick={onClose} variant="secondary" size="lg">
            {cancelText}
          </Button>

          {showForceOption && onConfirmWithForce && (
            <Button onClick={onConfirmWithForce} variant="danger" size="lg">
              {confirmWithForceText}
            </Button>
          )}

          <Button onClick={onConfirm} variant={confirmVariant} size="lg">
            {confirmText}
          </Button>
        </div>
      </div>
    </div>
  );
});

export { ConfirmationModal };

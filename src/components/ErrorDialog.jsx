import { useState } from 'react'
import './ErrorDialog.css'

const WarningIcon = ({ size = 20 }) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 20 20"
        fill="currentColor"
    >
        <path
            fillRule="evenodd"
            d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
            clipRule="evenodd"
        />
    </svg>
)

export default function ErrorDialog({
    isOpen,
    onClose,
    title = "An error occurred!",
    message,
    onConfirm,
    confirmText = "Delete",
    cancelText = "Cancel"
}) {
    if (!isOpen) return null

    const handleConfirm = () => {
        if (onConfirm) onConfirm()
        onClose()
    }

    return (
        <div className="error-dialog-overlay" onClick={onClose}>
            <div className="error-dialog-content" onClick={(e) => e.stopPropagation()}>
                <div className="error-dialog-body">
                    {/* Icon */}
                    <div className="error-dialog-icon">
                        <WarningIcon size={20} />
                    </div>

                    {/* Content */}
                    <div className="error-dialog-text">
                        <h3 className="error-dialog-title">{title}</h3>
                        <p className="error-dialog-message">{message}</p>

                        {/* Actions */}
                        <div className="error-dialog-actions">
                            <button
                                onClick={handleConfirm}
                                className="error-dialog-btn error-dialog-btn-danger"
                            >
                                {confirmText}
                            </button>
                            <button
                                onClick={onClose}
                                className="error-dialog-btn error-dialog-btn-cancel"
                            >
                                {cancelText}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

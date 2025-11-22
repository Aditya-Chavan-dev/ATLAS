/**
 * Toast Notification System
 * Simple toast notifications for user feedback
 */

let toastContainer = null;

/**
 * Initialize toast container
 */
const initToastContainer = () => {
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.id = 'toast-container';
        toastContainer.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 10000;
            display: flex;
            flex-direction: column;
            gap: 12px;
            pointer-events: none;
        `;
        document.body.appendChild(toastContainer);
    }
    return toastContainer;
};

/**
 * Create and show a toast notification
 * @param {string} message - Toast message
 * @param {string} type - Toast type ('success', 'error', 'info', 'warning')
 * @param {number} duration - Duration in milliseconds (default: 3000)
 */
const showToast = (message, type = 'info', duration = 3000) => {
    const container = initToastContainer();

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    // Icon based on type
    const icons = {
        success: '✓',
        error: '✕',
        warning: '⚠',
        info: 'ℹ',
    };

    // Colors based on type
    const colors = {
        success: { bg: 'rgba(16, 185, 129, 0.95)', border: '#10b981' },
        error: { bg: 'rgba(239, 68, 68, 0.95)', border: '#ef4444' },
        warning: { bg: 'rgba(245, 158, 11, 0.95)', border: '#f59e0b' },
        info: { bg: 'rgba(59, 130, 246, 0.95)', border: '#3b82f6' },
    };

    const color = colors[type] || colors.info;

    toast.style.cssText = `
        background: ${color.bg};
        border: 1px solid ${color.border};
        border-radius: 8px;
        padding: 12px 16px;
        color: white;
        font-size: 14px;
        font-weight: 500;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        display: flex;
        align-items: center;
        gap: 10px;
        min-width: 250px;
        max-width: 400px;
        pointer-events: auto;
        animation: slideInRight 0.3s ease-out;
        backdrop-filter: blur(10px);
    `;

    toast.innerHTML = `
        <span style="font-size: 18px;">${icons[type] || icons.info}</span>
        <span style="flex: 1;">${message}</span>
    `;

    // Add animation keyframes if not already added
    if (!document.getElementById('toast-animations')) {
        const style = document.createElement('style');
        style.id = 'toast-animations';
        style.textContent = `
            @keyframes slideInRight {
                from {
                    transform: translateX(400px);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }
            @keyframes slideOutRight {
                from {
                    transform: translateX(0);
                    opacity: 1;
                }
                to {
                    transform: translateX(400px);
                    opacity: 0;
                }
            }
        `;
        document.head.appendChild(style);
    }

    container.appendChild(toast);

    // Auto dismiss
    setTimeout(() => {
        toast.style.animation = 'slideOutRight 0.3s ease-out';
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
    }, duration);

    // Click to dismiss
    toast.addEventListener('click', () => {
        toast.style.animation = 'slideOutRight 0.3s ease-out';
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
    });
};

/**
 * Show success toast
 * @param {string} message - Success message
 * @param {number} duration - Duration in milliseconds
 */
export const success = (message, duration = 3000) => {
    showToast(message, 'success', duration);
};

/**
 * Show error toast
 * @param {string} message - Error message
 * @param {number} duration - Duration in milliseconds
 */
export const error = (message, duration = 4000) => {
    showToast(message, 'error', duration);
};

/**
 * Show warning toast
 * @param {string} message - Warning message
 * @param {number} duration - Duration in milliseconds
 */
export const warning = (message, duration = 3500) => {
    showToast(message, 'warning', duration);
};

/**
 * Show info toast
 * @param {string} message - Info message
 * @param {number} duration - Duration in milliseconds
 */
export const info = (message, duration = 3000) => {
    showToast(message, 'info', duration);
};

export default {
    success,
    error,
    warning,
    info,
};

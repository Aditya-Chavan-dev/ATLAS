import './SuccessAlert.css'

const CircleCheckIcon = ({ size = 16 }) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        <circle cx="12" cy="12" r="10" />
        <path d="m9 12 2 2 4-4" />
    </svg>
)

export default function SuccessAlert({ message, onClose }) {
    if (!message) return null

    return (
        <div className="success-alert">
            <div className="success-alert-content">
                <CircleCheckIcon size={16} />
                <span className="success-alert-message">{message}</span>
            </div>
            {onClose && (
                <button onClick={onClose} className="success-alert-close" aria-label="Close">
                    ×
                </button>
            )}
        </div>
    )
}

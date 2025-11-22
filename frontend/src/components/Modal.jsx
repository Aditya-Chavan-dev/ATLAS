import { useEffect } from 'react';

const Modal = ({ isOpen, onClose, title, children, maxWidth = '500px' }) => {
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }

        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <>
            {/* Backdrop */}
            <div
                onClick={onClose}
                style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0, 0, 0, 0.7)',
                    backdropFilter: 'blur(4px)',
                    zIndex: 1000,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: 'var(--spacing-lg)',
                    animation: 'fadeIn 0.2s ease-out'
                }}
            >
                {/* Modal Content */}
                <div
                    onClick={(e) => e.stopPropagation()}
                    className="glass-card"
                    style={{
                        maxWidth,
                        width: '100%',
                        maxHeight: '90vh',
                        overflowY: 'auto',
                        animation: 'slideIn 0.3s ease-out',
                        position: 'relative'
                    }}
                >
                    {/* Header */}
                    {title && (
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: 'var(--spacing-lg)',
                            paddingBottom: 'var(--spacing-md)',
                            borderBottom: '1px solid var(--glass-border)'
                        }}>
                            <h3 style={{ margin: 0 }}>{title}</h3>
                            <button
                                onClick={onClose}
                                style={{
                                    background: 'transparent',
                                    border: 'none',
                                    color: 'var(--text-muted)',
                                    fontSize: '1.5rem',
                                    cursor: 'pointer',
                                    padding: 'var(--spacing-xs)',
                                    lineHeight: 1,
                                    transition: 'color var(--transition-base)'
                                }}
                                onMouseEnter={(e) => e.target.style.color = 'var(--text-primary)'}
                                onMouseLeave={(e) => e.target.style.color = 'var(--text-muted)'}
                            >
                                ✕
                            </button>
                        </div>
                    )}

                    {/* Body */}
                    <div>
                        {children}
                    </div>
                </div>
            </div>
        </>
    );
};

export default Modal;

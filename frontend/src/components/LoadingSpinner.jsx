const LoadingSpinner = ({ fullPage = false, size = 'md', message = 'Loading...' }) => {
    const sizes = {
        sm: '24px',
        md: '48px',
        lg: '64px'
    };

    const spinnerSize = sizes[size] || sizes.md;

    const spinner = (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 'var(--spacing-md)'
        }}>
            <div
                style={{
                    width: spinnerSize,
                    height: spinnerSize,
                    border: '4px solid var(--glass-border)',
                    borderTop: '4px solid var(--primary)',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                }}
            />
            {message && (
                <p style={{
                    color: 'var(--text-muted)',
                    fontSize: '0.875rem',
                    margin: 0
                }}>
                    {message}
                </p>
            )}

            <style>{`
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );

    if (fullPage) {
        return (
            <div style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'rgba(0, 0, 0, 0.5)',
                backdropFilter: 'blur(4px)',
                zIndex: 9999
            }}>
                {spinner}
            </div>
        );
    }

    return spinner;
};

export default LoadingSpinner;

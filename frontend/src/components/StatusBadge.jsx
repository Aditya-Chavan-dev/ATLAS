const StatusBadge = ({ status, size = 'md' }) => {
    const getStatusColor = (status) => {
        const statusLower = status.toLowerCase();
        switch (statusLower) {
            case 'approved':
            case 'present':
                return {
                    bg: 'rgba(20, 184, 166, 0.1)',
                    border: 'rgba(20, 184, 166, 0.3)',
                    text: '#5eead4'
                };
            case 'pending':
            case 'wfh':
                return {
                    bg: 'rgba(251, 191, 36, 0.1)',
                    border: 'rgba(251, 191, 36, 0.3)',
                    text: '#fcd34d'
                };
            case 'rejected':
            case 'absent':
                return {
                    bg: 'rgba(239, 68, 68, 0.1)',
                    border: 'rgba(239, 68, 68, 0.3)',
                    text: '#fca5a5'
                };
            case 'leave':
                return {
                    bg: 'rgba(99, 102, 241, 0.1)',
                    border: 'rgba(99, 102, 241, 0.3)',
                    text: '#a5b4fc'
                };
            default:
                return {
                    bg: 'rgba(148, 163, 184, 0.1)',
                    border: 'rgba(148, 163, 184, 0.3)',
                    text: '#cbd5e1'
                };
        }
    };

    const colors = getStatusColor(status);
    const padding = size === 'sm' ? '0.25rem 0.5rem' : '0.375rem 0.75rem';
    const fontSize = size === 'sm' ? '0.75rem' : '0.875rem';

    return (
        <span style={{
            display: 'inline-block',
            padding: padding,
            background: colors.bg,
            border: `1px solid ${colors.border}`,
            borderRadius: 'var(--radius-md)',
            color: colors.text,
            fontSize: fontSize,
            fontWeight: 600,
            textTransform: 'capitalize'
        }}>
            {status}
        </span>
    );
};

export default StatusBadge;

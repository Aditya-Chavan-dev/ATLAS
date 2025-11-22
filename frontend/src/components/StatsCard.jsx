const StatsCard = ({ title, value, icon, color = 'var(--primary)', trend }) => {
    return (
        <div className="glass-card p-lg" style={{
            borderLeft: `4px solid ${color}`,
            transition: 'all var(--transition-base)'
        }}>
            <div className="flex justify-between items-center">
                <div>
                    <p style={{
                        fontSize: '0.875rem',
                        color: 'var(--text-muted)',
                        marginBottom: 'var(--spacing-sm)'
                    }}>
                        {title}
                    </p>
                    <h2 style={{
                        fontSize: '2rem',
                        fontWeight: 700,
                        color: 'var(--text-primary)',
                        marginBottom: 0
                    }}>
                        {value}
                    </h2>
                    {trend && (
                        <p style={{
                            fontSize: '0.75rem',
                            color: trend.positive ? 'var(--accent)' : 'var(--secondary)',
                            marginTop: 'var(--spacing-xs)'
                        }}>
                            {trend.text}
                        </p>
                    )}
                </div>
                {icon && (
                    <div style={{
                        fontSize: '2.5rem',
                        color: color,
                        opacity: 0.3
                    }}>
                        {icon}
                    </div>
                )}
            </div>
        </div>
    );
};

export default StatsCard;

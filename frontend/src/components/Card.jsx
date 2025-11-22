const Card = ({ children, className = '', onClick }) => {
    return (
        <div
            className={`glass-card p-lg ${className}`}
            onClick={onClick}
            style={{ cursor: onClick ? 'pointer' : 'default' }}
        >
            {children}
        </div>
    );
};

export default Card;

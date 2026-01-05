import React from 'react';

const Card = ({
    children,
    className = '',
    interactive = false,
    onClick,
    ...props
}) => {
    return (
        <div
            className={`atlas-card ${interactive ? 'interactive cursor-pointer' : ''} ${className}`}
            onClick={interactive ? onClick : undefined}
            {...props}
        >
            {children}
        </div>
    );
};

export default Card;

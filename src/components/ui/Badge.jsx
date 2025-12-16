import React from 'react';

const Badge = ({
    children,
    variant = 'default', // default, primary, success, warning, error
    className = '',
    ...props
}) => {
    return (
        <span
            className={`badge badge-${variant} ${className}`}
            {...props}
        >
            {children}
        </span>
    );
};

export default Badge;

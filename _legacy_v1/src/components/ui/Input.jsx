import React from 'react';

const Input = ({
    label,
    icon: Icon,
    error,
    className = '',
    containerClassName = '',
    id,
    ...props
}) => {
    return (
        <div className={`w-full ${containerClassName}`}>
            {label && (
                <label htmlFor={id} className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 ml-1">
                    {label}
                </label>
            )}
            <div className="input-wrapper">
                {Icon && <Icon className="w-5 h-5 input-icon" />}
                <input
                    id={id}
                    className={`input-field ${Icon ? 'input-with-icon' : ''} ${error ? 'input-error' : ''} ${className}`}
                    {...props}
                />
            </div>
            {error && <p className="mt-1 text-sm text-red-600 ml-1">{error}</p>}
        </div>
    );
};

export default Input;

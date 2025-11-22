const Button = ({
    children,
    variant = 'primary',
    onClick,
    type = 'button',
    disabled = false,
    className = ''
}) => {
    const baseClass = 'btn';
    const variantClass = `btn-${variant}`;

    return (
        <button
            type={type}
            onClick={onClick}
            disabled={disabled}
            className={`${baseClass} ${variantClass} ${className}`}
        >
            {children}
        </button>
    );
};

export default Button;

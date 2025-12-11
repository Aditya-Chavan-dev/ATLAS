
export function AtlasLogo({ className = "", size = 40 }) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 40 40"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
        >
            <path
                d="M20 4L4 32H36L20 4Z"
                className="fill-indigo-600"
                fillOpacity="0.2"
            />
            <path
                d="M20 8L8 28H32L20 8Z"
                className="fill-indigo-600"
            />
            <path
                d="M20 14L14 24H26L20 14Z"
                className="fill-white"
            />
        </svg>
    )
}

export function AtlasTextLogo({ className = "", size = 40 }) {
    return (
        <div className={`flex items-center gap-2 ${className}`}>
            <AtlasLogo size={size} />
            <span className="font-bold text-xl tracking-tight text-slate-900">
                ATLAS
            </span>
        </div>
    )
}

export default AtlasLogo

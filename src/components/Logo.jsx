import React from 'react'
import AtlasLogo from '../assets/AtlasLogo.png'

const Logo = ({ className = '', size = 32, variant = 'navbar' }) => {
    const logoSrc = AtlasLogo

    return (
        <img
            src={logoSrc}
            alt="ATLAS"
            className={className}
            style={{
                width: size,
                height: size,
                objectFit: 'contain',
                borderRadius: '16px'
            }}
        />
    )
}

export default Logo

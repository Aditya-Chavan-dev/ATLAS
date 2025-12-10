import React from 'react'
import RadioCard, { RadioGroup } from './RadioCard'
import { useTheme } from '../context/ThemeContext'
import './ThemeSelector.css'

/**
 * ThemeSelector Component
 * Sophisticated theme switcher using radio cards
 * Replaces the simple sun/moon toggle button
 */
const ThemeSelector = ({ compact = false }) => {
    const { theme, setTheme } = useTheme()

    // Light Mode Icon
    const LightIcon = (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="5"></circle>
            <line x1="12" y1="1" x2="12" y2="3"></line>
            <line x1="12" y1="21" x2="12" y2="23"></line>
            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
            <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
            <line x1="1" y1="12" x2="3" y2="12"></line>
            <line x1="21" y1="12" x2="23" y2="12"></line>
            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
            <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
        </svg>
    )

    // Dark Mode Icon
    const DarkIcon = (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
        </svg>
    )

    if (compact) {
        return (
            <div className="theme-selector-compact">
                <RadioGroup
                    name="theme-compact"
                    value={theme}
                    onChange={setTheme}
                    className="theme-radio-group-horizontal"
                >
                    <RadioCard
                        value="light"
                        label="Light"
                        icon={LightIcon}
                    />

                    <RadioCard
                        value="dark"
                        label="Dark"
                        icon={DarkIcon}
                    />
                </RadioGroup>
            </div>
        )
    }

    return (
        <div className="theme-selector">
            <label className="theme-selector-label">Theme Preference</label>
            <RadioGroup
                name="theme"
                value={theme}
                onChange={setTheme}
            >
                <RadioCard
                    value="light"
                    label="Light Mode"
                    sublabel="Bright & Clear"
                    description="Perfect for well-lit environments and daytime use"
                    icon={LightIcon}
                />

                <RadioCard
                    value="dark"
                    label="Dark Mode"
                    sublabel="Easy on Eyes"
                    description="Reduces eye strain in low-light conditions"
                    icon={DarkIcon}
                />
            </RadioGroup>
        </div>
    )
}

export default ThemeSelector

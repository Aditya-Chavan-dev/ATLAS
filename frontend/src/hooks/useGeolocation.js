import { useState, useEffect } from 'react';

/**
 * Custom hook for geolocation
 * Requests and manages user's geolocation
 */
const useGeolocation = () => {
    const [location, setLocation] = useState(null);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);

    /**
     * Request geolocation permission and get current position
     */
    const getLocation = () => {
        setLoading(true);
        setError(null);

        if (!navigator.geolocation) {
            setError('Geolocation is not supported by your browser');
            setLoading(false);
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                setLocation({
                    lat: position.coords.latitude,
                    lng: position.coords.longitude,
                    accuracy: position.coords.accuracy,
                    timestamp: position.timestamp,
                });
                setLoading(false);
            },
            (err) => {
                let errorMessage = 'Unable to retrieve your location';

                switch (err.code) {
                    case err.PERMISSION_DENIED:
                        errorMessage = 'Location permission denied. Please enable location access in your browser settings.';
                        break;
                    case err.POSITION_UNAVAILABLE:
                        errorMessage = 'Location information is unavailable.';
                        break;
                    case err.TIMEOUT:
                        errorMessage = 'Location request timed out.';
                        break;
                    default:
                        errorMessage = 'An unknown error occurred while getting location.';
                }

                setError(errorMessage);
                setLoading(false);
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0,
            }
        );
    };

    /**
     * Watch position continuously
     */
    const watchLocation = () => {
        if (!navigator.geolocation) {
            setError('Geolocation is not supported by your browser');
            return null;
        }

        const watchId = navigator.geolocation.watchPosition(
            (position) => {
                setLocation({
                    lat: position.coords.latitude,
                    lng: position.coords.longitude,
                    accuracy: position.coords.accuracy,
                    timestamp: position.timestamp,
                });
                setError(null);
            },
            (err) => {
                setError(err.message);
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0,
            }
        );

        return watchId;
    };

    /**
     * Clear watch
     */
    const clearWatch = (watchId) => {
        if (watchId && navigator.geolocation) {
            navigator.geolocation.clearWatch(watchId);
        }
    };

    return {
        location,
        error,
        loading,
        getLocation,
        watchLocation,
        clearWatch,
    };
};

export default useGeolocation;

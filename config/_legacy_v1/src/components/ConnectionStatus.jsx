import React, { useState, useEffect } from 'react';
import { ref, onValue } from 'firebase/database';
import { database } from '@/firebase/config';
import { WifiOff, Activity } from 'lucide-react';

export default function ConnectionStatus() {
    const [connected, setConnected] = useState(true);
    const [lastUpdated, setLastUpdated] = useState(Date.now());

    useEffect(() => {
        const connectedRef = ref(database, '.info/connected');
        const unsubscribe = onValue(connectedRef, (snap) => {
            const isConnected = snap.val() === true;
            setConnected(isConnected);
            if (isConnected) {
                setLastUpdated(Date.now());
            }
        });
        return () => unsubscribe();
    }, []);

    if (connected) return null;

    return (
        <div className="flex items-center gap-2 px-3 py-1.5 bg-rose-500 text-white text-xs font-bold rounded-full shadow-sm animate-pulse">
            <WifiOff size={14} />
            <span>Offline - Reconnecting...</span>
        </div>
    );
}

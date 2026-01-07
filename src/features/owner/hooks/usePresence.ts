// Real-time Traffic / Presence System
import { useEffect, useState } from "react";
import { ref, onValue, onDisconnect, set, serverTimestamp } from "firebase/database";
import { database, auth } from "@/lib/firebase/config"; // Assumes database is RTDB

export function usePresence() {
    const [onlineCount, setOnlineCount] = useState(0);

    // 1. Manage my own connection status
    useEffect(() => {
        if (!auth.currentUser) return;

        const uid = auth.currentUser.uid;
        const userStatusRef = ref(database, `status/${uid}`);
        const connectedRef = ref(database, ".info/connected");

        const unsubscribe = onValue(connectedRef, (snap) => {
            if (snap.val() === true) {
                // I am connected
                const con = onDisconnect(userStatusRef);
                con.set({ state: "offline", last_changed: serverTimestamp() }).then(() => {
                    set(userStatusRef, { state: "online", last_changed: serverTimestamp() });
                });
            }
        });

        return () => unsubscribe();
    }, [auth.currentUser]);

    // 2. Count total online users
    useEffect(() => {
        const allStatusRef = ref(database, "status");
        const unsubscribe = onValue(allStatusRef, (snap) => {
            if (snap.exists()) {
                const data = snap.val();
                // Count users where state == 'online'
                const count = Object.values(data).filter((u: any) => u.state === "online").length;
                setOnlineCount(count);
            } else {
                setOnlineCount(0);
            }
        });

        return () => unsubscribe();
    }, []);

    return onlineCount;
}

// Firebase Analytics & Performance initialization
import { getAnalytics, logEvent } from "firebase/analytics";
import { getPerformance } from "firebase/performance";
import { app } from "./config";

let analytics: any = null;
let performance: any = null;

if (typeof window !== "undefined") {
    // Only init in browser
    analytics = getAnalytics(app);
    performance = getPerformance(app);
}

export const logPageView = (pageName: string) => {
    if (analytics) {
        logEvent(analytics, 'page_view', { page_title: pageName });
    }
};

export { analytics, performance };

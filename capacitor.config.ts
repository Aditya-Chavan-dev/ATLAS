import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
    appId: 'com.atlas.attendance',
    appName: 'ATLAS',
    webDir: 'dist',
    server: {
        androidScheme: 'https'
    },
    plugins: {
        SplashScreen: {
            launchShowDuration: 2000,
            backgroundColor: '#0c1222',
            showSpinner: false,
            androidScaleType: 'CENTER_CROP'
        },
        PushNotifications: {
            presentationOptions: ['badge', 'sound', 'alert']
        }
    },
    android: {
        allowMixedContent: true,
        captureInput: true,
        webContentsDebuggingEnabled: false
    }
};

export default config;

// Offline support for Realtime Database is enabled by default in the SDK 
// or handled via strict mode config, but explicit 'enableIndexedDbPersistence' 
// is a Firestore feature. We keep this file to avoid breaking imports but it does nothing now.
export const enableOfflineSupport = async () => {
    console.log("Realtime Database offline support is auto-managed.");
};

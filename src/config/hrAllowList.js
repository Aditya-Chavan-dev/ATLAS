// HR Allowlist - Authorized HR emails for Export Access
// These users can ONLY access the Export Reports feature

export const HR_ALLOWLIST = [
    'adityagchavan3@gmail.com',
    'santy9shinde@gmail.com'
];

export const isHR = (email) => {
    return HR_ALLOWLIST.includes(email?.toLowerCase());
};

// MD Allowlist - Static list of authorized MD emails
// Add or remove MD emails here (requires code change)

export const MD_ALLOWLIST = [
    'chavan500@gmail.com',
    'adityagchavan310@gmail.com'
];

export const isMD = (email) => {
    return MD_ALLOWLIST.includes(email?.toLowerCase());
};

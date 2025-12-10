// MD Allowlist - Static list of authorized MD emails
// Add or remove MD emails here (requires code change)

export const MD_ALLOWLIST = [
    'adityagchavan310@gmail.com',
    'chavan500@gmail.com' // Your email
    // Add more MD emails below as needed
    // 'manager@company.com',
];

export const isMD = (email) => {
    return MD_ALLOWLIST.includes(email?.toLowerCase());
};

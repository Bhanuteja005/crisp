export const APP_NAME = import.meta.env.VITE_APP_NAME || 'Crisp Interview';

export const APP_DOMAIN = `https://${import.meta.env.VITE_APP_DOMAIN || 'localhost:5173'}`;

export const APP_HOSTNAMES = new Set([
    import.meta.env.VITE_APP_DOMAIN || 'localhost:5173',
    `www.${import.meta.env.VITE_APP_DOMAIN || 'localhost:5173'}`,
]);

export const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || 'Swipe AI';

export const APP_DOMAIN = `https://${process.env.NEXT_PUBLIC_APP_DOMAIN || 'localhost:3000'}`;

export const APP_HOSTNAMES = new Set([
    process.env.NEXT_PUBLIC_APP_DOMAIN || 'localhost:3000',
    `www.${process.env.NEXT_PUBLIC_APP_DOMAIN || 'localhost:3000'}`,
]);

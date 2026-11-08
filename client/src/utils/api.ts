export const API_BASE = import.meta.env.DEV
    ? `http://${import.meta.env.VITE_BACKEND_SERVER_IP ?? window.location.hostname}:${import.meta.env.VITE_BACKEND_SERVER_PORT ?? 3000}`
    : '';
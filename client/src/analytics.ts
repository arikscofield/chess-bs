// Umami analytics. Only loaded when VITE_UMAMI_WEBSITE_ID is set, so local dev stays untracked by default.
const websiteId = import.meta.env.VITE_UMAMI_WEBSITE_ID as string | undefined;
const scriptSrc = (import.meta.env.VITE_UMAMI_SCRIPT_URL as string | undefined) || "https://stats.arok.fun/script.js";

if (websiteId) {
    const script = document.createElement("script");
    script.defer = true;
    script.src = scriptSrc;
    script.dataset.websiteId = websiteId;
    document.head.appendChild(script);
}

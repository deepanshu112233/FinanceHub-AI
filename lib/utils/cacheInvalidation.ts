/**
 * Invalidate AI Insights cache
 * Call this function when transactions are added/updated/deleted
 * to ensure fresh insights are fetched
 */
export function invalidateInsightsCache() {
    localStorage.removeItem("ai_insights_cache");

    // Dispatch custom event to trigger refetch in AIInsightsView
    const event = new CustomEvent("invalidate-insights-cache");
    window.dispatchEvent(event);

    // Also invalidate the Gemini AI report cache
    sessionStorage.removeItem("ai_report_cache");
    const reportEvent = new CustomEvent("invalidate-ai-report-cache");
    window.dispatchEvent(reportEvent);

    // Invalidate page-level caches
    sessionStorage.removeItem("dashboard_data_cache");
    sessionStorage.removeItem("insights_breakdown_cache");

    // Clear personal stats caches (keyed by month)
    try {
        for (let i = 0; i < sessionStorage.length; i++) {
            const key = sessionStorage.key(i);
            if (key && key.startsWith("personal_stats_cache_")) {
                sessionStorage.removeItem(key);
            }
        }
    } catch { /* ignore errors */ }
}

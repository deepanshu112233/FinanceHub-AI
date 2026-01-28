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
}

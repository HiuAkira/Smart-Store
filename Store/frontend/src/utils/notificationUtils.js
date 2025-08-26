// Utility functions for notification management

/**
 * Trigger notification refresh khi có thay đổi trong tủ lạnh
 */
export const triggerNotificationRefresh = () => {
  const event = new CustomEvent("fridgeUpdated");
  window.dispatchEvent(event);
  console.log("Notification refresh triggered");
};

/**
 * Trigger notification refresh với delay (để đảm bảo API đã cập nhật)
 * @param {number} delay - Delay in milliseconds (default: 500ms)
 */
export const triggerNotificationRefreshWithDelay = (delay = 500) => {
  setTimeout(() => {
    triggerNotificationRefresh();
  }, delay);
};

/**
 * Setup notification auto-refresh cho component
 * @param {Function} refreshFn - Function để refresh notification
 * @returns {Function} cleanup function
 */
export const setupNotificationAutoRefresh = (refreshFn) => {
  // Event listener cho manual triggers
  const handleFridgeUpdate = () => {
    console.log("Fridge updated, refreshing notifications...");
    refreshFn();
  };

  // Refresh khi user focus lại tab
  const handleVisibilityChange = () => {
    if (!document.hidden) {
      console.log("Tab focused, refreshing notifications...");
      refreshFn();
    }
  };

  // Add event listeners
  window.addEventListener("fridgeUpdated", handleFridgeUpdate);
  document.addEventListener("visibilitychange", handleVisibilityChange);

  // Cleanup function
  return () => {
    window.removeEventListener("fridgeUpdated", handleFridgeUpdate);
    document.removeEventListener("visibilitychange", handleVisibilityChange);
  };
};

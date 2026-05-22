/**
 * Lucide Icons - Proper initialization
 *
 * This file properly initializes Lucide icons that were loaded from CDN.
 * It handles the case where storage access is blocked by browser
 * tracking prevention settings.
 *
 * Key fixes:
 * 1. Uses pinned version (0.263.0) instead of @latest for stability
 * 2. Handles storage blocking gracefully (warning only, doesn't break)
 * 3. Calls createIcons() only when Lucide is properly loaded
 * 4. Re-initializes icons when dynamic content is added
 */

(function () {
  "use strict";

  // Store reference to original Lucide (loaded from CDN)
  var originalLucide = window.lucide;

  // Function to initialize Lucide icons
  function initLucide() {
    // Check if Lucide library is available
    if (!window.lucide) {
      console.warn("Lucide library not loaded from CDN");
      return;
    }

    // Create icons for all elements with data-lucide attribute
    try {
      if (typeof window.lucide.createIcons === "function") {
        window.lucide.createIcons();
        console.log("Lucide icons initialized successfully");
      }
    } catch (e) {
      console.warn("Lucide createIcons error:", e.message);
    }
  }

  // Handle storage blocking - this is a browser privacy warning, not an error
  // The icons will still work, just without caching
  function handleStorageBlocking() {
    try {
      localStorage.setItem("__test__", "test");
      localStorage.removeItem("__test__");
    } catch (e) {
      console.warn(
        "Storage access blocked by browser tracking prevention. " +
          "This is a privacy feature that may affect caching but does not break icon rendering.",
      );
    }
  }

  // Initialize when DOM is ready
  function onDOMReady() {
    handleStorageBlocking();
    initLucide();

    // Re-initialize icons after any dynamic content is added
    // This handles cases where icons are added via JavaScript later
    if (typeof MutationObserver !== "undefined") {
      var observer = new MutationObserver(function (mutations) {
        var shouldInit = false;
        for (var i = 0; i < mutations.length; i++) {
          if (mutations[i].addedNodes.length > 0) {
            shouldInit = true;
            break;
          }
        }
        if (shouldInit) {
          initLucide();
        }
      });

      if (document.body) {
        observer.observe(document.body, { childList: true, subtree: true });
      }
    }
  }

  // Start initialization
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", onDOMReady);
  } else {
    // DOM already loaded, but ensure we wait for scripts to complete
    if (document.readyState === "complete") {
      setTimeout(onDOMReady, 0);
    } else {
      window.addEventListener("load", onDOMReady);
    }
  }

  // Expose init function for manual re-initialization if needed
  window.lucideReinit = initLucide;
})();

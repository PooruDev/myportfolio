/**
 * Element SDK - Mock implementation for portfolio
 * This provides the initialization and configuration management
 */

window.elementSdk = {
  config: {},
  callbacks: {},

  init: function (options) {
    this.config = options.defaultConfig || {};
    this.callbacks.onConfigChange = options.onConfigChange;
    this.callbacks.mapToCapabilities = options.mapToCapabilities;
    this.callbacks.mapToEditPanelValues = options.mapToEditPanelValues;

    console.log("Element SDK initialized with config:", this.config);

    // Apply initial config
    if (this.callbacks.onConfigChange) {
      this.callbacks.onConfigChange(this.config);
    }
  },

  setConfig: function (newConfig) {
    this.config = { ...this.config, ...newConfig };
    console.log("Config updated:", this.config);

    if (this.callbacks.onConfigChange) {
      this.callbacks.onConfigChange(this.config);
    }
  },

  getConfig: function () {
    return this.config;
  },
};

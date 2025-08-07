const defaultConfig = {
  cardsPerPage: 10,
  currentPeriod: "5d"
};

function loadConfig() {
  return window.configAPI?.loadConfig?.() || defaultConfig;
}

function saveConfig(config) {
  window.configAPI?.saveConfig?.(config);
}

function loadNotationConfig() {
  return window.configAPI?.loadNotationConfig?.() || { usine: {}, perso: {} };
}

function saveNotationConfig(config) {
  window.configAPI?.saveNotationConfig?.(config);
}

function resetToFactoryConfig() {
  window.configAPI?.resetToFactoryConfig?.();
}

export {
  loadConfig, saveConfig,
  loadNotationConfig, saveNotationConfig,
  defaultConfig, resetToFactoryConfig
};

const fs = require("fs");
const path = require("path");
const os = require("os");
const { contextBridge } = require("electron");

console.log("🚀 preload.js chargé — configAPI exposé !");

// === Partie CONFIG API ===

// 💡 On utilise le dossier personnel de l'utilisateur pour la config
const userDataPath = path.join(os.homedir(), ".maqh_config");
const configDir = path.join(userDataPath, "config");

const usineConfigDir = path.join(__dirname, "..", "config");
const usineConfigFile = path.join(usineConfigDir, "config.json");
const usineNotationFile = path.join(usineConfigDir, "configNotation.json");
const configFile = path.join(configDir, "config.json");
const notationConfigFile = path.join(configDir, "configNotation.json");

const defaultConfig = {
  cardsPerPage: 10,
  currentPeriod: "5d"
};

function copyIfMissing(from, to, fallback = '{}') {
  if (!fs.existsSync(configDir)) fs.mkdirSync(configDir, { recursive: true });
  if (!fs.existsSync(to)) {
    if (fs.existsSync(from)) {
      fs.copyFileSync(from, to);
    } else {
      fs.writeFileSync(to, fallback);
    }
  }
}

contextBridge.exposeInMainWorld("configAPI", {
  loadConfig: () => {
    copyIfMissing(usineConfigFile, configFile, JSON.stringify(defaultConfig));
    try {
      return JSON.parse(fs.readFileSync(configFile, "utf-8"));
    } catch (e) {
      console.error("Erreur lecture config.json:", e);
      return defaultConfig;
    }
  },

  saveConfig: (config) => {
    try {
      fs.writeFileSync(configFile, JSON.stringify(config, null, 2), "utf-8");
    } catch (e) {
      console.error("Erreur écriture config.json:", e);
    }
  },

  loadNotationConfig: () => {
    copyIfMissing(usineNotationFile, notationConfigFile, JSON.stringify({ usine: {}, perso: {} }));
    try {
      return JSON.parse(fs.readFileSync(notationConfigFile, "utf-8"));
    } catch (e) {
      console.error("Erreur lecture configNotation.json:", e);
      return { usine: {}, perso: {} };
    }
  },

  saveNotationConfig: (config) => {
    try {
      fs.writeFileSync(notationConfigFile, JSON.stringify(config, null, 2), "utf-8");
    } catch (e) {
      console.error("Erreur écriture configNotation.json:", e);
    }
  },

  resetToFactoryConfig: () => {
    if (fs.existsSync(usineConfigFile)) fs.copyFileSync(usineConfigFile, configFile);
    if (fs.existsSync(usineNotationFile)) fs.copyFileSync(usineNotationFile, notationConfigFile);
  }
});

console.log("✅ configAPI exposé !");

// === Partie FILE STORAGE API ===

// 📁 Écriture des données dans le projet directement
const projectRoot = path.join(__dirname, ".."); // => /Users/andrebertea/Projects/maqh_V1
const dataRoot = path.join(projectRoot, "data", "BDD", "euronext");

contextBridge.exposeInMainWorld("fileStorage", {
  saveJSON: (name, data) => {
    if (!fs.existsSync(dataRoot)) {
      fs.mkdirSync(dataRoot, { recursive: true });
    }
    const filePath = path.join(dataRoot, `${name}.json`);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
  }
});

console.log("✅ fileStorage exposé !");

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
const usineFirebaseFile = path.join(usineConfigDir, "firebase.example.json");
const configFile = path.join(configDir, "config.json");
const notationConfigFile = path.join(configDir, "configNotation.json");
const firebaseConfigFile = path.join(configDir, "firebase.json");

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

// 📁 Stockage de données dans le dossier utilisateur (userData) pour la prod
function sanitizeFileName(name) {
  return String(name)
    .replace(/[/\\?%*:|"<>]/g, "_")
    .replace(/\s+/g, " ")
    .trim();
}

const userDataRoot = path.join(os.homedir(), ".maqh_data");
const companiesRoot = path.join(userDataRoot, "companies", "euronext");

contextBridge.exposeInMainWorld("fileStorage", {
  saveJSON: (name, data) => {
    const safe = sanitizeFileName(name);
    if (!fs.existsSync(companiesRoot)) {
      fs.mkdirSync(companiesRoot, { recursive: true });
    }
    const filePath = path.join(companiesRoot, `${safe}.json`);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
  },
  readCompanyJSON: (name) => {
    try {
      const safe = sanitizeFileName(name);
      const filePath = path.join(companiesRoot, `${safe}.json`);
      if (!fs.existsSync(filePath)) return null;
      return JSON.parse(fs.readFileSync(filePath, "utf-8"));
    } catch (e) {
      console.error("readCompanyJSON error:", e);
      return null;
    }
  },
  getCompaniesFolder: () => companiesRoot,
});

console.log("✅ fileStorage exposé !");

// === Partie Firebase CONFIG ===
// Exposer une API pour lire la config Firebase depuis ~/.maqh_config/config/firebase.json
// Si absente, on copie l'exemple depuis le dossier config de l'app
contextBridge.exposeInMainWorld("firebaseConfigAPI", {
  getFirebaseConfig: () => {
    // Fichier d'exemple → fichier utilisateur si manquant
    copyIfMissing(usineFirebaseFile, firebaseConfigFile, JSON.stringify({
      apiKey: "",
      authDomain: "",
      projectId: "",
      appId: ""
    }));
    try {
      return JSON.parse(fs.readFileSync(firebaseConfigFile, "utf-8"));
    } catch (e) {
      console.error("Erreur lecture firebase.json:", e);
      return null;
    }
  },
  saveFirebaseConfig: (cfg) => {
    try {
      if (!fs.existsSync(configDir)) fs.mkdirSync(configDir, { recursive: true });
      fs.writeFileSync(firebaseConfigFile, JSON.stringify(cfg, null, 2), "utf-8");
    } catch (e) {
      console.error("Erreur écriture firebase.json:", e);
    }
  }
});
console.log("✅ firebaseConfigAPI exposé !");

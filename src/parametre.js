import { loadConfig, saveConfig } from "./config.js";

function showToastParametre(message) {
  const toast = document.createElement('div');
  toast.innerText = message;

  Object.assign(toast.style, {
    position: 'fixed',
    bottom: '50px',
    right: '50px',
    backgroundColor: '#FFD700',
    color: 'black',
    fontWeight: 'bold',
    padding: '12px 20px',
    borderRadius: '8px',
    fontSize: '18px',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
    zIndex: '100001',
    transition: 'transform 0.5s ease, opacity 0.5s ease',
    transform: 'translateX(0)',
    opacity: '1',
    pointerEvents: 'none'
  });

  document.body.appendChild(toast);

  setTimeout(() => {
    toast.style.transform = 'translateX(150%)';
    toast.style.opacity = '0';
    setTimeout(() => {
      if (toast.parentNode) toast.remove();
    }, 500);
  }, 4000);
}

export function openSettingsModal() {
  const modal = document.createElement("div");
  modal.id = "settingsModal";
  Object.assign(modal.style, {
    position: "fixed",
    top: "0",
    left: "0",
    width: "100%",
    height: "100%",
    backgroundColor: "rgba(0,0,0,0.5)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: "10000"
  });

  const modalContent = document.createElement("div");
  Object.assign(modalContent.style, {
    width: "80%",
    maxWidth: "600px",
    backgroundColor: "#fff",
    padding: "20px",
    borderRadius: "8px",
    position: "relative",
    color: "#000"
  });

  const closeButton = document.createElement("button");
  closeButton.innerText = "X";
  Object.assign(closeButton.style, {
    position: "absolute",
    top: "10px",
    right: "10px",
    border: "none",
    background: "transparent",
    fontSize: "20px",
    cursor: "pointer"
  });
  closeButton.addEventListener("click", () => {
    document.body.removeChild(modal);
  });
  modalContent.appendChild(closeButton);

  const title = document.createElement("h2");
  title.innerText = "Paramètres";
  modalContent.appendChild(title);

  const config = loadConfig();

  const cardsLabel = document.createElement("label");
  cardsLabel.innerText = "Nombre de cartes par page:";
  cardsLabel.style.display = "block";
  cardsLabel.style.marginTop = "20px";
  modalContent.appendChild(cardsLabel);

  const cardsSlider = document.createElement("input");
  cardsSlider.type = "range";
  cardsSlider.min = "6";
  cardsSlider.max = "30";
  cardsSlider.value = config.cardsPerPage;
  cardsSlider.style.width = "100%";
  modalContent.appendChild(cardsSlider);

  const cardsValue = document.createElement("span");
  cardsValue.innerText = config.cardsPerPage;
  cardsValue.style.marginLeft = "10px";
  modalContent.appendChild(cardsValue);

  cardsSlider.addEventListener("input", () => {
    cardsValue.innerText = cardsSlider.value;
  });

  const periodLabel = document.createElement("label");
  periodLabel.innerText = "Période sélectionnée:";
  periodLabel.style.display = "block";
  periodLabel.style.marginTop = "20px";
  modalContent.appendChild(periodLabel);

  const periodSelect = document.createElement("select");
  periodSelect.style.width = "100%";
  ["5d", "1mo", "3mo", "6mo", "1y", "5y", "max"].forEach(opt => {
    const option = document.createElement("option");
    option.value = opt;
    option.innerText = opt;
    if (opt === config.currentPeriod) option.selected = true;
    periodSelect.appendChild(option);
  });
  modalContent.appendChild(periodSelect);

  const saveButton = document.createElement("button");
  saveButton.innerText = "Sauvegarder";
  Object.assign(saveButton.style, {
    marginTop: "30px",
    padding: "10px 20px",
    cursor: "pointer",
    display: "block",
    width: "100%",
    backgroundColor: "#4CAF50",
    color: "#fff",
    border: "none",
    borderRadius: "5px"
  });

  const saveAndClose = () => {
    config.cardsPerPage = parseInt(cardsSlider.value, 10);
    config.currentPeriod = periodSelect.value;
    saveConfig(config);
    document.body.removeChild(modal);
    showToastParametre("Paramètres sauvegardés avec succès ✅");

    const event = new CustomEvent("configUpdated", { detail: config });
    document.dispatchEvent(event);
  };

  saveButton.addEventListener("click", saveAndClose);
  modalContent.appendChild(saveButton);

  modal.appendChild(modalContent);
  document.body.appendChild(modal);

  // 🎹 Gestion des raccourcis clavier
  const keyListener = (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") {
      e.preventDefault();
      saveAndClose();
    } else if (e.key === "Escape") {
      document.body.removeChild(modal);
    }
  };

  document.addEventListener("keydown", keyListener);

  // Nettoyage du listener si modal retiré
  const observer = new MutationObserver(() => {
    if (!document.body.contains(modal)) {
      document.removeEventListener("keydown", keyListener);
      observer.disconnect();
    }
  });
  observer.observe(document.body, { childList: true });
}

import { loadNotationConfig, saveNotationConfig } from '../../config.js';

export function openNotationSettingsModal() {
  const groupedOrder = [
    { label: "Valorisation de l'action", items: ["condition10", "condition11"] },
    { label: "Part d'investissement", items: ["condition14", "condition15", "condition16"] },
    { label: "Poids de l’entreprise", items: ["condition12", "condition8", "condition9"] },
    { label: "Dividende", items: ["condition13", "condition1", "condition2", "condition3", "condition4"] },
    { label: "Santé financière", items: ["condition5", "condition6", "condition7"] }
  ];

  const CONDITIONS_LABELS = {
    condition1: 'Dividende versé depuis plus de 5 ans',
    condition2: 'Croissance du dividende sur 5 ans (%)',
    condition3: 'Rendement du dividende (%)',
    condition4: 'Capitalisation minimale (Mds)',
    condition5: 'Dettes / EBE max',
    condition6: 'Dettes / FCF max',
    condition7: 'Ratio FCF en hausse sur 5 ans',
    condition8: 'Résultat net x5 ans',
    condition9: 'Croissance CA sur 5 ans (%)',
    condition10: 'Écart PER (%)',
    condition11: 'PEG maximal',
    condition12: 'CA stable/croissant sur 5 ans',
    condition13: 'Payout ratio (%)',
    condition14: 'ROA (%)',
    condition15: 'ROE (%)',
    condition16: 'Réduction du nombre d’actions (x)'
  };

  const notationConfig = loadNotationConfig();
  const currentValues = { ...notationConfig.perso };

  const modal = document.createElement('div');
  modal.id = 'notation-settings-modal';
  Object.assign(modal.style, {
    position: 'fixed',
    top: '0',
    left: '0',
    width: '100vw',
    height: '100vh',
    backgroundColor: 'rgba(0,0,0,0.6)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: '99999'
  });

  const modalContent = document.createElement('div');
  Object.assign(modalContent.style, {
    width: '90%',
    maxWidth: '800px',
    maxHeight: '90%',
    overflowY: 'auto',
    backgroundColor: '#fff',
    padding: '20px',
    borderRadius: '10px',
    position: 'relative',
    color: '#000',
    boxShadow: '0 0 20px rgba(0,0,0,0.2)'
  });

  // 🔺 Bouton de fermeture (haut droite)
  const closeBtn = document.createElement('button');
  closeBtn.innerText = 'ESC';
  Object.assign(closeBtn.style, {
    position: 'absolute',
    top: '20px',
    right: '20px',
    backgroundColor: 'red',
    color: '#fff',
    border: '1px solid red',
    padding: '4px 10px',
    borderRadius: '5px',
    fontWeight: 'bold',
    cursor: 'pointer'
  });
  closeBtn.onclick = closeModal;
  modalContent.appendChild(closeBtn);

  const title = document.createElement('h2');
  title.textContent = 'Paramètres de notation personnalisée';
  modalContent.appendChild(title);

  // 🧩 Génération des groupes et champs
  groupedOrder.forEach(group => {
    const groupTitle = document.createElement('h3');
    groupTitle.textContent = group.label;
    groupTitle.style.marginTop = "20px";
    modalContent.appendChild(groupTitle);

    group.items.forEach(conditionKey => {
      if (!CONDITIONS_LABELS[conditionKey]) return;

      const row = document.createElement('div');
      row.style.display = 'flex';
      row.style.alignItems = 'center';
      row.style.marginBottom = '12px';
      row.style.justifyContent = 'space-between';

      const label = document.createElement('label');
      label.textContent = CONDITIONS_LABELS[conditionKey];
      label.style.flex = '1';
      label.style.marginRight = '10px';

      const input = document.createElement('input');
      input.type = 'number';
      input.step = 'any';
      input.value = currentValues[conditionKey] ?? '';
      input.style.width = '100px';
      input.dataset.conditionKey = conditionKey;

      row.appendChild(label);
      row.appendChild(input);
      modalContent.appendChild(row);
    });
  });

  // 🔘 Boutons
  const buttonContainer = document.createElement('div');
  buttonContainer.style.marginTop = '30px';
  buttonContainer.style.display = 'flex';
  buttonContainer.style.justifyContent = 'space-between';

  const resetBtn = document.createElement('button');
  resetBtn.innerText = 'Réinitialiser Valeurs par défaut';
  resetBtn.style.background = '#f44336';
  resetBtn.style.color = '#fff';
  resetBtn.style.border = 'none';
  resetBtn.style.padding = '10px 20px';
  resetBtn.style.cursor = 'pointer';
  resetBtn.style.borderRadius =  '5px',
  resetBtn.onclick = () => {
    notationConfig.perso = { ...notationConfig.usine };
    saveNotationConfig(notationConfig);
    document.body.removeChild(modal);
    //alert('Notation d\'usine remise à zéro ✅');
    showToast('Notation d\'usine remise à zéro ✅');
    loadUserNotationConfig();
  };

  const saveBtn = document.createElement('button');
  saveBtn.textContent = 'Sauvegarder';
  saveBtn.style.background = '#4CAF50';
  saveBtn.style.color = '#fff';
  saveBtn.style.border = 'none';
  saveBtn.style.padding = '10px 20px';
  saveBtn.style.cursor = 'pointer';
  saveBtn.style.borderRadius =  '5px',
  saveBtn.onclick = handleSave;
  
  
  function handleSave() {
    const inputs = modalContent.querySelectorAll('input[type="number"]');
    inputs.forEach(input => {
      const key = input.dataset.conditionKey;
      const value = parseFloat(input.value);
      if (!isNaN(value)) {
        notationConfig.perso[key] = value;
      }
    });
  
    saveNotationConfig(notationConfig);
    document.body.removeChild(modal);
    showToast('Notation mise à jour ✅');
  
  // Dans notation_setting.js
  const bc = new BroadcastChannel("user-notation-channel");
  bc.postMessage({ type: "notationConfigChanged" });


  setTimeout(() => {
    if (window.__lastOpenedCard?.Name) {
      bc.postMessage({
        type: "userNotationUpdated",
        cardName: window.__lastOpenedCard.Name
      });
      console.log("📡 BroadcastChannel: message envoyé :", window.__lastOpenedCard.Name);
    }
  }, 100);

  }
  
  resetBtn.onclick = () => {
    notationConfig.perso = { ...notationConfig.usine };
    saveNotationConfig(notationConfig);
    document.body.removeChild(modal);
    showToast('Notation d\'usine remise à zéro ✅');
  
    const bc = new BroadcastChannel("user-notation-channel");
    bc.postMessage({ type: "notationConfigChanged" });
    setTimeout(() => {
      if (window.__lastOpenedCard?.Name) {
        bc.postMessage({
          type: "userNotationUpdated",
          cardName: window.__lastOpenedCard.Name
        });
        console.log("📡 BroadcastChannel: message envoyé :", window.__lastOpenedCard.Name);
      }
    }, 100);
  };
  
  
  function closeModal() {
    if (modal && modal.parentNode) {
      modal.parentNode.removeChild(modal);
    }
    document.removeEventListener("keydown", keyboardHandler);
  }
  

  // 🎹 Raccourcis clavier
  function keyboardHandler(e) {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") {
      e.preventDefault();
      handleSave();
    } else if (e.key === "Escape") {
      e.preventDefault();
      closeModal(); // Ferme le paramétrage (le modal principal reste)
    }
  }

  document.addEventListener("keydown", keyboardHandler);

  buttonContainer.appendChild(resetBtn);
  buttonContainer.appendChild(saveBtn);
  modalContent.appendChild(buttonContainer);
  modal.appendChild(modalContent);
  document.body.appendChild(modal);

  function showToast(message) {
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
      boxShadow: '0 4px 12px rgba(132, 123, 27, 0.2)',
      zIndex: '100000',
      transition: 'transform 4s ease, opacity 0.5s ease',
      transform: 'translateX(0)',
      opacity: '1',
      pointerEvents: 'none' 
    });
  
    document.body.appendChild(toast);
  
    // ⏳ Délai d'affichage
    setTimeout(() => {
      toast.style.transform = 'translateX(150%)';
      toast.style.opacity = '0';
      setTimeout(() => {
        if (toast.parentNode) toast.parentNode.removeChild(toast);
      }, 4000); // durée de l'animation
    }, 4000);
  }
  
}

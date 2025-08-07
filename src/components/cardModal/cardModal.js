export async function openCardModal(card) {
  try {
    const fileName = encodeURIComponent(card.Name.trim()) + ".json";
    const url = `data/companies/euronext/${fileName}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error("Fichier introuvable");

    const data = await response.json();
    window.__lastOpenedCard = card;

    const overlay = document.createElement("div");
    overlay.id = "card-detail-overlay";
    Object.assign(overlay.style, {
      position: "fixed",
      top: "0",
      left: "0",
      width: "100%",
      height: "100%",
      backgroundColor: "rgba(0, 0, 0, 0.5)",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      zIndex: "10000",
      overflow: "hidden"
    });

    const modalContent = document.createElement("div");
    modalContent.id = "card-detail-container";
    Object.assign(modalContent.style, {
      width: "87%",
      maxWidth: "1700px",
      height: "80%",
      padding: "20px",
      borderRadius: "8px",
      position: "relative",
      overflow: "hidden",
      backgroundColor: document.body.classList.contains("light-mode") ? "#fff" : "#1b1b1b",
      color: document.body.classList.contains("light-mode") ? "#121212" : "#ffffff",
      transform: "scale(0.8)",
      opacity: "0",
      transition: "transform 0.3s ease-out, opacity 0.3s ease-out",
      display: "flex",
      flexDirection: "column"
    });

    const closeButton = document.createElement("button");
    closeButton.id = "card-detail-close-button";
    closeButton.innerText = "X";
    Object.assign(closeButton.style, {
      position: "absolute",
      top: "10px",
      right: "10px",
      border: "none",
      fontSize: "30px",
      cursor: "pointer",
    });
    closeButton.addEventListener("click", () => {
      modalContent.style.transform = "scale(0.4)";
      modalContent.style.opacity = "0";
      setTimeout(() => document.body.removeChild(overlay), 300);
    });

    // 🔍 Barre de recherche (HTML injecté)
    const searchContainer = document.createElement("div");
    searchContainer.id = "modal-search-container";
    searchContainer.innerHTML = `
      <button id="search-toggle" class="search-toggle-btn" title="Rechercher">
        <svg class="search_icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" alt="search icon">
          <path d="M46.87989 46.599a4.498 4.498 0 0 1-6.363 0l-7.941-7.941C29.028 40.749 25.167 42 21 42 9.402 42 0 32.598 0 21S9.402 0 21 0s21 9.402 21 21c0 4.167-1.251 8.028-3.342 11.295l7.941 7.941a4.498 4.498 0 0 1 0 6.363zM21 6C12.717 6 6 12.714 6 21s6.717 15 15 15c8.286 0 15-6.714 15-15S29.286 6 21 6z"></path>
        </svg>
      </button>
      <div id="search-bar" class="inputBox_container hidden">
        <input class="inputBox" id="inputBox" type="text" placeholder="Search ">
        <span id="result-counter">0/0</span>
        <button id="prev-result">⬆</button>
        <button id="next-result">⬇</button>
      </div>
    `;
    

    // Positionnement dans le modal (à côté de la croix)
    searchContainer.style.position = "absolute";
    searchContainer.style.top = "10px";
    searchContainer.style.right = "50px"; // 🡸 espace entre croix et recherche
    modalContent.appendChild(searchContainer);


    const tabs = document.createElement("div");
    tabs.className = "card-detail-tabs";

    const tabContentWrapper = document.createElement("div");
    tabContentWrapper.id = "tab-content-wrapper";
    Object.assign(tabContentWrapper.style, {
      flex: "1",
      overflowY: "auto",
      scrollBehavior: "smooth",
      marginTop: "10px",
      paddingRight: "10px",
      paddingLeft: "5px"
    });

    // 🔁 Config centralisée ici on rajoute chaque nouvel onglet associé au contenu qu'on voudra affiché 
    const tabsConfig = [
      { id: "cours", label: "Cours" },
      { id: "notation", label: "Notation", module: "./cardModalNotation.js" },
      { id: "detail", label: "Détail", module: "./cardModalDetail.js" },
      { id: "valeurintrinseque", label: "Valeur intrinsèque" }
    ];

    const sections = {};

    for (const tab of tabsConfig) {
      const section = document.createElement("section");
      section.id = `section-${tab.id}`;
      section.style.marginBottom = "50px";

      const title = document.createElement("h2");
      title.textContent = tab.label;
      section.appendChild(title);

      const hr = document.createElement("hr");
      Object.assign(hr.style, {
        border: "none",
        borderBottom: "1px solid #444",
        margin: "10px 0"
      });
      section.appendChild(hr);

      // Ajout du contenu dans le wrapper
      tabContentWrapper.appendChild(section);
      sections[tab.id] = section;
    }

    // Charger dynamiquement le contenu du module si défini
    for (const tab of tabsConfig) {
      if (tab.module) {
        const module = await import(tab.module);
        const renderFunc = module[`render${capitalize(tab.id)}Tab`];
        if (renderFunc) {
          renderFunc(data, sections[tab.id]);
        }
      }
    }

    // Génération dynamique des boutons
    tabsConfig.forEach(tab => {
      const button = document.createElement("button");
      button.className = "tab-btn";
      button.innerText = tab.label;
      button.dataset.target = `section-${tab.id}`;

      button.addEventListener("click", () => {
        const target = modalContent.querySelector(`#section-${tab.id}`);
        if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });

        tabs.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
        button.classList.add("active");
      });

      tabs.appendChild(button);
    });

    modalContent.appendChild(closeButton);
    modalContent.appendChild(tabs);
    modalContent.appendChild(tabContentWrapper);
    overlay.appendChild(modalContent);
    document.body.appendChild(overlay);
    modalContent.appendChild(searchContainer);
    modalContent.appendChild(closeButton);


    // fermeture du modal avec keys 'esc'
    function handleKeyDown(e) {
      if (e.key === "Escape") {
        // ❌ Ne pas fermer si le modal de notation est encore ouvert
        const isSettingsOpen = document.getElementById("notation-settings-modal");
        if (isSettingsOpen) {
          return; // ignore Escape tant que la config est ouverte
        }
    
        // ✅ Fermer normalement
        modalContent.style.transform = "scale(0.2)";
        modalContent.style.opacity = "0";
        setTimeout(() => {
          document.body.removeChild(overlay);
          document.removeEventListener("keydown", handleKeyDown);
        }, 300);
      }
    }
    
    document.addEventListener("keydown", handleKeyDown);

    // ecoute du clavier pour la barre de recherche du modal 
    const inputBox = searchContainer.querySelector("#inputBox");
    const counter = searchContainer.querySelector("#result-counter");
    const prevBtn = searchContainer.querySelector("#prev-result");
    const nextBtn = searchContainer.querySelector("#next-result");
    const searchBar = searchContainer.querySelector("#search-bar");
    const toggleBtn = searchContainer.querySelector("#search-toggle");
    document.addEventListener("keydown", (e) => {
      // Si la touche Espace est pressée, que le focus n'est pas dans un champ texte
      if (e.code === "Space" && document.activeElement.tagName !== "INPUT") {
        e.preventDefault(); // Évite les scrolls
        toggleBtn.click(); // Simule un clic sur le bouton loupe
      }
    });
    inputBox.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        e.stopPropagation(); // Empêche la fermeture du modal
        inputBox.value = "";
        highlightMatches(""); // Nettoie les surlignements
        searchBar.classList.add("hidden"); // Cache la barre
      }
    
      if (e.key === "ArrowUp") {
        e.preventDefault(); // empêche le curseur de remonter dans l’input
        goToHighlight(-1);
      }
    
      if (e.key === "ArrowDown") {
        e.preventDefault(); // empêche le scroll dans l’input
        goToHighlight(1);
      }
    });
  
    
    

    toggleBtn.addEventListener("click", () => {
      searchBar.classList.toggle("hidden");
      if (!searchBar.classList.contains("hidden")) {
        setTimeout(() => inputBox.focus(), 50); // focus dans l'input
      }
    });
    let highlights = [];
    let currentIndex = 0;
    
    function clearHighlights() {
      highlights.forEach(mark => {
        const parent = mark.parentNode;
        parent.replaceChild(document.createTextNode(mark.textContent), mark);
        parent.normalize(); // merge adjacent text nodes
      });
      highlights = [];
      currentIndex = 0;
    }


    
    function highlightMatches(query) {
      clearHighlights();
      if (!query) {
        counter.textContent = "0/0";
        return;
      }
    
      const regex = new RegExp(`(${query})`, "gi");
      const targetNodes = tabContentWrapper.querySelectorAll("*:not(script):not(style)");
    
      highlights = [];
    
      targetNodes.forEach(node => {
        for (const child of [...node.childNodes]) {
          if (child.nodeType === Node.TEXT_NODE && child.textContent.match(regex)) {
            const frag = document.createDocumentFragment();
            const parts = child.textContent.split(regex);
    
            parts.forEach(part => {
              if (regex.test(part)) {
                const mark = document.createElement("mark");
                mark.className = "highlight";
                mark.textContent = part;
                highlights.push(mark);
                frag.appendChild(mark);
              } else {
                frag.appendChild(document.createTextNode(part));
              }
            });
    
            node.replaceChild(frag, child);
          }
        }
      });
    
      if (highlights.length > 0) {
        currentIndex = 0;
        highlights[0].classList.add("current");
        highlights[0].scrollIntoView({ behavior: "smooth", block: "center" });
        counter.textContent = `1 / ${highlights.length}`;
      } else {
        counter.textContent = "0/0";
      }
    }
    
    function goToHighlight(direction) {
      if (highlights.length === 0) return;
      highlights[currentIndex].classList.remove("current");
      currentIndex = (currentIndex + direction + highlights.length) % highlights.length;
      highlights[currentIndex].classList.add("current");
      highlights[currentIndex].scrollIntoView({ behavior: "smooth", block: "center" });
      counter.textContent = `${currentIndex + 1} / ${highlights.length}`;
    }
    
    inputBox.addEventListener("input", () => {
      highlightMatches(inputBox.value);
    });
    
    prevBtn.addEventListener("click", () => goToHighlight(-1));
    nextBtn.addEventListener("click", () => goToHighlight(1));
    
    //


    setTimeout(() => {
      modalContent.style.transform = "scale(1)";
      modalContent.style.opacity = "1";
    }, 50);
  } catch (err) {
    console.error("Erreur dans cardModal:", err);
    alert("Impossible de charger les détails.");
  }
}



// Petit helper
function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

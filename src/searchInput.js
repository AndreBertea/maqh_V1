// ancien fichier de recherche a supprimer -> conservation pour debugger
// 📦 Modules dynamiques du dossier ./components/search/*.js
async function getAvailableModules() {
  const modules = [
    {
      label: "secteur",
      loader: () => import("./search/secteur.js")
    },
    {
      label: "note",
      loader: () => import("./search/commands/note.js")
    },
    // Exemple : { label: "note", loader: () => import("./components/search/note.js") }

  ];

  const loaded = await Promise.all(modules.map(async ({ label, loader }) => {
    const mod = await loader();
    return {
      label,
      activate: mod.activate
    };
  }));

  return loaded.filter(m => m.label && m.activate);
}

export function setupGlobalSearch() {
  const input = document.getElementById("globalSearchInput");
  const container = document.querySelector(".search-container-global"); // 🔄 corriger ici

  if (!input || !container) {
    console.warn("🔍 Aucun champ de recherche ou container trouvé.");
    return;
  }

  // ✍️ Saisie utilisateur
  input.addEventListener("input", async () => {
    const value = input.value.trim().toLowerCase();

    // ✅ Suggestions de modules si "/"
    if (value.startsWith("/")) {
      const modules = await getAvailableModules();
      showModuleSuggestions(modules, value.slice(1), container, input);
      return;
    }

    // ✅ Sinon recherche classique
    hideModuleSuggestions();
    applySearchToHome(value);
    applySearchToEvaluation(value);
  });

  // ⌨️ ESC pour clear + blur, TAB pour auto-complétion
  input.addEventListener("keydown", (e) => {
    // Cmd/Ctrl + K
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
      e.preventDefault();
      input.focus();
    }

    // Escape
    if (e.key === "Escape" && document.activeElement === input) {
      input.value = "";
      input.blur();
      hideModuleSuggestions();
      applySearchToHome("");
      applySearchToEvaluation("");
    }

    // Tab = compléter avec première suggestion
    if (e.key === "Tab") {
      const firstItem = document.querySelector(".suggestion-item");
      if (firstItem) {
        e.preventDefault();
        input.value = "/" + firstItem.dataset.command + " ";
        firstItem.click(); // active le module
        hideModuleSuggestions();
      }
    }
  });
}

// 🔍 Recherche dans Home
function applySearchToHome(query) {
  if (typeof window.handleSearch === "function") {
    window.handleSearch(query);
  }
}

// 🔍 Recherche dans Évaluation
function applySearchToEvaluation(query) {
  const rows = document.querySelectorAll("#evaluation-view table tbody tr");
  if (!rows.length) return;

  rows.forEach(row => {
    const name = row.children[0]?.textContent?.toLowerCase() || "";
    const visible = name.includes(query);
    row.style.display = query === "" || visible ? "table-row" : "none";
  });
}

// 🧠 Suggestions de modules affichées sous l'input
function showModuleSuggestions(modules, queryPart, container, input) {
  let box = document.getElementById("autocomplete-box");

  if (!box) {
    box = document.createElement("div");
    box.id = "autocomplete-box";
    box.className = "suggestion-box";
    container.appendChild(box); // 📍 append to search-container-global
  }

  box.innerHTML = `<div class="suggestion-item-group">Modules disponibles :</div>`;

  modules.forEach(mod => {
    if (!mod.label.toLowerCase().includes(queryPart)) return;

    const item = document.createElement("div");
    item.className = "suggestion-item";
    item.dataset.command = mod.label;
    item.textContent = "/" + mod.label;

    item.addEventListener("click", () => {
      mod.activate(input); // Appelle la fonction du module (ex: secteur.js)
      hideModuleSuggestions();
    });

    box.appendChild(item);
  });

  box.style.display = "block";
}

// ❌ Cacher suggestions
function hideModuleSuggestions() {
  const existing = document.getElementById("autocomplete-box");
  if (existing) existing.remove();
}

// src/search/index.js
import { createEngine }  from "./engine.js";
import { createPalette } from "./ui/palette.js";
import { createChipBar } from "./ui/chips.js";
import { loadCommands }  from "./commands/index.js";

export async function setupGlobalSearch() {
    const input     = document.getElementById("globalSearchInput");
    const chipBar   = createChipBar(document.getElementById("filter-bar"));
    const palette   = createPalette(input);
    const engine    = createEngine();
    const commands  = await loadCommands();   // chargement des modules dynamiques
  
    /** Met à jour la palette ou applique la recherche texte */
    function update() {
      const v = input.value.trim();
  
      if (v.startsWith("/")) {
        const part = v.slice(1).toLowerCase();
  
        palette.show(
          commands
            .filter(c => c.name.startsWith(part))
            .map(c => ({
              label: `/${c.name}`,
              description: c.description,
              icon: c.icon,
              onSelect: () =>
                c.run({
                  inputEl:     input,
                  closeMenu:   palette.close,
                  openSubMenu: palette.openSubMenu,
                  chipBar,
                  engine,
                }),
            }))
        );
      } else {
        palette.hide();
        engine.apply({ query: v });
      }
    }
  
    // ✅ Écouteurs
    input.addEventListener("input", update);
  
    // ✅ Saisie utilisateur cmd+K
    document.addEventListener("keydown", (e) => {
      const isShortcut = (e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k";
  
      if (isShortcut) {
        e.preventDefault();
        input.focus();
        update(); // déclenche la palette si besoin
        return;
      }

      // slash pour la command-palette
      if (e.key === "/"){
        const el = document.activeElement;
        const typing =
          el &&
          (el === input ||
            el.tagName === "INPUT" ||
            el.tagName === "TEXTAREA");
            el.isContentEditable;
        
        if (!typing) {
          e.preventDefault();
            input.value = "/";
            input.focus();
            update();
            return
        }
        
      }
  


      if (palette.isOpen() && ["ArrowUp","ArrowDown","Enter","Tab"].includes(e.key)) {
        e.preventDefault();
        palette.handleKey(e);
        return;
      }
  
      if (e.key === "Escape") {
        input.value = "";
        palette.close();
        engine.apply({ query: "" });
        input.blur();
      }
    });
  }
  
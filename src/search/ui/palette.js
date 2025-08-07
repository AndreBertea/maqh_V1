// =========================================================================
//  PALETTE (command‑palette) – vanilla JS, sous‑menus imbriqués
// =========================================================================
export function createPalette(anchorInput) {
    const box = document.createElement("div");
    box.className = "search-menu";
    anchorInput.parentElement.appendChild(box);
  
    let stack = [];       // [{ title, items, selectedIdx }]
    let current = null;
  
    /* ---------- helpers ---------- */
    function render() {
      if (!current) return;
      const { title, items, selectedIdx } = current;
      const header = title ? `<div class="search-menu-header">${title}</div>` : "";
  
      box.innerHTML =
        header +
        items
          .map(
            (it, i) => `
          <div class="search-menu-item ${i === selectedIdx ? "selected" : ""}" data-i="${i}">
            ${it.icon ?? ""}<span>${it.label}</span>
            ${it.description ? `<small>${it.description}</small>` : ""}
            ${it.submenu ? `<span class="submenu-arrow">›</span>` : ""}
          </div>`
          )
          .join("");
  
      box.style.display = "block";
    }
  
    function openRoot(items) {
      stack = [{ title: "", items, selectedIdx: 0 }];
      current = stack[0];
      render();
    }
  
    /** helper interne — NOTE : nom changé pour éviter la collision */
    function pushSubMenu(title, items) {
      stack.push({ title, items, selectedIdx: 0 });
      current = stack[stack.length - 1];
      render();
    }
  
    function close() {
      box.style.display = "none";
      stack = [];
      current = null;
    }
  
    function isOpen() {
      return box.style.display === "block";
    }
  
    /* ---------- navigation ---------- */
    function select(delta) {
      current.selectedIdx =
        (current.selectedIdx + delta + current.items.length) % current.items.length;
      render();
    }
  
    function confirm() {
      const itm = current.items[current.selectedIdx];
      if (!itm) return;
        if (itm.submenu) {
            pushSubMenu(itm.label, itm.submenu);
          } else {
          itm.onSelect?.();   // le handler décide lui‑même de fermer ou non
        }
    }
  
    /* ---------- click ---------- */
    box.addEventListener("click", (e) => {
      const div = e.target.closest(".search-menu-item");
      if (!div) return;
      current.selectedIdx = +div.dataset.i;
      confirm();
    });
  
    /* ---------- API publique ---------- */
    return {
      show(items) {
        openRoot(items);
      },
      close,
      hide: close,
      isOpen,
      /** appelé par secteur.js & co. */
      openSubMenu({ title, items }) {
        pushSubMenu(title, items);
      },
      handleKey(e) {
        if (!isOpen()) return false;
        if (e.key === "ArrowDown") {
          select(1);
          return true;
        }
        if (e.key === "ArrowUp") {
          select(-1);
          return true;
        }
        if (e.key === "Enter" || e.key === "Tab") {
          confirm();
          return true;
        }
        if (e.key === "Escape") {
          close();
          return true;
        }
        return false;
      },
    };
  }
  
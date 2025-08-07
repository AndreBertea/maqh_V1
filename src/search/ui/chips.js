// ========= UI : BARRE DE « CHIPS » DE FILTRE =========
export function createChipBar(container) {
    /** ajoute un chip et retourne une fonction pour le supprimer */
    function add(type, value, onRemove) {
      // évite les doublons
      if (container.querySelector(`[data-type="${type}"][data-value="${value}"]`))
        return;
  
      const tag = document.createElement("div");
      tag.className = "filter-tag";
      tag.dataset.type = type;
      tag.dataset.value = value;
      tag.innerHTML = `${type}: ${value} <span class="remove-filter">×</span>`;
  
      tag.querySelector(".remove-filter").addEventListener("click", () => {
        tag.remove();
        onRemove?.();
      });
  
      container.appendChild(tag);
    }
  
    return { add };
  }
  
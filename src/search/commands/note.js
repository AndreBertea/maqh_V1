// ------------------------------------------------------------------
//  Commande /note  – filtre par note (min) ou Top %
// ------------------------------------------------------------------
import { norm } from "../../utils.js";

export const meta = {
  name: "note",
  description: "Filtrer par note (minimum ou top %)",
  icon: "⭐",
};

export function run({ inputEl, closeMenu, openSubMenu, chipBar, engine }) {

  /* ----- sous‑menu principal : deux choix ----- */
  openSubMenu({
    title: "Filtrer par note",
    items: [
      { label: "≥ Note minimale…",  onSelect: () => openInput("min") },
      { label: "TOP %…",            onSelect: () => openInput("pct") },
    ],
  });

  /* ----- ouvre un sous‑menu contenant un input ----- */
  function openInput(mode) {
    /* item unique avec un champ <input> qu’on va focus juste après le rendu */
    openSubMenu({
      title: mode === "min" ? "Note minimale (0‑20)" : "Pourcentage (1‑100 %)",
      items: [
        {
          label: `<input id="noteInput" type="number"
                         min="${mode === "min" ? 0 : 1}"
                         max="${mode === "min" ? 20 : 100}"
                         step="0.1"
                         placeholder="…">`,
          description: "Entrez la valeur puis pressez Entrée",
          onSelect: () => {},   // rien : géré par keydown
        },
      ],
    });

    /* focus une fois le champ inséré dans le DOM */
    setTimeout(() => {
      const inp = document.getElementById("noteInput");
      if (!inp) return;
      inp.focus();

      inp.addEventListener("keydown", (e) => {
        if (e.key !== "Enter") return;

        const val = parseFloat(inp.value.replace(",", "."));
        if (isNaN(val) || val <= 0) return;

        if (mode === "min") {
          if (val > 20) return;
          applyFilter({ mode: "min", value: val }, `Note ≥ ${val}`);
        } else {
          if (val > 100) return;
          const threshold = computeThreshold(val);
          if (threshold == null) return;
          applyFilter(
            { mode: "min", value: threshold },
            `Top ${val}% (≥ ${threshold.toFixed(2)})`
          );
        }
      });
    }, 0);
  }

  /* ----- calcule le seuil correspondant à un % ----- */
  function computeThreshold(pct) {
    const cells = [
      ...document.querySelectorAll(
        "#evaluation-view table tbody tr td:nth-child(3)"
      ),
    ];
    const notes = cells
      .map((td) => parseFloat(td.textContent))
      .filter((n) => !isNaN(n))
      .sort((a, b) => b - a); // décroissant
    if (!notes.length) return null;
    const idx = Math.ceil((pct / 100) * notes.length) - 1;
    return notes[Math.max(0, idx)];
  }

  /* ----- applique le filtre + chip ----- */
  function applyFilter(filterObj, chipText) {
    chipBar.add("note", chipText, () => {
      engine.filters.delete("note");
      engine.apply({ query: "" });
    });

    engine.filters.set("note", filterObj);
    engine.apply({ query: "" });

    closeMenu();
    inputEl.value = "";
    inputEl.blur();
  }
}

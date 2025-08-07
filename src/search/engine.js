// =========================================================================
//  MOTEUR DE RECHERCHE & DE FILTRAGE  (barre de recherche globale)
// =========================================================================
import { norm } from "../utils.js";

export function createEngine() {
  /*  ex. filters =
      Map {
        "secteur" → { secteur:"Énergie", sousSecteur:"Pétrole, gaz et charbon" },
        "note"    → { mode:"min", value:12.5 }
      }
  */
  const filters = new Map();

  /** Applique la recherche texte + tous les filtres actifs */
  function apply({ query = "" } = {}) {
    /* --------- HOME (grille) : filtrage + repagination --------- */
    if (typeof window.handleSearch === "function") {
      window.handleSearch(query, filters);
    }

    /* --------- ÉVALUATION (tableau) --------- */
    const q = norm(query);                       // requête normalisée

    document
      .querySelectorAll("#evaluation-view table tbody tr")
      .forEach((tr) => {
        /* colonnes visibles / cachées */
        const symbol = (tr.children[0]?.textContent || "").trim();
        const noteVal = parseFloat(tr.children[2]?.textContent || "NaN");
        const rowSec = (tr.children[3]?.textContent || "").trim();
        const rowSub = (tr.children[4]?.textContent || "").trim();

        /* recherche texte libre */
        const matchesText = q === "" || norm(symbol).includes(q);

        /* filtre SECTEUR */
        const fSec = filters.get("secteur");
        const matchesSector =
          !fSec ||
          (norm(rowSec) === norm(fSec.secteur) &&
            (fSec.sousSecteur === "" ||
              norm(rowSub) === norm(fSec.sousSecteur)));

        /* filtre NOTE (≥ seuil) */
        const fNote = filters.get("note");
        const matchesNote =
          !fNote ||
          (fNote.mode === "min" && !isNaN(noteVal) && noteVal >= fNote.value);

        tr.style.display =
          matchesText && matchesSector && matchesNote ? "table-row" : "none";
      });
  }

  return { filters, apply };
}

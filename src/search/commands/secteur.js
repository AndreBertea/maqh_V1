import { activeCards } from "../../grid.js";
import { norm } from "../../utils.js";

/* ------------------------------------------------------------------ */
/*  Métadonnées visibles dans la palette                              */
/* ------------------------------------------------------------------ */
export const meta = {
  name: "secteur",
  description: "Filtrer par secteur ou sous‑secteur",
  icon: "🏷️",
};

/* ------------------------------------------------------------------ */
/*  Exécution de la commande                                          */
/* ------------------------------------------------------------------ */
export function run({ inputEl, closeMenu, openSubMenu, chipBar, engine }) {
  /* ---------- 1. Regrouper secteur → sous‑secteurs ---------- */
  const groups = new Map();              // { Énergie → Set(<SousSecteur>) }
  activeCards.forEach(c => {
    if (!c.Secteur) return;
    const sec = c.Secteur.trim();
    const sub = (c["Sous Secteur"] || "").trim();
    if (!groups.has(sec)) groups.set(sec, new Set());
    if (sub) groups.get(sec).add(sub);
  });

  /* ---------- 2. Construire le menu principal --------------- */
  const menuItems = [...groups.keys()].sort().map(sec => {
    const secClean = sec.trim();
    return {
      label: secClean,
      onSelect: () => applyFilter(secClean, ""),
      submenu: [
        { label: "SECTEUR", onSelect: () => applyFilter(secClean, "") },
        ...[...groups.get(sec)].sort().map(sub => ({
          label: sub.trim(), onSelect: () => applyFilter(secClean, sub.trim())
        }))
      ]
    };
  });
  

  /* ---------- 3. Afficher le menu via palette ---------------- */
  openSubMenu({ title: "Secteurs", items: menuItems });

  /* ---------- Helper : activer filtre + ajouter chip ---------- */
  function applyFilter(secteur, sousSecteur) {
    /* en‑tête du chip */
    const chipText = sousSecteur ? `${secteur} → ${sousSecteur}` : secteur;

    chipBar.add("secteur", chipText, () => {
      engine.filters.delete("secteur");
      engine.apply({ query: "" });
    });

    engine.filters.set("secteur", { secteur, sousSecteur });
    engine.apply({ query: "" });

    closeMenu();
    inputEl.value = "";
    inputEl.blur();
  }
}

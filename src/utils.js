// ==========================================================================
//  src/utils.js  – helpers généraux
// ==========================================================================

/* ------------------------------------------------------------------
   1)  Normalisation de texte
       - trim
       - suppression des accents
       - passage en minuscules
       Utilisée pour comparer Secteur / Sous‑secteur / Symbol / Name
------------------------------------------------------------------ */
export function norm(str = "") {
  return str.trim()
            .normalize("NFD")               // sépare lettres + accents
            .replace(/[\u0300-\u036f]/g, "")// enlève les signes diacritiques
            .toLowerCase();
}

/* ------------------------------------------------------------------
   2)  Conversion HEX → RGBA
------------------------------------------------------------------ */
export function hexToRGBA(hex, opacity) {
  hex = hex.replace("#", "");
  if (hex.length === 3) {
    hex = hex.split("").map((c) => c + c).join("");
  }
  const bigint = parseInt(hex, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

/* ------------------------------------------------------------------
   3)  Filtrage des séries de prix selon la période demandée
------------------------------------------------------------------ */
export function getFilteredData(prices, period, periodDaysMap) {
  const dataArray = Object.entries(prices)
    .map(([d, p]) => ({ date: new Date(d), price: Number(p) }))
    .sort((a, b) => a.date - b.date);

  const lastDate       = dataArray.at(-1)?.date;
  const daysToSubtract = periodDaysMap[period] ?? 5;

  if (daysToSubtract !== Infinity) {
    const cutoff = new Date(lastDate);
    cutoff.setDate(cutoff.getDate() - daysToSubtract);
    return dataArray.filter((it) => it.date >= cutoff);
  }
  return dataArray;
}

/* ------------------------------------------------------------------
   4)  Parse CSV très simple (pas de guillemets imbriqués)
------------------------------------------------------------------ */
export function parseCSV(csvText) {
  const lines   = csvText.trim().split("\n");
  const headers = lines[0].split(",");

  return lines.slice(1).map(line => {
    const values = line.split(",");
    const obj = {};
    headers.forEach((h, idx) => {
      obj[h] = values[idx]?.replace(/"/g, "").trim() ?? "";
    });
    return obj;
  });
}

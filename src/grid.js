// =========================================================================
//  GRID  – chargement CSV • rendu des cartes • pagination • recherche
// =========================================================================
import {
  hexToRGBA,
  getFilteredData,
  parseCSV,
  norm,
} from "./utils.js";
import { loadConfig } from "./config.js";
import { openCardModal } from "./components/cardModal/cardModal.js";
import { evaluateConditions } from "./components/cardModal/conditions.js"; // ← NEW

/* ---------------- État interne ----------------------------------------- */
let allCards = [];          // toutes les lignes du CSV
export let activeCards = []; // résultat après filtrage
let chartInstances = {};

let currentPeriod = "5d";
let currentPage = 1;
let cardsPerPage = 10;

/* ----- mapping période → jours ----- */
const periodDaysMap = {
  "1d": 1,
  "5d": 5,
  "1mo": 30,
  "3mo": 90,
  "6mo": 180,
  "1y": 365,
  "5y": 1825,
  max: Infinity,
};

const positiveColor = "#4CAF50";
const negativeColor = "#F44336";

/* =======================================================================
   INITIALISATION
======================================================================= */
export async function initGrid() {
  const cfg = loadConfig();
  cardsPerPage = cfg.cardsPerPage;
  currentPeriod = cfg.currentPeriod;

  /* boutons de période */
  document.querySelectorAll(".period-btn").forEach((btn) => {
    btn.addEventListener("click", function () {
      document
        .querySelectorAll(".period-btn")
        .forEach((b) => b.classList.remove("active"));
      this.classList.add("active");
      updatePeriod(this.dataset.period);
    });
  });

  await fetchData();
}

/* -----------------------------------------------------------------------
   Chargement CSV + JSON Yahoo + NOTE
------------------------------------------------------------------------ */
async function fetchData() {
  try {
    const csv = await fetch("data/EURONEXT_actions.csv").then((r) => r.text());
    allCards = parseCSV(csv);

    await Promise.all(
      allCards.map(async (card) => {
        try {
          /* --- prix & historique -------------------------------------- */
          const json = await fetch(
            `data/yahoo_api/${card.Symbol}.json`
          ).then((r) => r.json());

          card.currentPrice = json.currentPrice;
          card.prices = json.prices;
          card.dataAvailable =
            !(
              card.currentPrice === null ||
              (card.prices &&
                Object.keys(card.prices)[0] === "No Data Available")
            );
          card.special = !card.dataAvailable;

          /* --- NOTE (/20) pour le filtre /note ------------------------ */
          try {
            const company = await fetch(
              `data/companies/euronext/${encodeURIComponent(card.Name)}.json`
            ).then((r) => r.json());

            const results = await evaluateConditions(company); // [{note, …}]
            const total = results.reduce((sum, r) => sum + r.note, 0);
            card.note = (total / results.length) * 20; // ex. 14.27
          } catch {
            /* company JSON manquant → pas de note */
          }
        } catch {
          /* yahoo JSON manquant */
          card.dataAvailable = false;
          card.special = true;
        }
      })
    );

    /* cartes avec data en premier */
    allCards.sort((a, b) =>
      a.special && !b.special ? 1 : !a.special && b.special ? -1 : 0
    );

    activeCards = allCards.slice();
    currentPage = 1;
    renderCards(activeCards);
  } catch (e) {
    console.error("Erreur de chargement :", e);
  }
}

/* -----------------------------------------------------------------------
   Rendu d’une page
------------------------------------------------------------------------ */
function renderCards(cards) {
  const grid = document.getElementById("grid-container");
  if (!grid) return console.error("#grid-container manquant");
  grid.innerHTML = "";

  Object.values(chartInstances).forEach((c) => c.destroy());
  chartInstances = {};

  const start = (currentPage - 1) * cardsPerPage,
    end = start + cardsPerPage,
    page = cards.slice(start, end);

  if (!page.length) {
    grid.innerHTML = "<p>Aucune carte ne correspond à votre recherche.</p>";
    return;
  }

  page.forEach((card) => {
    const el = document.createElement("div");
    el.className = "card";
    if (card.special) el.style.opacity = ".6";

    /* data‑attributes utiles */
    el.dataset.symbol = card.Symbol.toLowerCase();
    el.dataset.sector = (card.Secteur || "").trim();
    el.dataset.subsector = (card["Sous Secteur"] || "").trim();
    if (typeof card.note === "number") {
      el.dataset.note = card.note.toFixed(2);
    }

    el.innerHTML = `
      <div class="card-header">
        <p class="symbol">${card.Symbol}.PA</p>
        <p class="description">${card.Name}</p>
      </div>
      <div class="price"  id="price-${card.Symbol}">…</div>
      <div class="change" id="change-${card.Symbol}">…</div>
      <div class="card-chart"><canvas id="chart-${card.Symbol}"></canvas></div>
    `;
    el.addEventListener("click", (e) => openCardModal(card, e));
    grid.appendChild(el);

    const data = card.dataAvailable
      ? calculateCardData(card)
      : { dataAvailable: false, special: card.special };
    renderCardData(card.Symbol, data);
  });

  renderPaginationControls(cards);
}

/* -----------------------------------------------------------------------
   Calcul chart + valeurs
------------------------------------------------------------------------ */
function calculateCardData(card) {
  const filtered = getFilteredData(card.prices, currentPeriod, periodDaysMap);
  if (!filtered.length) return { dataAvailable: false };

  const labels = filtered.map((d) => d.date.toISOString().split("T")[0]);
  const prices = filtered.map((d) => d.price);
  const first = prices[0],
    last = card.currentPrice;
  const change = last - first,
    pct = first ? (change / first) * 100 : 0;

  return {
    currentPrice: last,
    change,
    changePercent: pct,
    dates: labels,
    prices,
    dataAvailable: true,
  };
}

function renderCardData(symbol, d) {
  const price = document.getElementById(`price-${symbol}`);
  const change = document.getElementById(`change-${symbol}`);
  const canvas = document.getElementById(`chart-${symbol}`);
  if (!price || !change || !canvas) return;

  if (!d.dataAvailable) {
    price.textContent = "No Data Available";
    change.innerHTML = "";
    return;
  }

  const col = d.change >= 0 ? positiveColor : negativeColor;
  price.textContent = `${d.currentPrice.toFixed(2)} €`;
  change.innerHTML = `<span style="color:${col}">${d.changePercent.toFixed(
    2
  )}% (${d.change.toFixed(2)})</span>`;

  if (chartInstances[symbol]) chartInstances[symbol].destroy();
  chartInstances[symbol] = new Chart(canvas.getContext("2d"), {
    type: "line",
    data: {
      labels: d.dates,
      datasets: [
        {
          data: d.prices,
          borderColor: col,
          backgroundColor: hexToRGBA(col, 0.2),
          fill: true,
          tension: 0.3,
        },
      ],
    },
    options: {
      plugins: { legend: { display: false } },
      scales: { x: { display: false }, y: { display: false } },
    },
  });
}

/* -----------------------------------------------------------------------
   Pagination
------------------------------------------------------------------------ */
function renderPaginationControls(list) {
  const pag = document.getElementById("pagination");
  if (!pag) return;
  pag.innerHTML = "";

  const pages = Math.ceil(list.length / cardsPerPage);
  const prev = btn("Previous", () => {
    if (currentPage > 1) {
      currentPage--;
      renderCards(list);
    }
  });
  const next = btn("Next", () => {
    if (currentPage < pages) {
      currentPage++;
      renderCards(list);
    }
  });
  prev.disabled = currentPage <= 1;
  next.disabled = currentPage >= pages;
  pag.append(prev, span(`Page ${currentPage} of ${pages}`), next);

  function btn(t, f) {
    const b = document.createElement("button");
    b.textContent = t;
    b.onclick = f;
    return b;
  }
  function span(t) {
    const s = document.createElement("span");
    s.textContent = t;
    return s;
  }
}

/* -----------------------------------------------------------------------
   Période
------------------------------------------------------------------------ */
function updatePeriod(p) {
  currentPeriod = p;
  renderCards(activeCards);
}

/* -----------------------------------------------------------------------
   RECHERCHE GLOBALE – appelée par engine.apply()
------------------------------------------------------------------------ */
function handleSearch(query = "", filters = new Map()) {
  const q = query.trim().toLowerCase();

  activeCards = allCards.filter((card) => {
    /* recherche libre (nom ou ticker) */
    const matchFree =
      q === "" ||
      card.Name.toLowerCase().includes(q) ||
      card.Symbol.toLowerCase().includes(q);

    /* filtre SECTEUR + sous‑secteur */
    const fSec = filters.get("secteur");
    const matchSector =
      !fSec ||
      (norm(card.Secteur) === norm(fSec.secteur) &&
        (fSec.sousSecteur === "" ||
          norm(card["Sous Secteur"]) === norm(fSec.sousSecteur)));

    /* filtre NOTE */
    const fNote = filters.get("note");
    const matchNote =
      !fNote ||
      (fNote.mode === "min" &&
        typeof card.note === "number" &&
        card.note >= fNote.value);

    return matchFree && matchSector && matchNote;
  });

  currentPage = 1;
  renderCards(activeCards);
}
window.handleSearch = handleSearch;

/* ----------------------------------------------------------------------- */
export { updatePeriod };

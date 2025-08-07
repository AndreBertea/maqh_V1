// --------------------------------------------------------------
//  Table ÉVALUATION  – tri ▲▼, synchro, bouton réglages fixé
// --------------------------------------------------------------
import { parseCSV }          from "../../utils.js";
import { evaluateConditions } from "../cardModal/conditions.js";
import { openCardModal }      from "../cardModal/cardModal.js";
import { activeCards }        from "../../grid.js";

export async function renderEvaluationTable() {
  const section = document.getElementById("evaluation-view");
  if (!section) return;

  /* ────────────────────────────────────────────────────────────
     Wrapper + bouton réglages FIXE en haut‑droite
  ──────────────────────────────────────────────────────────── */
  section.innerHTML = `
    <div id="eval-wrapper" style="position:relative">
      <div id="filter-bar-eval"></div>
      <button id="eval-setting-btn" class="setting-btn note-setting-btn" title="Configurer les conditions">⚙️</button>
    </div>
  `;

  const wrapper = section.querySelector("#eval-wrapper");
  const table   = document.createElement("table");
  table.className = "notation-table";
  wrapper.appendChild(table);

  document.getElementById("eval-setting-btn").onclick = () =>
    import("../cardModal/notation_setting.js").then((m) =>
      m.openNotationSettingsModal()
    );

  /* ────────────────────────────────────────────────────────────
     Table : entête + tbody
  ──────────────────────────────────────────────────────────── */
  table.innerHTML = `
    <thead>
      <tr>
        <th>Symb.</th>
        <th>Nom</th>
        <th id="note-col">Note (/20)</th>
        <th class="hidden">Secteur</th>
        <th class="hidden">Sous Secteur</th>
      </tr>
    </thead>
    <tbody id="notation-tbody"></tbody>
  `;

  /* ────────────────────────────────────────────────────────────
     Tri ▲▼ dans la colonne Note
  ──────────────────────────────────────────────────────────── */
  const noteTh = table.querySelector("#note-col");
  const up   = document.createElement("button");
  const down = document.createElement("button");
  up.className = down.className = "sort-btn";
  up.innerHTML = "▲";  up.title   = "Trier notes croissantes";
  down.innerHTML = "▼";down.title = "Trier notes décroissantes";
  up.onclick   = () => sortRows(true);
  down.onclick = () => sortRows(false);
  noteTh.style.whiteSpace = "nowrap";
  noteTh.append(" ", up, down);

  /* ────────────────────────────────────────────────────────────
     Chargement initial
  ──────────────────────────────────────────────────────────── */
  const rowMap = new Map();
  await buildRows();

  /* ────────────────────────────────────────────────────────────
     BroadcastChannel  ->  synchro
  ──────────────────────────────────────────────────────────── */
  const bc = new BroadcastChannel("user-notation-channel");
  bc.addEventListener("message", async ({ data }) => {
    if (!data || !data.type) return;
    if (data.type === "userNotationUpdated" && data.cardName) {
      await updateOne(data.cardName);
    } else if (data.type === "notationConfigChanged") {
      await refreshAll();
    }
  });

  /* ===========================================================
     FONCTIONS INTERNES
     =========================================================== */

  async function buildRows() {
    const csvText = await fetch("data/EURONEXT_actions.csv").then(r=>r.text());
    const rowsCSV = parseCSV(csvText);
    const tbody   = table.querySelector("#notation-tbody");

    for (const row of rowsCSV) {
      const { Name, Symbol, Secteur, "Sous Secteur": SousSecteur } = row;
      const note = await computeScore20(Name);

      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${Symbol}</td>
        <td>${Name}</td>
        <td>${note}</td>
        <td class="hidden">${Secteur}</td>
        <td class="hidden">${SousSecteur}</td>
      `;
      tbody.appendChild(tr);
      rowMap.set(Name, tr);

      tr.addEventListener("click", (e) => {
        const card =
          activeCards.find((c) => c.Symbol === Symbol) ||
          { Name, Symbol, Secteur, "Sous Secteur": SousSecteur };
        openCardModal(card, e);
      });
    }
  }

  async function updateOne(name) {
    const tr = rowMap.get(name);
    if (!tr) return;
    tr.children[2].textContent = await computeScore20(name);
    flash(tr);
  }

  async function refreshAll() {
    await Promise.all([...rowMap.keys()].map(updateOne));
  }

  function sortRows(ascending = true) {
    const tbody = table.querySelector("#notation-tbody");
    const rows  = [...tbody.querySelectorAll("tr")];
    rows.sort((a,b)=>{
      const na=parseFloat(a.children[2].textContent),
            nb=parseFloat(b.children[2].textContent);
      if (isNaN(na)) return 1;
      if (isNaN(nb)) return -1;
      return ascending? na-nb : nb-na;
    });
    rows.forEach(r=>tbody.appendChild(r));
  }

  async function computeScore20(name){
    try{
      const url=`data/companies/euronext/${encodeURIComponent(name)}.json`;
      const data=await fetch(url).then(r=>r.json());
      const res =await evaluateConditions(data);
      const tot =res.reduce((s,x)=>s+x.note,0);
      return ((tot/res.length)*20).toFixed(2);
    }catch{return "—";}
  }

  function flash(tr){
    tr.classList.add("flash-update");
    setTimeout(()=>tr.classList.remove("flash-update"),800);
  }
}

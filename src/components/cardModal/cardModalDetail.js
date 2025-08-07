export function renderDetailTab(data, container) {
    // Supprimer uniquement les anciens contenus
    container.querySelectorAll("pre, table").forEach(el => el.remove());
  
    // 🔄 Normalisation immédiate des clés "NTM" => année courante
    const normalizedData = replaceNTMWithCurrentYear(data);
  
    const generalTable = createSimpleTable(normalizedData);
    container.appendChild(generalTable);
  
    const yearBasedEntries = extractYearBasedEntries(normalizedData);
    if (Object.keys(yearBasedEntries).length > 0) {
      const yearTable = createYearTable(yearBasedEntries);
      container.appendChild(document.createElement("hr"));
      container.appendChild(yearTable);
    }
  }
  
  // 🔧 Remplace les clés "NTM" par l'année courante
  function replaceNTMWithCurrentYear(obj) {
    const currentYear = new Date().getFullYear().toString();
  
    if (Array.isArray(obj)) {
      return obj.map(replaceNTMWithCurrentYear);
    } else if (typeof obj === 'object' && obj !== null) {
      const newObj = {};
      for (const [key, value] of Object.entries(obj)) {
        const newKey = key === "NTM" ? currentYear : key;
        newObj[newKey] = replaceNTMWithCurrentYear(value);
      }
      return newObj;
    } else {
      return obj;
    }
  }
  
  // 📘 Table classique des données simples et objets non "année"
  function createSimpleTable(data) {
    const table = document.createElement("table");
    table.className = "json-table";
    const tbody = document.createElement("tbody");
  
    for (const [key, value] of Object.entries(data)) {
      if (typeof value === "object" && !Array.isArray(value)) {
        if (isYearKeyObject(value)) continue; // sera traité à part
        const subTable = createSimpleTable(value);
        const row = tbody.insertRow();
        row.innerHTML = `
          <td style="font-weight: bold;">${key}</td>
          <td>${subTable.outerHTML}</td>
        `;
      } else {
        const row = tbody.insertRow();
        row.innerHTML = `
          <td style="font-weight: bold;">${key}</td>
          <td>${value}</td>
        `;
      }
    }
  
    table.appendChild(tbody);
    return table;
  }
  
  // 📅 Détecte si un objet a uniquement des années comme clés
  function isYearKeyObject(obj) {
    return (
      typeof obj === "object" &&
      Object.keys(obj).every(k => /^\d{4}$/.test(k))
    );
  }
  
  // 📦 Récupère les objets avec uniquement des années en clés
  function extractYearBasedEntries(data) {
    const result = {};
    for (const [key, value] of Object.entries(data)) {
      if (isYearKeyObject(value)) {
        result[key] = value;
      }
    }
    return result;
  }
  
  function createYearTable(yearData) {
    const table = document.createElement("table");
    table.className = "json-table";
    const thead = document.createElement("thead");
    const tbody = document.createElement("tbody");
  
    // Étape 1 : Collecte toutes les années uniques
    const allYears = [...new Set(
      Object.values(yearData).flatMap(obj => Object.keys(obj))
    )].sort();
  
    // Étape 2 : Filtre les années sans AUCUNE donnée
    const validYears = allYears.filter(year =>
      Object.values(yearData).some(entry => {
        const val = entry[year];
        return val !== undefined && val !== null && val !== "—" && val !== "";
      })
    );
  
    // Création de l’en-tête
    const headerRow = document.createElement("tr");
    headerRow.innerHTML = `<th style="width: 200px;">Libellé</th>` +
      validYears.map(y => `<th>${y}</th>`).join("");
    thead.appendChild(headerRow);
  
    // Remplissage du tableau
    for (const [label, values] of Object.entries(yearData)) {
      const row = document.createElement("tr");
      row.innerHTML = `<td style="font-weight: bold;">${label}</td>` +
        validYears.map(y => `<td>${values[y] ?? "—"}</td>`).join("");
      tbody.appendChild(row);
    }
  
    table.appendChild(thead);
    table.appendChild(tbody);
    return table;
  }
  
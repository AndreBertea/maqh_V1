document.addEventListener("DOMContentLoaded", async function () {
    let allCards = [];
    let activeCards = []; // Ensemble de cartes actives (filtrées ou non)
    let stockData = {};
    let chartInstances = {};
    let currentPeriod = "5d"; // Période sélectionnée par défaut
    let currentPage = 1;      // Page courante
    const cardsPerPage = 10;  // Nombre de cartes par page
  
    // Correspondance des périodes aux jours (pour 'max', on affiche toutes les données)
    const periodDaysMap = {
      '1d': 1,
      '5d': 5,
      '1mo': 30,
      '3mo': 90,
      '6mo': 180,
      '1y': 365,
      '5y': 1825,
      'max': Infinity
    };
  
    // Couleurs pour la variation
    const positiveColor = "#4CAF50"; // Vert
    const negativeColor = "#F44336"; // Rouge
  
    // Fonction helper pour convertir un hex en rgba (pour le remplissage)
    function hexToRGBA(hex, opacity) {
      hex = hex.replace('#', '');
      if (hex.length === 3) {
        hex = hex.split('').map(c => c + c).join('');
      }
      const bigint = parseInt(hex, 16);
      const r = (bigint >> 16) & 255;
      const g = (bigint >> 8) & 255;
      const b = bigint & 255;
      return `rgba(${r}, ${g}, ${b}, ${opacity})`;
    }
  
    // Convertit l'objet "prices" en tableau trié et filtre selon la période
    function getFilteredData(prices, period) {
      const dataArray = Object.entries(prices)
        .map(([dateStr, price]) => ({ date: new Date(dateStr), price: Number(price) }))
        .sort((a, b) => a.date - b.date);
      const lastDate = dataArray[dataArray.length - 1].date;
      const daysToSubtract = periodDaysMap[period] || 5;
      if (daysToSubtract !== Infinity) {
        const cutoffDate = new Date(lastDate);
        cutoffDate.setDate(cutoffDate.getDate() - daysToSubtract);
        return dataArray.filter(item => item.date >= cutoffDate);
      } else {
        return dataArray;
      }
    }
  
    // Charge le CSV et pour chaque ligne lit le fichier JSON correspondant dans data/yahoo_api/
    async function fetchData() {
      try {
        const csvResponse = await fetch("data/EURONEXT_actions.csv").then(res => res.text());
        // On parse le CSV pour obtenir un tableau d'objets (chaque objet contient Name, Symbol, etc.)
        allCards = parseCSV(csvResponse);
        
        // Pour chaque carte, lire le fichier JSON associé dans data/yahoo_api/{Symbol}.json
        await Promise.all(allCards.map(async card => {
          try {
            // Le CSV fournit "ALDOL" et on attend "ALDOL.json"
            const jsonData = await fetch(`data/yahoo_api/${card.Symbol}.json`).then(res => res.json());
            card.currentPrice = jsonData.currentPrice;
            card.prices = jsonData.prices;
            if (card.currentPrice === null || (card.prices && Object.keys(card.prices)[0] === "No Data Available")) {
              card.dataAvailable = false;
              card.special = true;
            } else {
              card.dataAvailable = true;
              card.special = false;
            }
          } catch (err) {
            console.error(`Erreur lors du chargement du fichier pour ${card.Symbol}:`, err);
            card.dataAvailable = false;
            card.special = true;
          }
        }));
        
        // Tri des cartes : celles avec données disponibles en premier
        allCards.sort((a, b) => {
          if (a.special && !b.special) return 1;
          if (!a.special && b.special) return -1;
          return 0;
        });
        
        // Au départ, aucune recherche n'est effectuée : activeCards = allCards
        activeCards = allCards.slice();
        currentPage = 1;
        renderCards(activeCards);
      } catch (error) {
        console.error("Erreur lors du chargement des fichiers CSV ou JSON :", error);
      }
    }
  
    // Parse le CSV et retourne un tableau d'objets
    function parseCSV(csvText) {
      const lines = csvText.trim().split("\n");
      const headers = lines[0].split(",");
      const cards = [];
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(",");
        let card = {};
        for (let j = 0; j < headers.length; j++) {
          let value = values[j].replace(/"/g, "").trim();
          card[headers[j]] = value;
        }
        cards.push(card);
      }
      return cards;
    }
  
    // Rendu des cartes de la page courante (les cartes proviennent de activeCards)
    function renderCards(cards) {
      const gridContainer = document.getElementById("grid-container");
      if (!gridContainer) {
        console.error("Erreur : 'grid-container' introuvable dans le DOM.");
        return;
      }
      gridContainer.innerHTML = "";
      Object.values(chartInstances).forEach(chart => chart.destroy());
      chartInstances = {};
  
      // Pagination : calculer les index
      const startIndex = (currentPage - 1) * cardsPerPage;
      const endIndex = startIndex + cardsPerPage;
      const cardsToRender = cards.slice(startIndex, endIndex);
  
      if (cardsToRender.length === 0) {
        gridContainer.innerHTML = "<p>Aucune carte ne correspond à votre recherche.</p>";
        return;
      }
  
      cardsToRender.forEach(card => {
        const cardElement = document.createElement("div");
        cardElement.classList.add("card");
        // Pour les cartes spéciales, opacifier la carte
        if (card.special) {
          cardElement.style.opacity = "0.6";
        }
        cardElement.dataset.symbol = card.Symbol;
        cardElement.innerHTML = `
          <div class="card-header">
            <p class="symbol">${card.Symbol}.PA</p>
            <p class="description">${card.Name}</p>
          </div>
          <div class="price" id="price-${card.Symbol}">...</div>
          <div class="change" id="change-${card.Symbol}">...</div>
          <div class="card-chart">
            <canvas id="chart-${card.Symbol}"></canvas>
          </div>
        `;
        gridContainer.appendChild(cardElement);
  
        if (!card.dataAvailable) {
          renderCardData(card.Symbol, { dataAvailable: false, special: card.special });
        } else {
          const data = calculateCardData(card);
          renderCardData(card.Symbol, data);
        }
      });
  
      renderPaginationControls(cards);
    }
  
    // Calcule les données à afficher pour une carte disposant de données
    function calculateCardData(card) {
      const pricesData = card.prices;
      if (!pricesData || Object.keys(pricesData).length === 0) {
        return { dataAvailable: false };
      }
      const filteredData = getFilteredData(pricesData, currentPeriod);
      const labels = filteredData.map(item => item.date.toISOString().split("T")[0]);
      const prices = filteredData.map(item => item.price);
      const currentPrice = card.currentPrice;
      const firstPrice = prices.length > 0 ? prices[0] : currentPrice;
      const change = currentPrice - firstPrice;
      const changePercent = firstPrice !== 0 ? (change / firstPrice * 100) : 0;
      return {
        currentPrice,
        change,
        changePercent,
        dates: labels,
        prices: prices,
        dataAvailable: true
      };
    }
  
    // Met à jour les graphiques pour la période sélectionnée sur la page courante
    function updatePeriod(period) {
      currentPeriod = period;
      Object.values(chartInstances).forEach(chart => chart.destroy());
      chartInstances = {};
      const currentCards = getCurrentPageCards(activeCards);
      currentCards.forEach(card => {
        if (card.dataAvailable) {
          const data = calculateCardData(card);
          renderCardData(card.Symbol, data);
        }
      });
      console.log(`Période mise à jour : ${currentPeriod}`);
    }
  
    // Renvoie les cartes correspondant à la page courante (à partir de activeCards)
    function getCurrentPageCards(cards) {
      const startIndex = (currentPage - 1) * cardsPerPage;
      const endIndex = startIndex + cardsPerPage;
      return cards.slice(startIndex, endIndex);
    }
  
    // Affiche les données dans une carte et crée le graphique correspondant
    function renderCardData(symbol, data) {
      const priceElement = document.getElementById(`price-${symbol}`);
      const changeElement = document.getElementById(`change-${symbol}`);
      const canvasElement = document.getElementById(`chart-${symbol}`);
      if (!priceElement || !changeElement || !canvasElement) return;
  
      if (data.special) {
        priceElement.innerText = "No Data Available";
        changeElement.innerHTML = "";
        // On ne crée pas de graphique pour les cartes spéciales
        return;
      }
  
      priceElement.innerText = `${data.currentPrice.toFixed(2)} €`;
      const color = data.change >= 0 ? positiveColor : negativeColor;
      changeElement.innerHTML = `<span style="color: ${color}">${data.changePercent.toFixed(2)}% (${data.change.toFixed(2)})</span>`;
      if (chartInstances[symbol]) {
        chartInstances[symbol].destroy();
      }
      const ctx = canvasElement.getContext("2d");
      chartInstances[symbol] = new Chart(ctx, {
        type: "line",
        data: {
          labels: data.dates,
          datasets: [{
            data: data.prices,
            borderColor: color,
            backgroundColor: hexToRGBA(color, 0.2),
            fill: true,
            tension: 0.3
          }]
        },
        options: {
          plugins: { legend: { display: false } },
          scales: { x: { display: false }, y: { display: false } }
        }
      });
    }
  
    // Génère les contrôles de pagination en fonction du tableau de cartes (ici activeCards ou filtré)
    function renderPaginationControls(filteredCards) {
      const paginationContainer = document.getElementById("pagination");
      if (!paginationContainer) return;
      paginationContainer.innerHTML = "";
      const totalPages = Math.ceil(filteredCards.length / cardsPerPage);
      const prevBtn = document.createElement("button");
      prevBtn.innerText = "Previous";
      prevBtn.disabled = currentPage <= 1;
      prevBtn.addEventListener("click", function () {
        if (currentPage > 1) {
          currentPage--;
          renderCards(filteredCards);
        }
      });
      const nextBtn = document.createElement("button");
      nextBtn.innerText = "Next";
      nextBtn.disabled = currentPage >= totalPages;
      nextBtn.addEventListener("click", function () {
        if (currentPage < totalPages) {
          currentPage++;
          renderCards(filteredCards);
        }
      });
      const pageInfo = document.createElement("span");
      pageInfo.innerText = `Page ${currentPage} of ${totalPages}`;
      paginationContainer.appendChild(prevBtn);
      paginationContainer.appendChild(pageInfo);
      paginationContainer.appendChild(nextBtn);
    }
  
    // Fonction de recherche : filtre les cartes selon Name et Symbol et met à jour activeCards
    function handleSearch() {
      const searchInput = document.getElementById("searchInput");
      const query = searchInput.value.toLowerCase();
      console.log("Recherche lancée avec :", query);
      activeCards = allCards.filter(card => {
        return card.Name.toLowerCase().includes(query) ||
               card.Symbol.toLowerCase().includes(query);
      });
      currentPage = 1;
      renderCards(activeCards);
    }
  
    // Écouteur sur la barre de recherche
    const searchInput = document.getElementById("searchInput");
    if (searchInput) {
      searchInput.addEventListener("keyup", handleSearch);
    }
  
    // Raccourci clavier : Cmd/Ctrl+K pour activer la recherche
    document.addEventListener("keydown", function (e) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        console.log("Raccourci Cmd/Ctrl+K déclenché");
        if (searchInput) {
          searchInput.focus();
        }
      }
    });
  
    // Gestionnaire pour les boutons de période
    document.querySelectorAll(".period-btn").forEach(button => {
      button.addEventListener("click", function () {
        document.querySelectorAll(".period-btn").forEach(btn => btn.classList.remove("active"));
        this.classList.add("active");
        updatePeriod(this.getAttribute("data-period"));
      });
    });
  
    fetchData();
  });
  
  console.log("Chargement terminé.");

  document.addEventListener("DOMContentLoaded", function () {
    const sidebar = document.getElementById("sidebar");
    const resizer = document.getElementById("resizer");
    const sidebarToggle = document.getElementById("sidebar-toggle");
    let isResizing = false;
  
    resizer.addEventListener("mousedown", function (e) {
      isResizing = true;
      document.body.style.cursor = "ew-resize";
      e.preventDefault();
    });
  
    document.addEventListener("mousemove", function (e) {
      if (!isResizing) return;
      // Calcul de la nouvelle largeur en fonction de la position de la souris
      let newWidth = e.clientX;
      // On limite la largeur minimale à 0 (pour cacher la sidebar) et maximale par exemple 400px
      newWidth = Math.min(Math.max(newWidth, 0), 400);
      sidebar.style.width = newWidth + "px";
  
      // Si la largeur est inférieure à 40px, on cache la sidebar
      if (newWidth < 40) {
        sidebar.style.width = "0px";
        sidebar.style.display = "none";
        sidebarToggle.style.display = "block";
        isResizing = false; // arrêt du redimensionnement
        document.body.style.cursor = "default";
      }
    });
  
    document.addEventListener("mouseup", function (e) {
      if (isResizing) {
        isResizing = false;
        document.body.style.cursor = "default";
      }
    });
  
    // Bouton de toggle pour afficher la sidebar cachée
    sidebarToggle.addEventListener("click", function () {
      sidebar.style.display = "flex";
      sidebar.style.width = "250px"; // largeur par défaut
      sidebarToggle.style.display = "none";
    });
  });
  
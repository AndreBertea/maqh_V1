import { evaluateConditions } from './conditions.js';

export async function renderNotationTab(data, container) {
  container.dataset.cardName = data.Name;
  container.innerHTML = '';

  // On récupère un tableau d'objets { condition, note, displayNote, description }
  const evaluationResults = await evaluateConditions(data, data.Name);

  const groupedOrder = [
    {
      label: "Valorisation de l'action",
      items: [10, 11]
    },
    {
      label: "Part d'investissement",
      items: [14, 15, 16]
    },
    {
      label: "Poids de l’entreprise",
      items: [12, 8, 9]
    },
    {
      label: "Dividende",
      items: [4, 13, 1, 2, 3]
    },
    {
      label: "Santé financière",
      items: [5, 6, 7]
    }
  ];

  // Calcul du score total
  const totalScore = evaluationResults.reduce((sum, item) => sum + item.note, 0);
  // Conversion en sur 20
  const scoreSur20 = ((totalScore / evaluationResults.length) * 20).toFixed(2);

  const wrapper = document.createElement('section');
  wrapper.className = 'wrapper';

  const sectionTitle = document.createElement("div");
  sectionTitle.className = "notation-header";
  sectionTitle.innerHTML = `
    <h2>Notation</h2>
    <button class="setting-btn" title="Configurer les conditions">
      <span class="bar bar1"></span>
      <span class="bar bar2"></span>
      <span class="bar bar1"></span>
    </button>
  `;
  wrapper.appendChild(sectionTitle);
  
  // ⚙️ Action au clic sur le bouton de configuration
  sectionTitle.querySelector(".setting-btn").onclick = () =>
    import('./notation_setting.js').then(m => m.openNotationSettingsModal());
  
  const titleMain = document.createElement('main');
  wrapper.appendChild(titleMain);

  // Pour calculer un score sur 5 par groupe
  let scoreSur5 = 0;

  for (const group of groupedOrder) {
    // Titre de section
    const sectionRow = document.createElement('article');
    sectionRow.className = 'row section-header';
    sectionRow.innerHTML = `
      <ul>
        <li><strong>${group.label}</strong></li>
        <li></li>
      </ul>
    `;
    wrapper.appendChild(sectionRow);

    const groupNotes = [];

    for (const num of group.items) {
      // Les conditions sont indexées de 0 à N-1, donc "num - 1"
      const result = evaluationResults[num - 1];
      if (!result) continue;

      // On conserve `result.note` pour le calcul, et `result.displayNote` pour l'affichage
      groupNotes.push(result.note);

      const row = document.createElement('article');
      row.className = `row row-c${num}`;

      // Utilisation de displayNote au lieu de note pour l'affichage 
      const contentList = document.createElement('ul');
      contentList.innerHTML = `
        <li>${result.condition}</li>
        <li>${result.displayNote}</li>
      `;

      const descriptionList = document.createElement('ul');
      descriptionList.className = 'more-content';
      descriptionList.innerHTML = `<li>${result.description}</li>`;

      row.appendChild(contentList);
      row.appendChild(descriptionList);
      wrapper.appendChild(row);
    }

    // Calcul partiel pour le score « thématique » /5
    if (groupNotes.length > 0) {
      // Moyenne des notes du groupe (qui sont 0 ou 1)
      scoreSur5 += groupNotes.reduce((a, b) => a + b, 0) / groupNotes.length;
    }
  }

  // Arrondi du score sur 5 
  const scoreSur5Rounded = scoreSur5.toFixed(2);

  // Affichage du score thématique (sur 5)
  const score5Line = document.createElement('article');
  score5Line.className = 'row total-row';
  score5Line.innerHTML = `
    <ul>
      <li><strong>Score Thématique</strong></li>
      <li>${scoreSur5Rounded}/5</li>
    </ul>
  `;
  wrapper.appendChild(score5Line);

  // Affichage du score global (sur 20)
  const score20Line = document.createElement('article');
  score20Line.className = 'row total-row';
  score20Line.innerHTML = `
    <ul>
      <li><strong>Score Total</strong></li>
      <li>${scoreSur20}/20</li>
    </ul>
  `;
  wrapper.appendChild(score20Line);

  container.appendChild(wrapper);
}

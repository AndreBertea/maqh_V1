const fs = require('fs');
const path = require('path');

// Chemin vers le fichier JSON principal
const inputFilePath = path.join(__dirname, 'data', 'stock_data_all.json');

// Dossier de sortie
const outputDir = path.join(__dirname, 'data', 'yahoo_api');

// Créer le dossier de sortie s'il n'existe pas
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Lecture du fichier JSON principal
fs.readFile(inputFilePath, 'utf8', (err, data) => {
  if (err) {
    console.error("Erreur lors de la lecture du fichier JSON :", err);
    return;
  }
  try {
    const jsonData = JSON.parse(data);
    // Pour chaque objet du tableau, crée un fichier JSON individuel
    jsonData.forEach(item => {
      if (item.symbol) {
        // Retirer '.PA' du symbole pour obtenir le nom de fichier
        const symbolName = item.symbol.replace('.PA', '');
        const outputFilePath = path.join(outputDir, `${symbolName}.json`);
        // Écriture du fichier JSON avec une mise en forme (indentation 2 espaces)
        fs.writeFile(outputFilePath, JSON.stringify(item, null, 2), err => {
          if (err) {
            console.error(`Erreur lors de l'écriture de ${symbolName}.json :`, err);
          } else {
            console.log(`Fichier ${symbolName}.json créé avec succès.`);
          }
        });
      }
    });
  } catch (parseError) {
    console.error("Erreur lors du parsing du JSON :", parseError);
  }
});

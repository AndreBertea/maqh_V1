import { collection, getDocs } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";

/**
 * fetchUserData : récupère les données de la collection 'companies'
 * puis les enregistre localement via l'API `window.fileStorage.saveJSON`
 */
export async function fetchUserData() {
  const db = window.firebaseDB;
  const querySnapshot = await getDocs(collection(db, "companies"));

  querySnapshot.forEach((doc) => {
    const id = doc.id;
    const data = doc.data();

    // ✅ Sauvegarde locale via preload
    if (typeof window.fileStorage?.saveJSON === "function") {
      window.fileStorage.saveJSON(id, { id, ...data });
    } else {
      console.warn("❌ fileStorage API non disponible. Assurez-vous d'être dans Electron avec preload actif.");
    }
    
  });

  console.log("✅ Données sauvegardées dans data/BDD/euronext/");
}

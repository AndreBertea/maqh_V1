import { collection, getDocs, query, orderBy, limit, startAfter } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";

/**
 * fetchUserData : récupère les données de la collection 'companies'
 * puis les enregistre localement via l'API `window.fileStorage.saveJSON`
 */
export async function fetchUserData() {
  const db = window.firebaseDB;
  if (!db) throw new Error("Firebase non initialisé");

  // Sync par pagination (ordre par id pour simplicité)
  let lastDoc = null;
  const pageSize = 200;
  let total = 0;

  while (true) {
    const base = collection(db, "companies");
    const q = lastDoc
      ? query(base, orderBy("Name"), startAfter(lastDoc), limit(pageSize))
      : query(base, orderBy("Name"), limit(pageSize));

    const snap = await getDocs(q);
    if (snap.empty) break;

    snap.forEach((doc) => {
      const data = doc.data();
      const name = data?.Name || doc.id;
      if (typeof window.fileStorage?.saveJSON === "function") {
        window.fileStorage.saveJSON(name, { id: doc.id, ...data });
      }
      total += 1;
    });

    lastDoc = snap.docs[snap.docs.length - 1];
    if (snap.size < pageSize) break;
  }

  console.log(`✅ Synchronisation Firestore terminée. Documents écrits: ${total}`);
}

// -----------------------------------------------------------------------------
//  Déclare ici toutes les commandes disponibles pour la palette
// -----------------------------------------------------------------------------
const loaders = {
    secteur: () => import("./secteur.js"),
    note:    () => import("./note.js"),   // ← nouvelle commande
  };
  
  export async function loadCommands() {
    const entries = await Promise.all(
      Object.entries(loaders).map(async ([name, loader]) => {
        const mod = await loader();
        return { name, ...mod.meta, run: mod.run };   // run est obligatoire
      })
    );
    return entries.filter((c) => typeof c.run === "function");
  }
  
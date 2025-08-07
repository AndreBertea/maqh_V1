import os
import json

# On importe tout ce qu'il faut depuis ton module "notation.py"
# (Assure-toi que "notation.py" est dans le même dossier, ou gère le path)
from notation import CONDITIONS, extract_value, evaluate_conditions

# 1) Choisis la société à tester
JSON_FILE = "data/companies/euronext/L'OREAL.json"  # par ex.

def main():
    if not os.path.exists(JSON_FILE):
        print(f"❌ Fichier introuvable : {JSON_FILE}")
        return

    # 2) Charge le JSON
    with open(JSON_FILE, "r", encoding="utf-8") as f:
        data = json.load(f)

    # 3) Applique chaque condition et affiche les détails
    print(f"=== Test de la notation pour : {JSON_FILE} ===\n")
    for cond in CONDITIONS:
        name = cond["name"]       # ex: "Dividende versé depuis plus de 5 ans"
        key = cond["key"]         # ex: "Dividends.Yield"
        func = cond["func"]       # la fonction Python (conditionX)

        # Récupère la valeur brute dans le JSON
        value = extract_value(data, key)

        # Évalue la condition : True ou False
        result_bool = func(value)
        note = 1 if result_bool else 0

        # Affichage complet
        print(f"Condition : {name}")
        print(f"  - Clé (key) : {key}")
        print(f"  - Valeur brute extraite : {value}")
        print(f"  - Résultat : {result_bool} (note={note})\n")

    # 4) Si tu veux aussi la note globale (somme) :
    results = evaluate_conditions(data)  # renvoie une liste [{condition, note}, ...]
    total_score = sum(item["note"] for item in results)
    print(f"=== Score total : {total_score} sur {len(CONDITIONS)} ===")

if __name__ == "__main__":
    main()

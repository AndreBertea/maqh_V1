import os
import json
import pandas as pd
from unidecode import unidecode

# Chemins
csv_path = "data/EURONEXT_actions.csv"
json_dir = "data/companies/euronext"
per_sec_path = "data/PER_sec.json"

# Charger les données
df = pd.read_csv(csv_path)
with open(per_sec_path, "r", encoding="utf-8") as f:
    per_sec_data = json.load(f)

# Fonction de normalisation
def normalize(text):
    return unidecode(str(text)).strip().lower().replace("’", "'")

# Associer chaque entreprise à son secteur/sous-secteur
name_to_sous_secteur = {
    normalize(row["Name"]): (row["Secteur"], row["Sous Secteur"])
    for _, row in df.iterrows()
}

# Appliquer le PER_sec aux fichiers JSON
updated_files = []
for filename in os.listdir(json_dir):
    if filename.endswith(".json"):
        file_path = os.path.join(json_dir, filename)
        with open(file_path, "r", encoding="utf-8") as f:
            try:
                data = json.load(f)
            except Exception:
                continue

        name = normalize(data.get("Name", ""))
        secteur_sous_secteur = name_to_sous_secteur.get(name)

        if not secteur_sous_secteur:
            continue

        secteur, sous_secteur = secteur_sous_secteur
        ref = per_sec_data.get(secteur, {})
        per_value = ref.get("sous-secteurs", {}).get(sous_secteur)

        if per_value and "Valuation (TTM)" in data:
            data["Valuation (TTM)"]["PER_sec"] = str(per_value)
            with open(file_path, "w", encoding="utf-8") as f:
                json.dump(data, f, indent=2, ensure_ascii=False)
            updated_files.append(filename)

print("✅ Fichiers mis à jour :", updated_files)

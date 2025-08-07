import os
import csv
import json
from collections import defaultdict

CSV_PATH = 'data/EURONEXT_actions.csv'
JSON_DIR = 'data/companies/euronext'
OUTPUT_PATH = 'data/PER_sec.json'

# Map des noms vers secteurs et sous-secteurs
company_map = {}
with open(CSV_PATH, newline='', encoding='utf-8') as f:
    reader = csv.DictReader(f)
    for row in reader:
        name = row["Name"].strip()
        sector = row["Secteur"].strip()
        sub_sector = row["Sous Secteur"].strip()
        company_map[name] = {"secteur": sector, "sous_secteur": sub_sector}

# Structure de stockage
data_collector = defaultdict(lambda: {
    "PER_sec": [],
    "sous-secteurs": defaultdict(list)
})

# Lecture des fichiers JSON
for name, info in company_map.items():
    json_path = os.path.join(JSON_DIR, f"{name}.json")
    if not os.path.exists(json_path):
        continue

    try:
        with open(json_path, encoding='utf-8') as f:
            content = json.load(f)

        pe = content.get("Valuation (TTM)", {}).get("P/E", "")
        if isinstance(pe, str):
            pe = pe.replace(",", "").strip()
            pe = float(pe)

        if pe > 0:
            secteur = info["secteur"]
            sous_secteur = info["sous_secteur"]

            data_collector[secteur]["PER_sec"].append(pe)
            data_collector[secteur]["sous-secteurs"][sous_secteur].append(pe)

    except Exception as e:
        print(f"⚠️ Erreur avec {name}: {e}")

# Calcul des moyennes
output = {}
for secteur, values in data_collector.items():
    secteur_avg = round(sum(values["PER_sec"]) / len(values["PER_sec"]), 2) if values["PER_sec"] else 0

    sous_dict = {
        ss: round(sum(plist) / len(plist), 2)
        for ss, plist in values["sous-secteurs"].items() if plist
    }

    output[secteur] = {
        "PER_sec": secteur_avg,
        "sous-secteurs": sous_dict
    }

# Sauvegarde
with open(OUTPUT_PATH, 'w', encoding='utf-8') as f:
    json.dump(output, f, indent=2, ensure_ascii=False)

print(f"✅ Fichier généré : {OUTPUT_PATH}")

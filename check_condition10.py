import os
import json
import pandas as pd

# Chemins des fichiers
csv_path = "data/EURONEXT_actions.csv"
per_sec_path = "data/PER_sec.json"
json_folder = "data/companies/euronext"

# Chargement des références secteur / sous-secteur
with open(per_sec_path, 'r', encoding='utf-8') as f:
    per_sec_data = json.load(f)

# Chargement du fichier CSV pour mapper noms → sous-secteurs
df_ref = pd.read_csv(csv_path)

# Paramètre configurable
condition10_tolerance_percent = 90  # % de tolérance
tolerance = condition10_tolerance_percent / 100

# Résultats
valid_companies = []

for _, row in df_ref.iterrows():
    name = row["Name"]
    sous_secteur = row["Sous Secteur"]
    
    # Récupération du fichier JSON
    filename = f"{json_folder}/{name}.json"
    if not os.path.isfile(filename):
        continue

    try:
        with open(filename, 'r', encoding='utf-8') as f:
            data = json.load(f)
            valuation = data.get("Valuation (TTM)", {})
            pe = float(valuation.get("P/E", "nan"))
            per_sec = float(valuation.get("PER_sec", "nan"))

            if pd.isna(pe) or pd.isna(per_sec):
                continue

            lower = per_sec * (1 - tolerance)
            upper = per_sec * (1 + tolerance)

            if lower <= pe <= upper:
                valid_companies.append((name, sous_secteur, pe, per_sec, lower, upper))

    except Exception as e:
        print(f"Erreur sur {name}: {e}")

# Sauvegarde en CSV si besoin
result_df = pd.DataFrame(valid_companies, columns=["Nom", "Sous Secteur", "P/E", "PER_sec", "Borne_inf", "Borne_sup"])
result_df.to_csv("condition10_valides.csv", index=False, encoding='utf-8')

import os
import json

DATA_DIR = "data/companies/euronext"
CONFIG_PATH = "config/configNotation.json"
OUTPUT_PATH = "data/notation/note.json"

CURRENT_YEAR = 2024  # Pour rester cohérent avec le JS

########################################################################
# 1) CHARGER CONFIG
########################################################################
with open(CONFIG_PATH, encoding='utf-8') as f:
    config = json.load(f)
CONFIG = config["perso"]  # on récupère la clé "perso" qui contient toutes les conditionX

########################################################################
# 2) FONCTION extract_value (équivalent JS)
########################################################################
def extract_value(data_dict, dotted_key):
    """
    Equivalent de la fonction JS 'extractValue(data, key)' :
      - "Dividends.Yield" => data_dict["Dividends"]["Yield"]
      - etc.
    Renvoie None si la clé n'existe pas.
    """
    try:
        parts = dotted_key.split('.')
        val = data_dict
        for p in parts:
            val = val[p]
        return val
    except (KeyError, TypeError):
        return None

########################################################################
# 3) UTILS POUR LES CONDITIONS
########################################################################
def convert_market_cap(cap):
    """
    Reprend la logique JS : si 'cap' contient B => c’est déjà en milliards,
    si M => divisé par 1000 (pour avoir en milliards),
    si K => divisé par 1e6,
    sinon par défaut => on divise par 1e9.
    """
    try:
        clean = "".join(c for c in cap if c.isdigit() or c in ['.', ',', 'B', 'M', 'K', 'b', 'm', 'k'])
        clean = clean.upper().replace(',', '.')
        # on isole juste le nombre
        num_str = "".join(c for c in clean if c.isdigit() or c == '.')
        num = float(num_str)
        if 'B' in clean:
            return num
        elif 'M' in clean:
            return num / 1000.0
        elif 'K' in clean:
            return num / 1e6
        else:
            return num / 1e9
    except:
        return 0.0


def js_like_parse_float(value):
    """
    Reproduit grossièrement le parseFloat de JS :
      - ignore tout ce qui n'est pas un chiffre, un '.' ou un '-'
      - coupe à la première occurrence d'un caractère inattendu
      - retire les virgules si elles sont a priori des séparateurs de milliers
    """
    if not isinstance(value, str):
        # Si c'est déjà un nombre, on le renvoie directement
        # (ou on convertit en float s'il est en int)
        try:
            return float(value)
        except:
            return 0.0

    text = value.strip()

    # Cas 1 : enlever le signe % éventuel, ou autres symboles inappropriés en fin
    # (JS parseFloat('3.5%') => 3.5 ; Python float('3.5%') => erreur)
    # On va donc couper la chaîne dès qu’on rencontre un caractère non autorisé
    # On autorise : digits, '.', '-', (facultatif : 'e' pour exponent ?)
    # Pour faire simple, on va itérer caractère par caractère.
    parsed_chars = []
    for ch in text:
        if ch.isdigit() or ch in ['.', '-']:
            parsed_chars.append(ch)
        else:
            # Dès qu'on tombe sur un caractère "inattendu", on arrête
            break

    cleaned = "".join(parsed_chars)
    # Enfin, on peut retirer d’éventuels séparateurs de milliers :
    # ex: '3,000' => '3000'
    cleaned = cleaned.replace(",", "")

    try:
        return float(cleaned)
    except:
        return 0.0

########################################################################
# 4) DÉFINITION DES FONCTIONS DE CONDITIONS (identiques au JS)
########################################################################
def condition1(dps):
    try:
        # dps est un dictionnaire => on vérifie que toutes les valeurs sont > 0
        return all(float(v) > 0 for v in dps.values())
    except:
        return False

def condition2(g):
    try:
        return float(g.replace('%', '')) > CONFIG["condition2"]
    except:
        return False

def condition3(y):
    try:
        return float(y.replace('%', '')) > CONFIG["condition3"]
    except:
        return False

def condition4(cap):
    try:
        return convert_market_cap(cap) > CONFIG["condition4"]
    except:
        return False

def condition5(val):
    """
    val est censé être un dictionnaire dont la clé CURRENT_YEAR donne la valeur. Ex: val["2024"] = "3.5"
    On vérifie que < CONFIG["condition5"].
    """
    try:
        return float(val[str(CURRENT_YEAR)]) < CONFIG["condition5"]
    except:
        return False

def condition6(val):
    try:
        return float(val[str(CURRENT_YEAR)]) < CONFIG["condition6"]
    except:
        return False

def condition7(val):
    try:
        years = [int(y) for y in val.keys()]
        min_year = min(years)
        current = js_like_parse_float(val[str(CURRENT_YEAR)])
        past = js_like_parse_float(val[str(min_year)])
        return (current / past) > CONFIG["condition7"]
    except:
        return False

def condition8(val):
    try:
        years = [int(y) for y in val.keys()]
        min_year = min(years)
        current = js_like_parse_float(val[str(CURRENT_YEAR)])
        past = js_like_parse_float(val[str(min_year)])
        return (current / past) > CONFIG["condition8"]
    except:
        return False

def condition9(val):
    try:
        years = [int(y) for y in val.keys()]
        min_year = min(years)
        current = js_like_parse_float(val[str(CURRENT_YEAR)])
        past = js_like_parse_float(val[str(min_year)])
        return (current / past - 1) >= CONFIG["condition9"]
    except:
        return False

def condition10(val):
    try:
        # PER ± condition10%
        pe = float(val["P/E"])
        per_sec = float(val["PER_sec"])
        tolerance = CONFIG["condition10"] / 100.0
        lower = per_sec * (1.0 - tolerance)
        upper = per_sec * (1.0 + tolerance)
        return lower <= pe <= upper
    except:
        return False

def condition11(val):
    try:
        return float(val) < CONFIG["condition11"]
    except:
        return False

def condition12(val):
    try:
        years = [int(y) for y in val.keys()]
        min_year = min(years)
        current = js_like_parse_float(val[str(CURRENT_YEAR)])
        past = js_like_parse_float(val[str(min_year)])
        return (current - past) > 0
    except:
        return False

def condition13(val):
    try:
        return float(val.replace('%', '')) < CONFIG["condition13"]
    except:
        return False

def condition14(val):
    try:
        return float(val.replace('%', '')) > CONFIG["condition14"]
    except:
        return False

def condition15(val):
    try:
        return float(val.replace('%', '')) > CONFIG["condition15"]
    except:
        return False

def condition16(val):
    try:
        # parseFloat(val[minYear]) / parseFloat(val[CURRENT_YEAR]) > CONFIG.condition16
        years = [int(y) for y in val.keys()]
        min_year = min(years)
        return float(val[str(min_year)]) / float(val[str(CURRENT_YEAR)]) > CONFIG["condition16"]
    except:
        return False

########################################################################
# 5) LISTE DES CONDITIONS (même structure qu’en JS)
########################################################################
CONDITIONS = [
    {
        "name": "Dividende versé depuis plus de 5 ans",
        "key": "DPS",
        "func": condition1
    },
    {
        "name": f"Croissance du dividende sur 5 ans > {CONFIG['condition2']}%",
        "key": "Dividends.DPS Growth 5Yr",
        "func": condition2
    },
    {
        "name": f"Rendement du dividende > {CONFIG['condition3']}%",
        "key": "Dividends.Yield",
        "func": condition3
    },
    {
        "name": "Capitalisation",
        "key": "Profile.Market Cap",
        "func": condition4
    },
    {
        "name": "Dettes / EBE",
        "key": "Net Debt / EBITDA",
        "func": condition5
    },
    {
        "name": "Dettes / FCF",
        "key": "Debt / Equity",
        "func": condition6
    },
    {
        "name": "Ratio FCF en augmentation sur 5 ans",
        "key": "Free Cash Flow",
        "func": condition7
    },
    {
        "name": "Résultat net en augmentation sur 5 ans",
        "key": "Net Income to Common Incl Extra Items",
        "func": condition8
    },
    {
        "name": f"Augmentation de CA > {CONFIG['condition9']*100}%",
        "key": "Total Revenues",
        "func": condition9
    },
    {
        "name": f"PER de l’action ±{CONFIG['condition10']}%",
        "key": "Valuation (TTM)",
        "func": condition10
    },
    {
        "name": f"Ratio PEG < {CONFIG['condition11']}",
        "key": "Valuation (NTM).PEG",
        "func": condition11
    },
    {
        "name": "CA stable ou croissant sur 5 ans",
        "key": "Total Revenues",
        "func": condition12
    },
    {
        "name": f"Payout ratio < {CONFIG['condition13']}%",
        "key": "Dividends.Payout",
        "func": condition13
    },
    {
        "name": f"ROA > {CONFIG['condition14']}%",
        "key": "Returns (5Yr Avg).ROA",
        "func": condition14
    },
    {
        "name": f"ROE > {CONFIG['condition15']}%",
        "key": "Returns (5Yr Avg).ROE",
        "func": condition15
    },
    {
        "name": f"Nombre d'actions en baisse de {CONFIG['condition16']}x",
        "key": "Weighted Avg Shares Outstanding Dil",
        "func": condition16
    }
]

########################################################################
# 6) FONCTION evaluateConditions (comme en JS)
########################################################################
def evaluate_conditions(data):
    """
    Retourne la liste { condition: str, note: int } comme en JS
    """
    results = []
    for cond in CONDITIONS:
        # 1) extraire la valeur
        value = extract_value(data, cond["key"])
        # 2) évaluer la condition => True=1 / False=0
        check = cond["func"](value)
        note = 1 if check else 0

        results.append({
            "condition": cond["name"],
            "note": note
        })
    return results

########################################################################
# 7) BOUCLE SUR LES FICHIERS DE data/companies/euronext
########################################################################
def main():
    if not os.path.exists(DATA_DIR):
        print(f"Le répertoire {DATA_DIR} est introuvable.")
        return
    
    notation = {}
    files = [f for f in os.listdir(DATA_DIR) if f.endswith(".json")]
    for filename in files:
        path = os.path.join(DATA_DIR, filename)
        with open(path, encoding="utf-8") as f:
            data = json.load(f)
        
        # nom de la société
        name = data.get("Name") or data.get("Profile", {}).get("CompanyName") or filename.replace(".json", "")

        # 1) on récupère la liste des conditions + notes
        evaluated = evaluate_conditions(data)
        # 2) on somme les notes
        total_score = sum(item["note"] for item in evaluated)
        # (optionnel) on peut normaliser sur 16 conditions => note sur 20
        # note_sur_20 = round((total_score / len(CONDITIONS)) * 20, 2)
        note_sur_20 = round((total_score / len(CONDITIONS)) * 20, 2)
        notation[name] = note_sur_20

    # Écrit le résultat
    os.makedirs(os.path.dirname(OUTPUT_PATH), exist_ok=True)
    with open(OUTPUT_PATH, "w", encoding="utf-8") as f:
        json.dump(notation, f, indent=2, ensure_ascii=False)

    print(f"✅ Notes enregistrées dans {OUTPUT_PATH}")

if __name__ == "__main__":
    main()

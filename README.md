# MAQH – Application d’analyse et de notation d’actions (Electron)

MAQH est une application de bureau multiplateforme (macOS, Windows, Linux) construite avec Electron. Elle permet d’analyser et de noter des actions à partir de données distantes (Firestore/Firebase) synchronisées en local. L’interface offre une grille, une table d’évaluation/notation, des modales détaillées et des graphiques.

## Objectifs
- Récupérer les données de la BDD distante (Firestore) et les stocker localement pour un usage offline.
- Visualiser un univers d’actions (Euronext) avec recherche et filtres.
- Calculer une notation sur la base de conditions configurables.
- Ouvrir une fiche détaillée par valeur avec plusieurs onglets (Cours, Notation, Détail, etc.).

## Fonctionnalités principales
- Authentification Firebase (email/mot de passe).
- Synchronisation des sociétés Firestore → stockage local utilisateur.
- Grille d’actions avec pagination, mini‐graphes, variations par période (5J → MAX).
- Barre de recherche globale avec palette de commandes et filtres (secteur, note minimale).
- Table d’évaluation avec tri des notes et accès direct aux cartes.
- Fiche détaillée (modale) avec onglets « Cours », « Notation », « Détail ».
- Configuration des conditions de notation (fichier `config/configNotation.json` recopié dans l’espace utilisateur et modifiable).

## Prérequis
- Node.js ≥ 18
- npm ≥ 9
- Accès internet (Firebase + CDN Chart.js si non packagé autrement)

## Installation (développement)
1. Cloner le dépôt
2. Installer les dépendances

```bash
npm install
```

3. Démarrer l’application

```bash
npm start
```

Au premier lancement, ouvrez le panneau utilisateur (icône en haut à droite) pour vous connecter. Une fois connecté, utilisez le bouton « Mettre à jour les données locales » pour synchroniser les sociétés Firestore en local.

## Build (packaging)
Crée les artefacts pour votre OS via electron-builder.

```bash
# dossier dist/
npm run pack   # build non installable (dir)
npm run dist   # build installable (dmg/nsis/appimage selon l’OS)
```

Le binaire installé utilisera le stockage de l’utilisateur pour les données (et non les fichiers packagés en lecture seule).

### Installation « 1‑clic » (scripts)
- macOS/Linux:
  ```bash
  bash ./scripts/setup.sh --start         # démarrer en dev
  bash ./scripts/setup.sh --pack          # build non installable
  bash ./scripts/setup.sh --dist          # build installable
  ```
- Windows (PowerShell):
  ```powershell
  powershell -ExecutionPolicy Bypass -File .\scripts\setup.ps1 -Cmd start   # démarrer en dev
  powershell -ExecutionPolicy Bypass -File .\scripts\setup.ps1 -Cmd pack    # build non installable
  powershell -ExecutionPolicy Bypass -File .\scripts\setup.ps1 -Cmd dist    # build installable
  ```

## Structure des données
- Données packagées (lecture seule) – utiles comme repli initial:
  - `data/` (CSV Euronext, données Yahoo API par symbole, éventuels JSON de sociétés)
- Données utilisateur (lecture/écriture) – synchronisation Firestore:
  - macOS: `~/ .maqh_data/companies/euronext/*.json`
  - Windows/Linux: un dossier `~/.maqh_data/companies/euronext/*.json` est également utilisé
  - Accès via l’API preload `window.fileStorage`:
    - `saveJSON(name, data)`
    - `readCompanyJSON(name)`

## Firebase (client)
L’app initialise Firebase (App, Auth, Firestore) côté renderer via le SDK web et effectue la synchronisation par lots:
- Connexion → bouton « Mettre à jour les données locales » appelle `fetchUserData()`
- Pagination Firestore par ordre sur le champ `Name`.
- Écriture locale par nom de société (nom de fichier nettoyé, un JSON par société).

Paramètres Firebase: voir `src/main.js` pour l’initialisation du SDK.

## Configuration utilisateur
Une copie des fichiers de configuration « usine » est effectuée la première fois dans un espace utilisateur dédié:
- `config/config.json` → préférences UI: cards/page, période courante, etc.
- `config/configNotation.json` → paramètres des conditions de notation
- Accès via `window.configAPI` (preload):
  - `loadConfig()`, `saveConfig(config)`
  - `loadNotationConfig()`, `saveNotationConfig(config)`
  - `resetToFactoryConfig()`

## Flux de données « lecture »
- La grille et la notation tentent d’abord de lire le JSON société en local via `window.fileStorage.readCompanyJSON(name)`
- Si introuvable (avant première sync), repli sur `data/companies/euronext/{Name}.json` (fichiers packagés)

## Dépannage
- « Fichier introuvable » dans la modale
  - Synchronisez d’abord les données (bouton « Mettre à jour les données locales »)
  - Sinon, vérifiez que le nom de la société correspond bien à un fichier dans `data/companies/euronext` (repli)
- « Chart is not defined »
  - Vérifiez l’accès réseau à `cdn.jsdelivr.net`. En alternative, vous pouvez installer Chart.js via npm et l’importer sans CDN.
- IndexedDB/Quota/LOCK (logs Chromium)
  - Benin: relancer l’application. Ces messages n’affectent pas l’usage normal.
- Preload / accès disque (fs)
  - En dev, le preload a accès à `fs`. Pour un durcissement supplémentaire, il est possible de déplacer l’I/O disque côté process principal via IPC sécurisé (à planifier si nécessaire).

## Scripts npm
- `npm start` – lance Electron en dev
- `npm run pack` – build non installable
- `npm run dist` – build installable (dist/)

## Licence
MIT (à adapter au besoin)

```
maqh_V1
├─ .DS_Store
├─ .Rhistory
├─ MAQH_cahier_des_charges.pdf
├─ __pycache__
│  ├─ notation.cpython-311.pyc
│  └─ notation.cpython-38.pyc
├─ assets
│  ├─ .DS_Store
│  ├─ icon_maqh_white.png
│  ├─ maqh.icns
│  ├─ maqh.ico
│  ├─ maqh.png
│  ├─ maqh_1024x1024_1024x1024.icns
│  └─ maqh_512x512_512x512.icns
├─ check_condition10.py
├─ condition10_valides.csv
├─ config
│  ├─ config.json
│  └─ configNotation.json
├─ data
│  ├─ .DS_Store
│  ├─ EURONEXT_actions.csv
│  ├─ PER_sec.json
│  ├─ PE_vs_PER_sec.csv
│  ├─ companies
│  │  ├─ .DS_Store
│  │  └─ euronext
│  │     ├─ .DS_Store
│  │     ├─ 1000MERCIS.json
│  │     ├─ 2CRSI.json
│  │     ├─ A.S.T. GROUPE.json
│  │     ├─ AB SCIENCE.json
│  │     ├─ ABC ARBITRAGE.json
│  │     ├─ ABEO.json
│  │     ├─ ABIONYX PHARMA.json
│  │     ├─ ABIVAX.json
│  │     ├─ ABL Diagnostics.json
│  │     ├─ ABO GROUP.json
│  │     ├─ ACANTHE DEV..json
│  │     ├─ ACCOR.json
│  │     ├─ ACHETER-LOUER.FR.json
│  │     ├─ ACTEOS.json
│  │     ├─ ACTIA GROUP.json
│  │     ├─ ACTICOR BIOTECH.json
│  │     ├─ ACTIVIUM GROUP.json
│  │     ├─ ADC SIIC.json
│  │     ├─ ADEUNIS.json
│  │     ├─ ADOCIA.json
│  │     ├─ ADOMOS.json
│  │     ├─ ADP.json
│  │     ├─ ADUX.json
│  │     ├─ ADVICENNE.json
│  │     ├─ ADVINI.json
│  │     ├─ AELIS FARMA.json
│  │     ├─ AERKOMM INC.json
│  │     ├─ AFFLUENT MED BSAR.json
│  │     ├─ AFFLUENT MEDICAL.json
│  │     ├─ AFYREN.json
│  │     ├─ AG3I.json
│  │     ├─ AGENCE AUTO.json
│  │     ├─ AGP MALAGA SOCIMI.json
│  │     ├─ AGRIPOWER.json
│  │     ├─ AGROGENERATION.json
│  │     ├─ AIR FRANCE -KLM.json
│  │     ├─ AIR LIQUIDE.json
│  │     ├─ AIRBUS.json
│  │     ├─ AIRWELL.json
│  │     ├─ AKWEL.json
│  │     ├─ ALAN ALLMAN.json
│  │     ├─ ALCHIMIE.json
│  │     ├─ ALPES (COMPAGNIE).json
│  │     ├─ ALPHA MOS.json
│  │     ├─ ALSTOM.json
│  │     ├─ ALTAMIR.json
│  │     ├─ ALTAREA.json
│  │     ├─ ALTAREIT.json
│  │     ├─ ALTEN.json
│  │     ├─ ALTHEORA.json
│  │     ├─ ALVEEN.json
│  │     ├─ AMA CORPORATION.json
│  │     ├─ AMATHEON AGRI.json
│  │     ├─ AMOEBA.json
│  │     ├─ AMPLITUDE SURGICAL.json
│  │     ├─ AMUNDI.json
│  │     ├─ ANDINO GLOBAL.json
│  │     ├─ ANTIN INFRA PARTN.json
│  │     ├─ APERAM.json
│  │     ├─ APODACA INVERSIONE.json
│  │     ├─ AQUILA.json
│  │     ├─ ARAMIS GROUP.json
│  │     ├─ ARCELORMITTAL SA.json
│  │     ├─ ARCHOS.json
│  │     ├─ ARCURE.json
│  │     ├─ ARDOIN ST AMAND A.json
│  │     ├─ ARDOIN ST AMAND B.json
│  │     ├─ AREF THALASSA.json
│  │     ├─ ARGAN.json
│  │     ├─ ARIMELIA ITG.json
│  │     ├─ ARKEMA.json
│  │     ├─ AROCA DEL PINAR.json
│  │     ├─ ARTEA.json
│  │     ├─ ARTMARKET COM.json
│  │     ├─ ARTOIS NOM..json
│  │     ├─ ARVERNE GROUP.json
│  │     ├─ ARVERNE WARRANT.json
│  │     ├─ ASHLER ET MANSON.json
│  │     ├─ ASSYSTEM.json
│  │     ├─ ASTICKSO XXI.json
│  │     ├─ ATARI.json
│  │     ├─ ATEME.json
│  │     ├─ ATLAND.json
│  │     ├─ ATON.json
│  │     ├─ ATOS.json
│  │     ├─ AUBAY.json
│  │     ├─ AUDACIA.json
│  │     ├─ AUGROS COSMETICS.json
│  │     ├─ AUPLATA MINING GR.json
│  │     ├─ AUREA.json
│  │     ├─ AURES TECHNOLOGIES.json
│  │     ├─ AVENIR TELECOM.json
│  │     ├─ AVENTADOR.json
│  │     ├─ AXA.json
│  │     ├─ AXWAY SOFTWARE.json
│  │     ├─ AYVENS.json
│  │     ├─ AZ LEASING.json
│  │     ├─ AZOREAN TECH.json
│  │     ├─ BAIKOWSKI.json
│  │     ├─ BAINS MER MONACO.json
│  │     ├─ BALYO.json
│  │     ├─ BARBARA BUI.json
│  │     ├─ BARINGS CORE SPAIN.json
│  │     ├─ BASSAC.json
│  │     ├─ BASTIDE LE CONFORT.json
│  │     ├─ BD MULTI MEDIA.json
│  │     ├─ BEACONSMIND.json
│  │     ├─ BEBO HEALTH.json
│  │     ├─ BELIEVE.json
│  │     ├─ BENETEAU.json
│  │     ├─ BERNARD LOISEAU.json
│  │     ├─ BIC.json
│  │     ├─ BIGBEN INTERACTIVE.json
│  │     ├─ BILENDI.json
│  │     ├─ BIO-UV GROUP.json
│  │     ├─ BIOMERIEUX.json
│  │     ├─ BIOPHYTIS BSA.json
│  │     ├─ BIOPHYTIS.json
│  │     ├─ BIOSENIC.json
│  │     ├─ BIOSYNEX.json
│  │     ├─ BLEECKER.json
│  │     ├─ BLUE SHARK POWER.json
│  │     ├─ BLUELINEA.json
│  │     ├─ BNP PARIBAS ACT.A.json
│  │     ├─ BOA CONCEPT.json
│  │     ├─ BODY ONE.json
│  │     ├─ BOIRON.json
│  │     ├─ BOLLORE.json
│  │     ├─ BONDUELLE.json
│  │     ├─ BONYF.json
│  │     ├─ BOOSTHEAT.json
│  │     ├─ BOURRELIER GROUP.json
│  │     ├─ BOURSE DIRECT.json
│  │     ├─ BOUYGUES.json
│  │     ├─ BROADPEAK.json
│  │     ├─ BUREAU VERITAS.json
│  │     ├─ BURELLE.json
│  │     ├─ CA TOULOUSE 31 CCI.json
│  │     ├─ CABASSE.json
│  │     ├─ CAFOM.json
│  │     ├─ CAMBODGE NOM..json
│  │     ├─ CAPELLI.json
│  │     ├─ CAPGEMINI.json
│  │     ├─ CARBIOS.json
│  │     ├─ CARMAT.json
│  │     ├─ CARMILA.json
│  │     ├─ CARPINIENNE PART..json
│  │     ├─ CARREFOUR.json
│  │     ├─ CASINO BSA1.json
│  │     ├─ CASINO BSA3.json
│  │     ├─ CASINO GUICHARD.json
│  │     ├─ CATANA GROUP.json
│  │     ├─ CATERING INTL SCES.json
│  │     ├─ CBI BSA A.json
│  │     ├─ CBI BSA B.json
│  │     ├─ CBI.json
│  │     ├─ CBO TERRITORIA.json
│  │     ├─ CEGEDIM.json
│  │     ├─ CELLECTIS.json
│  │     ├─ CELYAD ONCOLOGY.json
│  │     ├─ CERINNOV GROUP.json
│  │     ├─ CFI.json
│  │     ├─ CFM INDOSUEZWEALTH.json
│  │     ├─ CH.FER DEPARTEMENT.json
│  │     ├─ CH.FER VAR GARD N..json
│  │     ├─ CHARGEURS.json
│  │     ├─ CHARWOOD ENERGY.json
│  │     ├─ CHAUSSERIA.json
│  │     ├─ CHEOPS TECHNOLOGY.json
│  │     ├─ CHRISTIAN DIOR.json
│  │     ├─ CIBOX INTER A CTIV.json
│  │     ├─ CIE DU MONT BLANC.json
│  │     ├─ CLARANOVA.json
│  │     ├─ CLARIANE.json
│  │     ├─ CLASQUIN.json
│  │     ├─ CMG CLEANTECH.json
│  │     ├─ CNOVA.json
│  │     ├─ COFACE.json
│  │     ├─ COFIDUR.json
│  │     ├─ COGELEC.json
│  │     ├─ COGRA.json
│  │     ├─ COHERIS.json
│  │     ├─ COIL.json
│  │     ├─ COLIPAYS.json
│  │     ├─ COMPAGNIE ODET.json
│  │     ├─ CONDOR TECHNOLOG.json
│  │     ├─ CONSORT NT.json
│  │     ├─ CONSTRUCTEURS BOIS.json
│  │     ├─ CORE SPAIN HOLDCO.json
│  │     ├─ COREP LIGHTING.json
│  │     ├─ CORETECH 5.json
│  │     ├─ COTY.json
│  │     ├─ COURBET.json
│  │     ├─ COURTOIS.json
│  │     ├─ COVIVIO HOTELS.json
│  │     ├─ COVIVIO.json
│  │     ├─ CRCAM ALP.PROV.CCI.json
│  │     ├─ CRCAM ATL.VEND.CCI.json
│  │     ├─ CRCAM BRIE PIC2CCI.json
│  │     ├─ CRCAM ILLE-VIL.CCI.json
│  │     ├─ CRCAM LANGUED CCI.json
│  │     ├─ CRCAM LOIRE HTE L..json
│  │     ├─ CRCAM MORBIHAN CCI.json
│  │     ├─ CRCAM NORD CCI.json
│  │     ├─ CRCAM NORM.SEINE.json
│  │     ├─ CRCAM PARIS ET IDF.json
│  │     ├─ CRCAM SUD R.A.CCI.json
│  │     ├─ CRCAM TOURAINE CCI.json
│  │     ├─ CREDIT AGRICOLE.json
│  │     ├─ CROSSJECT.json
│  │     ├─ CROSSWOOD.json
│  │     ├─ CYBERGUN BSA K1.json
│  │     ├─ CYBERGUN BSA K2A.json
│  │     ├─ CYBERGUN BSA K2B.json
│  │     ├─ CYBERGUN.json
│  │     ├─ D.L.S.I..json
│  │     ├─ DAMARIS.json
│  │     ├─ DAMARTEX.json
│  │     ├─ DANONE.json
│  │     ├─ DASSAULT AVIATION.json
│  │     ├─ DASSAULT SYSTEMES.json
│  │     ├─ DBT.json
│  │     ├─ DBV TECHNOLOGIES.json
│  │     ├─ DEEZER WARRANTS.json
│  │     ├─ DEEZER.json
│  │     ├─ DEKUPLE.json
│  │     ├─ DELFINGEN.json
│  │     ├─ DELTA PLUS GROUP.json
│  │     ├─ DERICHEBOURG.json
│  │     ├─ DEVERNOIS.json
│  │     ├─ DIAGNOSTIC MED BSA.json
│  │     ├─ DIAGNOSTIC MEDICAL.json
│  │     ├─ DNXCORP.json
│  │     ├─ DOCK.PETR.AMBES AM.json
│  │     ├─ DOLFINES.json
│  │     ├─ DONTNOD.json
│  │     ├─ DRONE VOLT BS26.json
│  │     ├─ DRONE VOLT.json
│  │     ├─ DYNAFOND.json
│  │     ├─ DYNEX ENERGY SA.json
│  │     ├─ E PANGO.json
│  │     ├─ EAGLEFOOTBALLGROUP.json
│  │     ├─ EASSON HOLDINGS.json
│  │     ├─ EAUX DE ROYAN.json
│  │     ├─ EAVS.json
│  │     ├─ ECOLUTIONS.json
│  │     ├─ ECOMIAM.json
│  │     ├─ ECOSLOPS.json
│  │     ├─ EDENRED.json
│  │     ├─ EDILIZIACROBATICA.json
│  │     ├─ EDITIONS DU SIGNE.json
│  │     ├─ EDUFORM ACTION.json
│  │     ├─ EDUNIVERSAL.json
│  │     ├─ EGIDE.json
│  │     ├─ EIFFAGE.json
│  │     ├─ EKINOPS.json
│  │     ├─ ELEC.STRASBOURG.json
│  │     ├─ ELECT. MADAGASCAR.json
│  │     ├─ ELIOR GROUP.json
│  │     ├─ ELIS.json
│  │     ├─ ELIX.json
│  │     ├─ EMBENTION.json
│  │     ├─ EMEIS BSA.json
│  │     ├─ EMEIS.json
│  │     ├─ EMOVA GROUP.json
│  │     ├─ ENCRES DUBUIT.json
│  │     ├─ ENENSYS.json
│  │     ├─ ENERGISME.json
│  │     ├─ ENERTIME.json
│  │     ├─ ENGIE.json
│  │     ├─ ENOGIA.json
│  │     ├─ ENTECH.json
│  │     ├─ ENTREPARTICULIERS.json
│  │     ├─ ENTREPRENDRE.json
│  │     ├─ EO2.json
│  │     ├─ EQUASENS.json
│  │     ├─ ERAMET.json
│  │     ├─ ESKER.json
│  │     ├─ ESSILORLUXOTTICA.json
│  │     ├─ ESSO.json
│  │     ├─ EURASIA FONC INV.json
│  │     ├─ EURASIA GROUPE.json
│  │     ├─ EURAZEO.json
│  │     ├─ EUROAPI.json
│  │     ├─ EUROBIO-SCIENTIFIC.json
│  │     ├─ EUROFINS CEREP.json
│  │     ├─ EUROFINS SCIENT..json
│  │     ├─ EUROLAND CORPORATE.json
│  │     ├─ EUROLOG CANOLA.json
│  │     ├─ EURONEXT.json
│  │     ├─ EUROPACORP.json
│  │     ├─ EUROPLASMA.json
│  │     ├─ EUTELSAT COMMUNIC..json
│  │     ├─ EVERGREEN.json
│  │     ├─ EXACOMPTA CLAIREF..json
│  │     ├─ EXAIL TECHNOLOGIES.json
│  │     ├─ EXCLUSIVE NETWORKS.json
│  │     ├─ EXEL INDUSTRIES.json
│  │     ├─ EXOSENS.json
│  │     ├─ EXPLOSIFS PROD.CHI.json
│  │     ├─ European Medical S.json
│  │     ├─ FACEPHI.json
│  │     ├─ FAIFEY INVEST.json
│  │     ├─ FASHION B AIR.json
│  │     ├─ FAYENC.SARREGUEMI..json
│  │     ├─ FD.json
│  │     ├─ FDJ.json
│  │     ├─ FERM.CAS.MUN.CANNE.json
│  │     ├─ FERMENTALG.json
│  │     ├─ FIDUCIAL OFF.SOL..json
│  │     ├─ FIDUCIAL REAL EST..json
│  │     ├─ FIGEAC AERO.json
│  │     ├─ FILL UP MEDIA.json
│  │     ├─ FIN.OUEST AFRICAIN.json
│  │     ├─ FINANCIERE MARJOS.json
│  │     ├─ FINATIS.json
│  │     ├─ FINAXO.json
│  │     ├─ FIPP.json
│  │     ├─ FIRSTCAUTION.json
│  │     ├─ FLEURY MICHON.json
│  │     ├─ FLORENTAISE.json
│  │     ├─ FNAC DARTY.json
│  │     ├─ FNPTECHNOLOGIESSA.json
│  │     ├─ FONCIERE 7 INVEST.json
│  │     ├─ FONCIERE EURIS.json
│  │     ├─ FONCIERE INEA.json
│  │     ├─ FONCIERE LYONNAISE.json
│  │     ├─ FONCIERE VINDI.json
│  │     ├─ FONCIERE VOLTA.json
│  │     ├─ FORESTIERE EQUAT..json
│  │     ├─ FORSEE POWER.json
│  │     ├─ FORVIA.json
│  │     ├─ FOUNTAINE PAJOT.json
│  │     ├─ FRANCAISE ENERGIE.json
│  │     ├─ FRANCE SOIR GROUPE.json
│  │     ├─ FRANCE TOURISME.json
│  │     ├─ FREELANCE.COM.json
│  │     ├─ FREY.json
│  │     ├─ G.A.I..json
│  │     ├─ GALEO.json
│  │     ├─ GALIMMO.json
│  │     ├─ GASCOGNE.json
│  │     ├─ GAUMONT.json
│  │     ├─ GAUSSIN.json
│  │     ├─ GEA GRENOBL.ELECT..json
│  │     ├─ GECI INTL.json
│  │     ├─ GECINA.json
│  │     ├─ GENEURO.json
│  │     ├─ GENFIT.json
│  │     ├─ GENOWAY.json
│  │     ├─ GENSIGHT BIOLOGICS.json
│  │     ├─ GENTLEMENS EQUITY.json
│  │     ├─ GETLINK SE.json
│  │     ├─ GEVELOT.json
│  │     ├─ GL EVENTS.json
│  │     ├─ GLASS TO POWER A.json
│  │     ├─ GLASS TO POWER B.json
│  │     ├─ GLASS TO POWER WAR.json
│  │     ├─ GLOBAL BIOENERGIES.json
│  │     ├─ GLOBAL PIELAGO.json
│  │     ├─ GOLD BY GOLD.json
│  │     ├─ GPE GROUP PIZZORNO.json
│  │     ├─ GPE PAROT (AUTO).json
│  │     ├─ GRAINES VOLTZ.json
│  │     ├─ GROLLEAU.json
│  │     ├─ GROUPE BERKEM.json
│  │     ├─ GROUPE CARNIVOR.json
│  │     ├─ GROUPE CRIT.json
│  │     ├─ GROUPE ETPO.json
│  │     ├─ GROUPE GUILLIN.json
│  │     ├─ GROUPE JAJ.json
│  │     ├─ GROUPE LDLC.json
│  │     ├─ GROUPE OKWIND.json
│  │     ├─ GROUPE PARTOUCHE.json
│  │     ├─ GROUPE PLUS-VALUES.json
│  │     ├─ GROUPE SFPI.json
│  │     ├─ GROUPE TERA.json
│  │     ├─ GROUPIMO.json
│  │     ├─ GRUPO WHITENI.json
│  │     ├─ GTT.json
│  │     ├─ GUANDAO PUER INVES.json
│  │     ├─ GUERBET.json
│  │     ├─ GUILLEMOT.json
│  │     ├─ HAFFNER ENERGY.json
│  │     ├─ HAMILTON GLOBAL OP.json
│  │     ├─ HAULOTTE GROUP.json
│  │     ├─ HDF.json
│  │     ├─ HEALTHCARE ACTIVOS.json
│  │     ├─ HERIGE.json
│  │     ├─ HERMES INTL.json
│  │     ├─ HEXAOM.json
│  │     ├─ HF COMPANY.json
│  │     ├─ HIGH CO.json
│  │     ├─ HIPAY GROUP.json
│  │     ├─ HITECHPROS.json
│  │     ├─ HK.json
│  │     ├─ HOCHE BAINS L.BAIN.json
│  │     ├─ HOFFMANN.json
│  │     ├─ HOME CONCEPT.json
│  │     ├─ HOPENING.json
│  │     ├─ HOPIUM.json
│  │     ├─ HOPSCOTCH GROUPE.json
│  │     ├─ HOT.MAJESTIC CANNE.json
│  │     ├─ HOTELES BESTPRICE.json
│  │     ├─ HOTELIM.json
│  │     ├─ HOTELS DE PARIS.json
│  │     ├─ HOTL.IMMOB.NICE.json
│  │     ├─ HUNYVERS.json
│  │     ├─ HYDRAULIQUE PB.json
│  │     ├─ HYDRO-EXPLOIT..json
│  │     ├─ HYDROGEN REFUELING.json
│  │     ├─ I.CERAM.json
│  │     ├─ I2S.json
│  │     ├─ IANTE INVESTMENTS.json
│  │     ├─ ICADE.json
│  │     ├─ ICAPE HOLDING.json
│  │     ├─ ID LOGISTICS GROUP.json
│  │     ├─ IDI.json
│  │     ├─ IDS.json
│  │     ├─ IDSUD.json
│  │     ├─ IGIS NEPTUNE.json
│  │     ├─ IKONISYS.json
│  │     ├─ ILBE.json
│  │     ├─ IMALLIANCE.json
│  │     ├─ IMEON ENERGY.json
│  │     ├─ IMERYS.json
│  │     ├─ IMM.PARIS.PERLE.json
│  │     ├─ IMMERSION.json
│  │     ├─ IMMOB.DASSAULT.json
│  │     ├─ IMPLANET.json
│  │     ├─ IMPRIMERIE CHIRAT.json
│  │     ├─ IMPULSE FITNESS.json
│  │     ├─ INFOCLIP.json
│  │     ├─ INFOTEL.json
│  │     ├─ INMARK.json
│  │     ├─ INMOSUPA.json
│  │     ├─ INNATE PHARMA.json
│  │     ├─ INNELEC MULTIMEDIA.json
│  │     ├─ INNOVATIVE RFK SPA.json
│  │     ├─ INSTALLUX.json
│  │     ├─ INTEGRAGEN.json
│  │     ├─ INTEGRITAS VIAGER.json
│  │     ├─ INTERPARFUMS.json
│  │     ├─ INTEXA.json
│  │     ├─ INTRASENSE.json
│  │     ├─ INVENTIVA.json
│  │     ├─ INVIBES ADVERTSING.json
│  │     ├─ IPOSA PROPERTIES.json
│  │     ├─ IPSEN.json
│  │     ├─ IPSOS.json
│  │     ├─ ISPD.json
│  │     ├─ IT LINK.json
│  │     ├─ ITALY INNOVAZIONI.json
│  │     ├─ JACQUES BOGART.json
│  │     ├─ JACQUET METALS.json
│  │     ├─ JCDECAUX.json
│  │     ├─ JUNGLE21.json
│  │     ├─ KALRAY.json
│  │     ├─ KAUFMAN ET BROAD.json
│  │     ├─ KERING.json
│  │     ├─ KERLINK.json
│  │     ├─ KEYRUS.json
│  │     ├─ KKO INTERNATIONAL.json
│  │     ├─ KLARSEN.json
│  │     ├─ KLEA HOLDING.json
│  │     ├─ KLEPIERRE.json
│  │     ├─ KOMPUESTOS.json
│  │     ├─ KUMULUS VAPE.json
│  │     ├─ L'OREAL.json
│  │     ├─ LA PERLA FASHION.json
│  │     ├─ LABO EUROMEDIS.json
│  │     ├─ LACROIX GROUP.json
│  │     ├─ LAGARDERE SA.json
│  │     ├─ LANSON-BCC.json
│  │     ├─ LARGO.json
│  │     ├─ LATECOERE.json
│  │     ├─ LAURENT-PERRIER.json
│  │     ├─ LDC.json
│  │     ├─ LEBON.json
│  │     ├─ LECTRA.json
│  │     ├─ LEGRAND.json
│  │     ├─ LEPERMISLIBRE.json
│  │     ├─ LES HOTELS BAVEREZ.json
│  │     ├─ LEXIBOOK LINGUIST..json
│  │     ├─ LHYFE.json
│  │     ├─ LINEDATA SERVICES.json
│  │     ├─ LISI.json
│  │     ├─ LLAMA GROUP.json
│  │     ├─ LLEIDA.json
│  │     ├─ LNA SANTE.json
│  │     ├─ LOCASYSTEM INTL.json
│  │     ├─ LOGIC INSTRUMENT.json
│  │     ├─ LOMBARD ET MEDOT.json
│  │     ├─ LUCIBEL.json
│  │     ├─ LUMIBIRD.json
│  │     ├─ LVMH.json
│  │     ├─ M.R.M.json
│  │     ├─ M2I.json
│  │     ├─ MAAT PHARMA.json
│  │     ├─ MACOMPTA.FR.json
│  │     ├─ MADE.json
│  │     ├─ MAGILLEM.json
│  │     ├─ MAIS.ANTOINE BAUD.json
│  │     ├─ MAISON CLIO BLUE.json
│  │     ├─ MAISONS DU MONDE.json
│  │     ├─ MAKING SCIENCE.json
│  │     ├─ MALTERIES FCO-BEL..json
│  │     ├─ MANITOU BF.json
│  │     ├─ MAQ ADMON. URBANAS.json
│  │     ├─ MARE NOSTRUM.json
│  │     ├─ MAROC TELECOM.json
│  │     ├─ MASTRAD BS29.json
│  │     ├─ MASTRAD.json
│  │     ├─ MAUNA KEA TECH.json
│  │     ├─ MAUREL ET PROM.json
│  │     ├─ MBWS.json
│  │     ├─ MCPHY ENERGY.json
│  │     ├─ MEDESIS PHARMA.json
│  │     ├─ MEDIA 6.json
│  │     ├─ MEDIA LAB.json
│  │     ├─ MEDIANTECHNOLOGIES.json
│  │     ├─ MEDINCELL.json
│  │     ├─ MEMSCAP REGPT.json
│  │     ├─ MERCIALYS.json
│  │     ├─ MERIDIA RE IV.json
│  │     ├─ MERSEN.json
│  │     ├─ METABOLIC EXPLORER.json
│  │     ├─ METALLIANCE.json
│  │     ├─ METAVISIO.json
│  │     ├─ METHANOR.json
│  │     ├─ METRICS IN BALANCE.json
│  │     ├─ METROPOLE TV.json
│  │     ├─ MEXEDIA.json
│  │     ├─ MG INTERNATIONAL.json
│  │     ├─ MGI DIGITAL GRAPHI.json
│  │     ├─ MICHELIN.json
│  │     ├─ MICROPOLE.json
│  │     ├─ MIGUET ET ASSOCIES.json
│  │     ├─ MILIBOO.json
│  │     ├─ MINT.json
│  │     ├─ MON COURTIER ENERG.json
│  │     ├─ MONCEY (FIN.) NOM..json
│  │     ├─ MONTEA.json
│  │     ├─ MONTEPINO LOGISTIC.json
│  │     ├─ MOULINVEST.json
│  │     ├─ MR BRICOLAGE.json
│  │     ├─ MUNIC.json
│  │     ├─ MUTTER VENTURES.json
│  │     ├─ MYHOTELMATCH.json
│  │     ├─ NACON.json
│  │     ├─ NAMR.json
│  │     ├─ NANOBIOTIX.json
│  │     ├─ NEOEN.json
│  │     ├─ NEOLIFE.json
│  │     ├─ NEOVACS.json
│  │     ├─ NETGEM.json
│  │     ├─ NETMEDIA GROUP.json
│  │     ├─ NEURONES.json
│  │     ├─ NEXANS.json
│  │     ├─ NEXITY.json
│  │     ├─ NEXTEDIA.json
│  │     ├─ NFL BIOSCIENCES.json
│  │     ├─ NHOA.json
│  │     ├─ NICOX BSA.json
│  │     ├─ NICOX.json
│  │     ├─ NOKIA.json
│  │     ├─ NORTEM BIOGROUP.json
│  │     ├─ NOVACYT.json
│  │     ├─ NOVATECH IND..json
│  │     ├─ NR21.json
│  │     ├─ NRJ GROUP.json
│  │     ├─ NSC GROUPE.json
│  │     ├─ NSE.json
│  │     ├─ OBIZ.json
│  │     ├─ OCTOPUS BIOSAFETY.json
│  │     ├─ OENEO.json
│  │     ├─ OK PROPERTIES.json
│  │     ├─ OMER-DECUGIS & CIE.json
│  │     ├─ ONCODESIGN PM.json
│  │     ├─ ONE EXPERIENCE.json
│  │     ├─ ONLINEFORMAPRO.json
│  │     ├─ OPMOBILITY.json
│  │     ├─ ORANGE.json
│  │     ├─ ORAPI.json
│  │     ├─ ORBIS PROPERTIES.json
│  │     ├─ ORDISSIMO.json
│  │     ├─ OREGE.json
│  │     ├─ ORINOQUIA.json
│  │     ├─ OSE IMMUNO.json
│  │     ├─ OSMOSUN.json
│  │     ├─ OVH.json
│  │     ├─ PACTE NOVATION.json
│  │     ├─ PAREF.json
│  │     ├─ PARROT.json
│  │     ├─ PART.INDLES MINI..json
│  │     ├─ PARX MATERIALS NV.json
│  │     ├─ PASSAT.json
│  │     ├─ PATRIMOINE ET COMM.json
│  │     ├─ PAULIC MEUNERIE.json
│  │     ├─ PERNOD RICARD.json
│  │     ├─ PERRIER (GERARD).json
│  │     ├─ PERSEIDA RENTA.json
│  │     ├─ PET SERVICE.json
│  │     ├─ PEUGEOT INVEST.json
│  │     ├─ PHARNEXT.json
│  │     ├─ PHAXIAM Tx.json
│  │     ├─ PHONE WEB.json
│  │     ├─ PHOTONIKE CAPITAL.json
│  │     ├─ PIERRE VAC BSA ACT.json
│  │     ├─ PIERRE VAC BSA CRE.json
│  │     ├─ PIERRE VACANCES.json
│  │     ├─ PISCINES DESJOYAUX.json
│  │     ├─ PLACOPLATRE.json
│  │     ├─ PLANISWARE.json
│  │     ├─ PLANT ADVANCED BS.json
│  │     ├─ PLANT ADVANCED.json
│  │     ├─ PLAST.VAL LOIRE.json
│  │     ├─ PLUXEE.json
│  │     ├─ POUJOULAT.json
│  │     ├─ POULAILLON.json
│  │     ├─ POXEL.json
│  │     ├─ PRECIA.json
│  │     ├─ PREDILIFE.json
│  │     ├─ PRISMAFLEX INTL.json
│  │     ├─ PROACTIS SA.json
│  │     ├─ PRODWARE.json
│  │     ├─ PRODWAYS.json
│  │     ├─ PROLOGUE BSA.json
│  │     ├─ PROLOGUE.json
│  │     ├─ PROP.IMMEUBLES.json
│  │     ├─ PUBLICIS GROUPE SA.json
│  │     ├─ PULLUP ENTERTAIN.json
│  │     ├─ QUADIENT.json
│  │     ├─ QUADPACK.json
│  │     ├─ QUANTUM GENOMICS.json
│  │     ├─ QWAMPLIFY.json
│  │     ├─ RACING FORCE.json
│  │     ├─ RALLYE.json
│  │     ├─ RAMSAY GEN SANTE.json
│  │     ├─ RAPID NUTRITION.json
│  │     ├─ REALITES.json
│  │     ├─ REMY COINTREAU.json
│  │     ├─ RENAULT.json
│  │     ├─ RES GESTAE SOCIMI.json
│  │     ├─ REWORLD MEDIA.json
│  │     ├─ REXEL.json
│  │     ├─ RIBER.json
│  │     ├─ ROBERTET CDV 87.json
│  │     ├─ ROBERTET CI.json
│  │     ├─ ROBERTET.json
│  │     ├─ ROCHE BOBOIS.json
│  │     ├─ ROCTOOL BSA 2020-2.json
│  │     ├─ ROCTOOL.json
│  │     ├─ ROUGIER S.A..json
│  │     ├─ RUBIS.json
│  │     ├─ S.E.B..json
│  │     ├─ SAFE.json
│  │     ├─ SAFRAN.json
│  │     ├─ SAGAX REAL ESTATE.json
│  │     ├─ SAINT GOBAIN.json
│  │     ├─ SAINT JEAN GROUPE.json
│  │     ├─ SAMSE.json
│  │     ├─ SANOFI.json
│  │     ├─ SAPMER.json
│  │     ├─ SARTORIUS STED BIO.json
│  │     ├─ SAVENCIA.json
│  │     ├─ SAVONNERIE NYONS.json
│  │     ├─ SCBSM.json
│  │     ├─ SCEMI.json
│  │     ├─ SCHNEIDER ELECTRIC.json
│  │     ├─ SCIENTIA SCHOOL.json
│  │     ├─ SCOR SE.json
│  │     ├─ SECHE ENVIRONNEM..json
│  │     ├─ SEGRO PLC.json
│  │     ├─ SEIF SPA.json
│  │     ├─ SELCODIS.json
│  │     ├─ SELECTIRENTE.json
│  │     ├─ SEMPLICEMENTE SpA.json
│  │     ├─ SENSORION.json
│  │     ├─ SEQUA PETROLEUM NV.json
│  │     ├─ SERGEFERRARI GROUP.json
│  │     ├─ SES.json
│  │     ├─ SHOWROOMPRIVE.json
│  │     ├─ SIDETRADE.json
│  │     ├─ SIGNAUX GIROD.json
│  │     ├─ SILC.json
│  │     ├─ SIRIUS MEDIA.json
│  │     ├─ SMAIO.json
│  │     ├─ SMALTO BSA.json
│  │     ├─ SMALTO.json
│  │     ├─ SMART GOOD THINGS.json
│  │     ├─ SMCP.json
│  │     ├─ SMTPC.json
│  │     ├─ SOC FRANC CASINOS.json
│  │     ├─ SOCIETE GENERALE.json
│  │     ├─ SODEXO.json
│  │     ├─ SODITECH.json
│  │     ├─ SOGECLAIR.json
│  │     ├─ SOITEC.json
│  │     ├─ SOLOCAL GROUP.json
│  │     ├─ SOLUTIONS 30 SE.json
│  │     ├─ SOLVAY.json
│  │     ├─ SOPRA STERIA GROUP.json
│  │     ├─ SPARTOO.json
│  │     ├─ SPEED RABBIT PIZZA.json
│  │     ├─ SPIE.json
│  │     ├─ SPINEGUARD.json
│  │     ├─ SPINEWAY.json
│  │     ├─ SQLI.json
│  │     ├─ ST DUPONT.json
│  │     ├─ STEF.json
│  │     ├─ STELLANTIS NV.json
│  │     ├─ STIF.json
│  │     ├─ STMICROELECTRONICS.json
│  │     ├─ STRADIM ESPAC.FIN.json
│  │     ├─ STREAMWIDE BS25-2.json
│  │     ├─ STREAMWIDE BS25.json
│  │     ├─ STREAMWIDE.json
│  │     ├─ STREIT MECANIQUE.json
│  │     ├─ SUMO RESOURCES PLC.json
│  │     ├─ SWORD GROUP.json
│  │     ├─ SYENSQO.json
│  │     ├─ SYNERGIE.json
│  │     ├─ TARKETT.json
│  │     ├─ TATATU.json
│  │     ├─ TAYNINH.json
│  │     ├─ TECHNIP ENERGIES.json
│  │     ├─ TELEPERFORMANCE.json
│  │     ├─ TELEVERBIER.json
│  │     ├─ TELEVISTA.json
│  │     ├─ TERACT BS.json
│  │     ├─ TERACT.json
│  │     ├─ TF1.json
│  │     ├─ TFF GROUP.json
│  │     ├─ THALES.json
│  │     ├─ THE AZUR SELECTION.json
│  │     ├─ THE BLOCKCHAIN GP.json
│  │     ├─ THERACLION.json
│  │     ├─ THERANEXUS.json
│  │     ├─ THERAVET.json
│  │     ├─ THERMADOR GROUPE.json
│  │     ├─ TIKEHAU CAPITAL.json
│  │     ├─ TITAN CEMENT.json
│  │     ├─ TME PHARMA BSA Z.json
│  │     ├─ TME PHARMA.json
│  │     ├─ TONNER DRONES BSA.json
│  │     ├─ TONNER DRONES.json
│  │     ├─ TOOLUX SANDING.json
│  │     ├─ TOOSLA.json
│  │     ├─ TOTALENERGIES.json
│  │     ├─ TOUAX.json
│  │     ├─ TOUR EIFFEL.json
│  │     ├─ TRAMWAYS DE ROUEN.json
│  │     ├─ TRANSGENE.json
│  │     ├─ TRIGANO.json
│  │     ├─ TRILOGIQ.json
│  │     ├─ TROC ILE.json
│  │     ├─ TRONICS.json
│  │     ├─ TXCOM.json
│  │     ├─ TotalEnergiesGabon.json
│  │     ├─ U10 CORP.json
│  │     ├─ UBISOFT ENTERTAIN.json
│  │     ├─ UCAPITAL GLOBAL.json
│  │     ├─ UMALIS GROUP.json
│  │     ├─ UNIBAIL-RODAMCO-WE.json
│  │     ├─ UNIBEL.json
│  │     ├─ UNION TECH.INFOR..json
│  │     ├─ UNITI.json
│  │     ├─ UPERGY.json
│  │     ├─ URCOLESA.json
│  │     ├─ UV GERMI.json
│  │     ├─ VALBIOTIS.json
│  │     ├─ VALEO.json
│  │     ├─ VALERIO TX.json
│  │     ├─ VALLOUREC BSA 21.json
│  │     ├─ VALLOUREC.json
│  │     ├─ VALNEVA.json
│  │     ├─ VANDOR REAL ESTATE.json
│  │     ├─ VANTIVA BSA 2024.json
│  │     ├─ VANTIVA.json
│  │     ├─ VAZIVA.json
│  │     ├─ VENTE UNIQUE.COM.json
│  │     ├─ VEOLIA ENVIRON..json
│  │     ├─ VEOM GROUP.json
│  │     ├─ VERALLIA.json
│  │     ├─ VERGNET.json
│  │     ├─ VERIMATRIX.json
│  │     ├─ VERNEY CARRON.json
│  │     ├─ VERSITY.json
│  │     ├─ VETOQUINOL.json
│  │     ├─ VIALIFE.json
│  │     ├─ VICAT.json
│  │     ├─ VIEL ET COMPAGNIE.json
│  │     ├─ VINCI.json
│  │     ├─ VINPAI.json
│  │     ├─ VIRBAC.json
│  │     ├─ VIRIDIEN.json
│  │     ├─ VIRTUALWARE.json
│  │     ├─ VITURA.json
│  │     ├─ VIVENDI SE.json
│  │     ├─ VOGO.json
│  │     ├─ VOLTALIA.json
│  │     ├─ VOYAGEURS DU MONDE.json
│  │     ├─ VRANKEN-POMMERY.json
│  │     ├─ VREF SEVILLE.json
│  │     ├─ VusionGroup.json
│  │     ├─ WAGA ENERGY.json
│  │     ├─ WALLIX.json
│  │     ├─ WAVESTONE.json
│  │     ├─ WE.CONNECT.json
│  │     ├─ WEACCESS GROUP.json
│  │     ├─ WEDIA.json
│  │     ├─ WELL.json
│  │     ├─ WENDEL.json
│  │     ├─ WEYA.json
│  │     ├─ WINFARM.json
│  │     ├─ WITBE.json
│  │     ├─ WIZIBOAT.json
│  │     ├─ WORLDLINE.json
│  │     ├─ X-FAB.json
│  │     ├─ XILAM ANIMATION.json
│  │     ├─ ZCCM.json
│  │     └─ ZCI LIMITED.json
│  ├─ notation
│  │  └─ note.json
│  ├─ stock_data_all.json
│  └─ yahoo_api
│     ├─ AAA.json
│     ├─ AB.json
│     ├─ ABCA.json
│     ├─ ABEO.json
│     ├─ ABLD.json
│     ├─ ABNX.json
│     ├─ ABO.json
│     ├─ ABVX.json
│     ├─ AC.json
│     ├─ ACA.json
│     ├─ ACAN.json
│     ├─ ADOC.json
│     ├─ ADP.json
│     ├─ AELIS.json
│     ├─ AF.json
│     ├─ AFMBS.json
│     ├─ AFME.json
│     ├─ AI.json
│     ├─ AIR.json
│     ├─ AKE.json
│     ├─ AKOM.json
│     ├─ AKW.json
│     ├─ AL2SI.json
│     ├─ ALACT.json
│     ├─ ALADO.json
│     ├─ ALAFY.json
│     ├─ ALAGO.json
│     ├─ ALAGP.json
│     ├─ ALAGR.json
│     ├─ ALAIR.json
│     ├─ ALALO.json
│     ├─ ALAMA.json
│     ├─ ALAMG.json
│     ├─ ALAQU.json
│     ├─ ALARF.json
│     ├─ ALAST.json
│     ├─ ALATA.json
│     ├─ ALATI.json
│     ├─ ALAUD.json
│     ├─ ALAUR.json
│     ├─ ALAVE.json
│     ├─ ALAVI.json
│     ├─ ALBDM.json
│     ├─ ALBFR.json
│     ├─ ALBI.json
│     ├─ ALBIO.json
│     ├─ ALBIZ.json
│     ├─ ALBKK.json
│     ├─ ALBLD.json
│     ├─ ALBLU.json
│     ├─ ALBOA.json
│     ├─ ALBON.json
│     ├─ ALBOO.json
│     ├─ ALBOU.json
│     ├─ ALBPK.json
│     ├─ ALBPS.json
│     ├─ ALCAB.json
│     ├─ ALCAP.json
│     ├─ ALCAR.json
│     ├─ ALCBI.json
│     ├─ ALCBX.json
│     ├─ ALCHI.json
│     ├─ ALCIS.json
│     ├─ ALCJ.json
│     ├─ ALCLA.json
│     ├─ ALCLS.json
│     ├─ ALCOF.json
│     ├─ ALCOG.json
│     ├─ ALCOI.json
│     ├─ ALCOX.json
│     ├─ ALCRB.json
│     ├─ ALCUR.json
│     ├─ ALCWE.json
│     ├─ ALCYB.json
│     ├─ ALDAR.json
│     ├─ ALDBL.json
│     ├─ ALDBT.json
│     ├─ ALDEL.json
│     ├─ ALDEV.json
│     ├─ ALDLS.json
│     ├─ ALDLT.json
│     ├─ ALDMS.json
│     ├─ ALDNE.json
│     ├─ ALDNX.json
│     ├─ ALDOL.json
│     ├─ ALDRV.json
│     ├─ ALDUB.json
│     ├─ ALDUX.json
│     ├─ ALDV.json
│     ├─ ALDVI.json
│     ├─ ALEAC.json
│     ├─ ALECO.json
│     ├─ ALECP.json
│     ├─ ALECR.json
│     ├─ ALEMG.json
│     ├─ ALEMS.json
│     ├─ ALEMV.json
│     ├─ ALENE.json
│     ├─ ALENO.json
│     ├─ ALENR.json
│     ├─ ALENT.json
│     ├─ ALEO2.json
│     ├─ ALERS.json
│     ├─ ALESA.json
│     ├─ ALESE.json
│     ├─ ALESK.json
│     ├─ ALEUA.json
│     ├─ ALEUP.json
│     ├─ ALEXA.json
│     ├─ ALEXP.json
│     ├─ ALFBA.json
│     ├─ ALFLE.json
│     ├─ ALFLO.json
│     ├─ ALFPC.json
│     ├─ ALFRE.json
│     ├─ ALFUM.json
│     ├─ ALGAE.json
│     ├─ ALGAU.json
│     ├─ ALGBE.json
│     ├─ ALGEC.json
│     ├─ ALGEN.json
│     ├─ ALGEV.json
│     ├─ ALGID.json
│     ├─ ALGIL.json
│     ├─ ALGIR.json
│     ├─ ALGLD.json
│     ├─ ALGRO.json
│     ├─ ALGTR.json
│     ├─ ALHAF.json
│     ├─ ALHEX.json
│     ├─ ALHF.json
│     ├─ ALHGO.json
│     ├─ ALHGR.json
│     ├─ ALHIT.json
│     ├─ ALHOP.json
│     ├─ ALHPI.json
│     ├─ ALHRG.json
│     ├─ ALHRS.json
│     ├─ ALHUN.json
│     ├─ ALHYP.json
│     ├─ ALI2S.json
│     ├─ ALICA.json
│     ├─ ALICR.json
│     ├─ ALIDS.json
│     ├─ ALIE.json
│     ├─ ALIKO.json
│     ├─ ALIMO.json
│     ├─ ALIMP.json
│     ├─ ALIMR.json
│     ├─ ALINN.json
│     ├─ ALINS.json
│     ├─ ALINT.json
│     ├─ ALINV.json
│     ├─ ALISP.json
│     ├─ ALITL.json
│     ├─ ALJXR.json
│     ├─ ALKAL.json
│     ├─ ALKEM.json
│     ├─ ALKEY.json
│     ├─ ALKKO.json
│     ├─ ALKLA.json
│     ├─ ALKLH.json
│     ├─ ALKLK.json
│     ├─ ALKOM.json
│     ├─ ALLAM.json
│     ├─ ALLAN.json
│     ├─ ALLDL.json
│     ├─ ALLEC.json
│     ├─ ALLEX.json
│     ├─ ALLGO.json
│     ├─ ALLHB.json
│     ├─ ALLIX.json
│     ├─ ALLLN.json
│     ├─ ALLOG.json
│     ├─ ALLPL.json
│     ├─ ALLUX.json
│     ├─ ALMAR.json
│     ├─ ALMAS.json
│     ├─ ALMCE.json
│     ├─ ALMCP.json
│     ├─ ALMDG.json
│     ├─ ALMDP.json
│     ├─ ALMDT.json
│     ├─ ALMER.json
│     ├─ ALMET.json
│     ├─ ALMEX.json
│     ├─ ALMGI.json
│     ├─ ALMIB.json
│     ├─ ALMIC.json
│     ├─ ALMII.json
│     ├─ ALMIL.json
│     ├─ ALMIN.json
│     ├─ ALMKS.json
│     ├─ ALMKT.json
│     ├─ ALMLB.json
│     ├─ ALMOU.json
│     ├─ ALMRB.json
│     ├─ ALMUN.json
│     ├─ ALNEO.json
│     ├─ ALNEV.json
│     ├─ ALNFL.json
│     ├─ ALNLF.json
│     ├─ ALNMG.json
│     ├─ ALNMR.json
│     ├─ ALNN6.json
│     ├─ ALNOV.json
│     ├─ ALNRG.json
│     ├─ ALNSC.json
│     ├─ ALNSE.json
│     ├─ ALNTG.json
│     ├─ ALNXT.json
│     ├─ ALO.json
│     ├─ ALODC.json
│     ├─ ALOKW.json
│     ├─ ALOPM.json
│     ├─ ALORA.json
│     ├─ ALORD.json
│     ├─ ALPAR.json
│     ├─ ALPAT.json
│     ├─ ALPAU.json
│     ├─ ALPCV.json
│     ├─ ALPDX.json
│     ├─ ALPER.json
│     ├─ ALPHA.json
│     ├─ ALPHI.json
│     ├─ ALPJT.json
│     ├─ ALPM.json
│     ├─ ALPOU.json
│     ├─ ALPRE.json
│     ├─ ALPRG.json
│     ├─ ALPRI.json
│     ├─ ALPRO.json
│     ├─ ALPUL.json
│     ├─ ALQGC.json
│     ├─ ALQP.json
│     ├─ ALQWA.json
│     ├─ ALREA.json
│     ├─ ALREW.json
│     ├─ ALRFG.json
│     ├─ ALRGR.json
│     ├─ ALRIB.json
│     ├─ ALROC.json
│     ├─ ALRPD.json
│     ├─ ALSAF.json
│     ├─ ALSAS.json
│     ├─ ALSEI.json
│     ├─ ALSEN.json
│     ├─ ALSGD.json
│     ├─ ALSMA.json
│     ├─ ALSOG.json
│     ├─ ALSPT.json
│     ├─ ALSPW.json
│     ├─ ALSRS.json
│     ├─ ALSTI.json
│     ├─ ALSTW.json
│     ├─ ALTA.json
│     ├─ ALTAO.json
│     ├─ ALTBG.json
│     ├─ ALTD.json
│     ├─ ALTHE.json
│     ├─ ALTHO.json
│     ├─ ALTHX.json
│     ├─ ALTLX.json
│     ├─ ALTME.json
│     ├─ ALTOO.json
│     ├─ ALTPC.json
│     ├─ ALTRI.json
│     ├─ ALTRO.json
│     ├─ ALTTU.json
│     ├─ ALTUV.json
│     ├─ ALTXC.json
│     ├─ ALU10.json
│     ├─ ALUCI.json
│     ├─ ALUNT.json
│     ├─ ALUPG.json
│     ├─ ALUVI.json
│     ├─ ALVAL.json
│     ├─ ALVAP.json
│     ├─ ALVAZ.json
│     ├─ ALVDM.json
│     ├─ ALVER.json
│     ├─ ALVET.json
│     ├─ ALVG.json
│     ├─ ALVGO.json
│     ├─ ALVIA.json
│     ├─ ALVIN.json
│     ├─ ALVIO.json
│     ├─ ALVU.json
│     ├─ ALWEC.json
│     ├─ ALWED.json
│     ├─ ALWF.json
│     ├─ ALWIT.json
│     ├─ ALWTR.json
│     ├─ AM.json
│     ├─ AMPLI.json
│     ├─ AMUN.json
│     ├─ ANTIN.json
│     ├─ APAM.json
│     ├─ ARAMI.json
│     ├─ ARDO.json
│     ├─ AREIT.json
│     ├─ ARG.json
│     ├─ ARTE.json
│     ├─ ARTO.json
│     ├─ ARVBS.json
│     ├─ ARVEN.json
│     ├─ ASY.json
│     ├─ ATE.json
│     ├─ ATEME.json
│     ├─ ATLD.json
│     ├─ ATO.json
│     ├─ AUB.json
│     ├─ AUGR.json
│     ├─ AURE.json
│     ├─ AVT.json
│     ├─ AXW.json
│     ├─ AYV.json
│     ├─ BAIN.json
│     ├─ BALYO.json
│     ├─ BASS.json
│     ├─ BB.json
│     ├─ BEN.json
│     ├─ BIG.json
│     ├─ BIM.json
│     ├─ BIOS.json
│     ├─ BLC.json
│     ├─ BLEE.json
│     ├─ BLV.json
│     ├─ BN.json
│     ├─ BNBS.json
│     ├─ BNP.json
│     ├─ BOI.json
│     ├─ BOL.json
│     ├─ BON.json
│     ├─ BPBS.json
│     ├─ BPSBS.json
│     ├─ BSD.json
│     ├─ BUI.json
│     ├─ BUR.json
│     ├─ BVI.json
│     ├─ CA.json
│     ├─ CAF.json
│     ├─ CAFO.json
│     ├─ CAP.json
│     ├─ CARM.json
│     ├─ CARP.json
│     ├─ CAT31.json
│     ├─ CATG.json
│     ├─ CBBSA.json
│     ├─ CBDG.json
│     ├─ CBE.json
│     ├─ CBOT.json
│     ├─ CBR.json
│     ├─ CBSAB.json
│     ├─ CBSM.json
│     ├─ CCN.json
│     ├─ CDA.json
│     ├─ CDI.json
│     ├─ CEN.json
│     ├─ CFI.json
│     ├─ CGM.json
│     ├─ CHSR.json
│     ├─ CIV.json
│     ├─ CLA.json
│     ├─ CLARI.json
│     ├─ CMO.json
│     ├─ CNDF.json
│     ├─ CNV.json
│     ├─ CO.json
│     ├─ COBS1.json
│     ├─ COBS3.json
│     ├─ COFA.json
│     ├─ COH.json
│     ├─ COTY.json
│     ├─ COUR.json
│     ├─ COV.json
│     ├─ COVH.json
│     ├─ CRAP.json
│     ├─ CRAV.json
│     ├─ CRBP2.json
│     ├─ CRI.json
│     ├─ CRLA.json
│     ├─ CRLO.json
│     ├─ CROS.json
│     ├─ CRSU.json
│     ├─ CRTO.json
│     ├─ CS.json
│     ├─ CV.json
│     ├─ CYAD.json
│     ├─ CYBK1.json
│     ├─ CYBKA.json
│     ├─ CYBKB.json
│     ├─ DBG.json
│     ├─ DBV.json
│     ├─ DEC.json
│     ├─ DEEZR.json
│     ├─ DEEZW.json
│     ├─ DG.json
│     ├─ DIM.json
│     ├─ DKUPL.json
│     ├─ DMSBS.json
│     ├─ DPAM.json
│     ├─ DPT.json
│     ├─ DSY.json
│     ├─ EAPI.json
│     ├─ EC.json
│     ├─ EDEN.json
│     ├─ EDI.json
│     ├─ EEM.json
│     ├─ EFG.json
│     ├─ EFI.json
│     ├─ EGR.json
│     ├─ EIFF.json
│     ├─ EKI.json
│     ├─ EL.json
│     ├─ ELEC.json
│     ├─ ELIOR.json
│     ├─ ELIS.json
│     ├─ EMEBS.json
│     ├─ EMEIS.json
│     ├─ EN.json
│     ├─ ENGI.json
│     ├─ ENX.json
│     ├─ EOS.json
│     ├─ EQS.json
│     ├─ ERA.json
│     ├─ ERF.json
│     ├─ ES.json
│     ├─ ETL.json
│     ├─ EURS.json
│     ├─ EXA.json
│     ├─ EXE.json
│     ├─ EXENS.json
│     ├─ EXN.json
│     ├─ EXPL.json
│     ├─ FAYE.json
│     ├─ FCMC.json
│     ├─ FDE.json
│     ├─ FDJ.json
│     ├─ FGA.json
│     ├─ FGR.json
│     ├─ FII.json
│     ├─ FINM.json
│     ├─ FIPP.json
│     ├─ FLY.json
│     ├─ FMONC.json
│     ├─ FNAC.json
│     ├─ FNTS.json
│     ├─ FOAF.json
│     ├─ FORE.json
│     ├─ FORSE.json
│     ├─ FPG.json
│     ├─ FR.json
│     ├─ FREY.json
│     ├─ FRVIA.json
│     ├─ GALIM.json
│     ├─ GAM.json
│     ├─ GBT.json
│     ├─ GDS.json
│     ├─ GEA.json
│     ├─ GET.json
│     ├─ GFC.json
│     ├─ GJAJ.json
│     ├─ GLE.json
│     ├─ GLO.json
│     ├─ GNFT.json
│     ├─ GNRO.json
│     ├─ GPE.json
│     ├─ GRVO.json
│     ├─ GTT.json
│     ├─ GUI.json
│     ├─ HCO.json
│     ├─ HDF.json
│     ├─ HDP.json
│     ├─ HO.json
│     ├─ IAM.json
│     ├─ ICAD.json
│     ├─ IDIP.json
│     ├─ IDL.json
│     ├─ IMDA.json
│     ├─ INEA.json
│     ├─ INF.json
│     ├─ INFE.json
│     ├─ IPH.json
│     ├─ IPN.json
│     ├─ IPS.json
│     ├─ ITP.json
│     ├─ ITXT.json
│     ├─ IVA.json
│     ├─ JBOG.json
│     ├─ JCQ.json
│     ├─ KER.json
│     ├─ KOF.json
│     ├─ LACR.json
│     ├─ LAT.json
│     ├─ LBIRD.json
│     ├─ LEBL.json
│     ├─ LHYFE.json
│     ├─ LI.json
│     ├─ LIN.json
│     ├─ LNA.json
│     ├─ LOCAL.json
│     ├─ LOUP.json
│     ├─ LPE.json
│     ├─ LR.json
│     ├─ LSS.json
│     ├─ LTA.json
│     ├─ MAAT.json
│     ├─ MALT.json
│     ├─ MASBS.json
│     ├─ MAU.json
│     ├─ MBWS.json
│     ├─ MC.json
│     ├─ MDM.json
│     ├─ MEDCL.json
│     ├─ MEMS.json
│     ├─ MERY.json
│     ├─ METEX.json
│     ├─ MF.json
│     ├─ MHM.json
│     ├─ ML.json
│     ├─ MLAA.json
│     ├─ MLAAH.json
│     ├─ MLAAT.json
│     ├─ MLABC.json
│     ├─ MLACT.json
│     ├─ MLAEM.json
│     ├─ MLAGI.json
│     ├─ MLAGP.json
│     ├─ MLAIG.json
│     ├─ MLALE.json
│     ├─ MLALV.json
│     ├─ MLARD.json
│     ├─ MLARE.json
│     ├─ MLARI.json
│     ├─ MLARO.json
│     ├─ MLASO.json
│     ├─ MLAST.json
│     ├─ MLAZL.json
│     ├─ MLAZR.json
│     ├─ MLBAR.json
│     ├─ MLBBO.json
│     ├─ MLBIO.json
│     ├─ MLBMD.json
│     ├─ MLBON.json
│     ├─ MLBSP.json
│     ├─ MLCAC.json
│     ├─ MLCAN.json
│     ├─ MLCFD.json
│     ├─ MLCFM.json
│     ├─ MLCHE.json
│     ├─ MLCLI.json
│     ├─ MLCLP.json
│     ├─ MLCMB.json
│     ├─ MLCMG.json
│     ├─ MLCMI.json
│     ├─ MLCNT.json
│     ├─ MLCOE.json
│     ├─ MLCOR.json
│     ├─ MLCOT.json
│     ├─ MLCOU.json
│     ├─ MLCVG.json
│     ├─ MLDAM.json
│     ├─ MLDYN.json
│     ├─ MLDYX.json
│     ├─ MLEAS.json
│     ├─ MLEAV.json
│     ├─ MLECE.json
│     ├─ MLECO.json
│     ├─ MLEDR.json
│     ├─ MLEDS.json
│     ├─ MLEDU.json
│     ├─ MLEFA.json
│     ├─ MLERH.json
│     ├─ MLERO.json
│     ├─ MLETA.json
│     ├─ MLFDV.json
│     ├─ MLFIR.json
│     ├─ MLFNP.json
│     ├─ MLFSG.json
│     ├─ MLFTI.json
│     ├─ MLFXO.json
│     ├─ MLGAI.json
│     ├─ MLGAL.json
│     ├─ MLGDI.json
│     ├─ MLGEQ.json
│     ├─ MLGLA.json
│     ├─ MLGLB.json
│     ├─ MLGLW.json
│     ├─ MLGRC.json
│     ├─ MLGWH.json
│     ├─ MLHAY.json
│     ├─ MLHBB.json
│     ├─ MLHBP.json
│     ├─ MLHCF.json
│     ├─ MLHIN.json
│     ├─ MLHK.json
│     ├─ MLHMC.json
│     ├─ MLHOP.json
│     ├─ MLHOT.json
│     ├─ MLHPE.json
│     ├─ MLHYD.json
│     ├─ MLHYE.json
│     ├─ MLIDS.json
│     ├─ MLIFC.json
│     ├─ MLIFS.json
│     ├─ MLIME.json
│     ├─ MLIML.json
│     ├─ MLIMP.json
│     ├─ MLINM.json
│     ├─ MLINT.json
│     ├─ MLIPO.json
│     ├─ MLIPP.json
│     ├─ MLIRF.json
│     ├─ MLISP.json
│     ├─ MLITN.json
│     ├─ MLJ21.json
│     ├─ MLJDL.json
│     ├─ MLLAB.json
│     ├─ MLLCB.json
│     ├─ MLLOI.json
│     ├─ MLMAB.json
│     ├─ MLMAD.json
│     ├─ MLMAQ.json
│     ├─ MLMCA.json
│     ├─ MLMFI.json
│     ├─ MLMGL.json
│     ├─ MLMIB.json
│     ├─ MLMIV.json
│     ├─ MLMTP.json
│     ├─ MLMUT.json
│     ├─ MLNDG.json
│     ├─ MLNMA.json
│     ├─ MLNOV.json
│     ├─ MLOCT.json
│     ├─ MLOKP.json
│     ├─ MLONE.json
│     ├─ MLONL.json
│     ├─ MLORB.json
│     ├─ MLORQ.json
│     ├─ MLPAC.json
│     ├─ MLPER.json
│     ├─ MLPET.json
│     ├─ MLPHO.json
│     ├─ MLPHW.json
│     ├─ MLPLC.json
│     ├─ MLPRI.json
│     ├─ MLPRX.json
│     ├─ MLPVG.json
│     ├─ MLSAG.json
│     ├─ MLSCI.json
│     ├─ MLSDN.json
│     ├─ MLSEQ.json
│     ├─ MLSGT.json
│     ├─ MLSIL.json
│     ├─ MLSML.json
│     ├─ MLSMP.json
│     ├─ MLSRP.json
│     ├─ MLSTR.json
│     ├─ MLSUM.json
│     ├─ MLTRA.json
│     ├─ MLTRO.json
│     ├─ MLUAV.json
│     ├─ MLUMG.json
│     ├─ MLURC.json
│     ├─ MLVER.json
│     ├─ MLVIE.json
│     ├─ MLVIN.json
│     ├─ MLVIR.json
│     ├─ MLVRE.json
│     ├─ MLVRF.json
│     ├─ MLVST.json
│     ├─ MLVSY.json
│     ├─ MLWEA.json
│     ├─ MLWEL.json
│     ├─ MLWEY.json
│     ├─ MLWIZ.json
│     ├─ MLZAM.json
│     ├─ MMB.json
│     ├─ MMT.json
│     ├─ MONT.json
│     ├─ MRM.json
│     ├─ MRN.json
│     ├─ MT.json
│     ├─ MTU.json
│     ├─ NACON.json
│     ├─ NANO.json
│     ├─ NEOEN.json
│     ├─ NEX.json
│     ├─ NHOA.json
│     ├─ NICBS.json
│     ├─ NK.json
│     ├─ NOKIA.json
│     ├─ NR21.json
│     ├─ NRG.json
│     ├─ NRO.json
│     ├─ NXI.json
│     ├─ ODET.json
│     ├─ OPM.json
│     ├─ OR.json
│     ├─ ORA.json
│     ├─ ORAP.json
│     ├─ OREGE.json
│     ├─ ORIA.json
│     ├─ OSE.json
│     ├─ OVH.json
│     ├─ PAR.json
│     ├─ PARP.json
│     ├─ PARRO.json
│     ├─ PAT.json
│     ├─ PATBS.json
│     ├─ PERR.json
│     ├─ PEUG.json
│     ├─ PHXM.json
│     ├─ PIG.json
│     ├─ PLNW.json
│     ├─ PLX.json
│     ├─ POXEL.json
│     ├─ PRC.json
│     ├─ PROAC.json
│     ├─ PROBT.json
│     ├─ PSAT.json
│     ├─ PUB.json
│     ├─ PVL.json
│     ├─ PWG.json
│     ├─ QDT.json
│     ├─ RAL.json
│     ├─ RBO.json
│     ├─ RBT.json
│     ├─ RCO.json
│     ├─ RF.json
│     ├─ RI.json
│     ├─ RMS.json
│     ├─ RNO.json
│     ├─ ROCBT.json
│     ├─ RUI.json
│     ├─ RXL.json
│     ├─ S30.json
│     ├─ SABE.json
│     ├─ SACI.json
│     ├─ SAF.json
│     ├─ SAMS.json
│     ├─ SAN.json
│     ├─ SAVE.json
│     ├─ SBT.json
│     ├─ SCHP.json
│     ├─ SCR.json
│     ├─ SDG.json
│     ├─ SEC.json
│     ├─ SEFER.json
│     ├─ SELER.json
│     ├─ SESG.json
│     ├─ SFCA.json
│     ├─ SFPI.json
│     ├─ SGO.json
│     ├─ SGRO.json
│     ├─ SIGHT.json
│     ├─ SK.json
│     ├─ SLCO.json
│     ├─ SMCP.json
│     ├─ SMLBS.json
│     ├─ SOI.json
│     ├─ SOLB.json
│     ├─ SOP.json
│     ├─ SPEL.json
│     ├─ SPIE.json
│     ├─ SQI.json
│     ├─ SRP.json
│     ├─ STF.json
│     ├─ STLAP.json
│     ├─ STMPA.json
│     ├─ STRBS.json
│     ├─ STWBS.json
│     ├─ SU.json
│     ├─ SW.json
│     ├─ SWP.json
│     ├─ SYENS.json
│     ├─ TAYN.json
│     ├─ TDBS.json
│     ├─ TE.json
│     ├─ TEP.json
│     ├─ TERBS.json
│     ├─ TFF.json
│     ├─ TFI.json
│     ├─ THEP.json
│     ├─ TITC.json
│     ├─ TKO.json
│     ├─ TKTT.json
│     ├─ TMBSZ.json
│     ├─ TNG.json
│     ├─ TOUP.json
│     ├─ TRACT.json
│     ├─ TRI.json
│     ├─ TTE.json
│     ├─ TVRB.json
│     ├─ UBI.json
│     ├─ UNBL.json
│     ├─ URW.json
│     ├─ VAC.json
│     ├─ VACBS.json
│     ├─ VACBT.json
│     ├─ VANBS.json
│     ├─ VANTI.json
│     ├─ VCT.json
│     ├─ VETO.json
│     ├─ VIE.json
│     ├─ VIL.json
│     ├─ VIRI.json
│     ├─ VIRP.json
│     ├─ VIV.json
│     ├─ VK.json
│     ├─ VKBS.json
│     ├─ VLA.json
│     ├─ VLTSA.json
│     ├─ VMX.json
│     ├─ VRAP.json
│     ├─ VRLA.json
│     ├─ VTR.json
│     ├─ VU.json
│     ├─ WAGA.json
│     ├─ WAVE.json
│     ├─ WLN.json
│     ├─ XFAB.json
│     └─ XIL.json
├─ dist
│  ├─ .DS_Store
│  ├─ builder-effective-config.yaml
│  └─ mac-arm64
│     └─ maqh_v1.app
│        └─ Contents
│           ├─ Frameworks
│           │  ├─ Electron Framework.framework
│           │  │  ├─ Electron Framework
│           │  │  ├─ Helpers
│           │  │  │  └─ chrome_crashpad_handler
│           │  │  ├─ Libraries
│           │  │  │  ├─ libEGL.dylib
│           │  │  │  ├─ libGLESv2.dylib
│           │  │  │  ├─ libffmpeg.dylib
│           │  │  │  ├─ libvk_swiftshader.dylib
│           │  │  │  └─ vk_swiftshader_icd.json
│           │  │  ├─ Resources
│           │  │  │  ├─ Info.plist
│           │  │  │  ├─ MainMenu.nib
│           │  │  │  ├─ af.lproj
│           │  │  │  │  └─ locale.pak
│           │  │  │  ├─ am.lproj
│           │  │  │  │  └─ locale.pak
│           │  │  │  ├─ ar.lproj
│           │  │  │  │  └─ locale.pak
│           │  │  │  ├─ bg.lproj
│           │  │  │  │  └─ locale.pak
│           │  │  │  ├─ bn.lproj
│           │  │  │  │  └─ locale.pak
│           │  │  │  ├─ ca.lproj
│           │  │  │  │  └─ locale.pak
│           │  │  │  ├─ chrome_100_percent.pak
│           │  │  │  ├─ chrome_200_percent.pak
│           │  │  │  ├─ cs.lproj
│           │  │  │  │  └─ locale.pak
│           │  │  │  ├─ da.lproj
│           │  │  │  │  └─ locale.pak
│           │  │  │  ├─ de.lproj
│           │  │  │  │  └─ locale.pak
│           │  │  │  ├─ el.lproj
│           │  │  │  │  └─ locale.pak
│           │  │  │  ├─ en.lproj
│           │  │  │  │  └─ locale.pak
│           │  │  │  ├─ en_GB.lproj
│           │  │  │  │  └─ locale.pak
│           │  │  │  ├─ es.lproj
│           │  │  │  │  └─ locale.pak
│           │  │  │  ├─ es_419.lproj
│           │  │  │  │  └─ locale.pak
│           │  │  │  ├─ et.lproj
│           │  │  │  │  └─ locale.pak
│           │  │  │  ├─ fa.lproj
│           │  │  │  │  └─ locale.pak
│           │  │  │  ├─ fi.lproj
│           │  │  │  │  └─ locale.pak
│           │  │  │  ├─ fil.lproj
│           │  │  │  │  └─ locale.pak
│           │  │  │  ├─ fr.lproj
│           │  │  │  │  └─ locale.pak
│           │  │  │  ├─ gu.lproj
│           │  │  │  │  └─ locale.pak
│           │  │  │  ├─ he.lproj
│           │  │  │  │  └─ locale.pak
│           │  │  │  ├─ hi.lproj
│           │  │  │  │  └─ locale.pak
│           │  │  │  ├─ hr.lproj
│           │  │  │  │  └─ locale.pak
│           │  │  │  ├─ hu.lproj
│           │  │  │  │  └─ locale.pak
│           │  │  │  ├─ icudtl.dat
│           │  │  │  ├─ id.lproj
│           │  │  │  │  └─ locale.pak
│           │  │  │  ├─ it.lproj
│           │  │  │  │  └─ locale.pak
│           │  │  │  ├─ ja.lproj
│           │  │  │  │  └─ locale.pak
│           │  │  │  ├─ kn.lproj
│           │  │  │  │  └─ locale.pak
│           │  │  │  ├─ ko.lproj
│           │  │  │  │  └─ locale.pak
│           │  │  │  ├─ lt.lproj
│           │  │  │  │  └─ locale.pak
│           │  │  │  ├─ lv.lproj
│           │  │  │  │  └─ locale.pak
│           │  │  │  ├─ ml.lproj
│           │  │  │  │  └─ locale.pak
│           │  │  │  ├─ mr.lproj
│           │  │  │  │  └─ locale.pak
│           │  │  │  ├─ ms.lproj
│           │  │  │  │  └─ locale.pak
│           │  │  │  ├─ nb.lproj
│           │  │  │  │  └─ locale.pak
│           │  │  │  ├─ nl.lproj
│           │  │  │  │  └─ locale.pak
│           │  │  │  ├─ pl.lproj
│           │  │  │  │  └─ locale.pak
│           │  │  │  ├─ pt_BR.lproj
│           │  │  │  │  └─ locale.pak
│           │  │  │  ├─ pt_PT.lproj
│           │  │  │  │  └─ locale.pak
│           │  │  │  ├─ resources.pak
│           │  │  │  ├─ ro.lproj
│           │  │  │  │  └─ locale.pak
│           │  │  │  ├─ ru.lproj
│           │  │  │  │  └─ locale.pak
│           │  │  │  ├─ sk.lproj
│           │  │  │  │  └─ locale.pak
│           │  │  │  ├─ sl.lproj
│           │  │  │  │  └─ locale.pak
│           │  │  │  ├─ sr.lproj
│           │  │  │  │  └─ locale.pak
│           │  │  │  ├─ sv.lproj
│           │  │  │  │  └─ locale.pak
│           │  │  │  ├─ sw.lproj
│           │  │  │  │  └─ locale.pak
│           │  │  │  ├─ ta.lproj
│           │  │  │  │  └─ locale.pak
│           │  │  │  ├─ te.lproj
│           │  │  │  │  └─ locale.pak
│           │  │  │  ├─ th.lproj
│           │  │  │  │  └─ locale.pak
│           │  │  │  ├─ tr.lproj
│           │  │  │  │  └─ locale.pak
│           │  │  │  ├─ uk.lproj
│           │  │  │  │  └─ locale.pak
│           │  │  │  ├─ ur.lproj
│           │  │  │  │  └─ locale.pak
│           │  │  │  ├─ v8_context_snapshot.arm64.bin
│           │  │  │  ├─ vi.lproj
│           │  │  │  │  └─ locale.pak
│           │  │  │  ├─ zh_CN.lproj
│           │  │  │  │  └─ locale.pak
│           │  │  │  └─ zh_TW.lproj
│           │  │  │     └─ locale.pak
│           │  │  └─ Versions
│           │  │     ├─ A
│           │  │     │  ├─ Electron Framework
│           │  │     │  ├─ Helpers
│           │  │     │  │  └─ chrome_crashpad_handler
│           │  │     │  ├─ Libraries
│           │  │     │  │  ├─ libEGL.dylib
│           │  │     │  │  ├─ libGLESv2.dylib
│           │  │     │  │  ├─ libffmpeg.dylib
│           │  │     │  │  ├─ libvk_swiftshader.dylib
│           │  │     │  │  └─ vk_swiftshader_icd.json
│           │  │     │  ├─ Resources
│           │  │     │  │  ├─ Info.plist
│           │  │     │  │  ├─ MainMenu.nib
│           │  │     │  │  ├─ af.lproj
│           │  │     │  │  │  └─ locale.pak
│           │  │     │  │  ├─ am.lproj
│           │  │     │  │  │  └─ locale.pak
│           │  │     │  │  ├─ ar.lproj
│           │  │     │  │  │  └─ locale.pak
│           │  │     │  │  ├─ bg.lproj
│           │  │     │  │  │  └─ locale.pak
│           │  │     │  │  ├─ bn.lproj
│           │  │     │  │  │  └─ locale.pak
│           │  │     │  │  ├─ ca.lproj
│           │  │     │  │  │  └─ locale.pak
│           │  │     │  │  ├─ chrome_100_percent.pak
│           │  │     │  │  ├─ chrome_200_percent.pak
│           │  │     │  │  ├─ cs.lproj
│           │  │     │  │  │  └─ locale.pak
│           │  │     │  │  ├─ da.lproj
│           │  │     │  │  │  └─ locale.pak
│           │  │     │  │  ├─ de.lproj
│           │  │     │  │  │  └─ locale.pak
│           │  │     │  │  ├─ el.lproj
│           │  │     │  │  │  └─ locale.pak
│           │  │     │  │  ├─ en.lproj
│           │  │     │  │  │  └─ locale.pak
│           │  │     │  │  ├─ en_GB.lproj
│           │  │     │  │  │  └─ locale.pak
│           │  │     │  │  ├─ es.lproj
│           │  │     │  │  │  └─ locale.pak
│           │  │     │  │  ├─ es_419.lproj
│           │  │     │  │  │  └─ locale.pak
│           │  │     │  │  ├─ et.lproj
│           │  │     │  │  │  └─ locale.pak
│           │  │     │  │  ├─ fa.lproj
│           │  │     │  │  │  └─ locale.pak
│           │  │     │  │  ├─ fi.lproj
│           │  │     │  │  │  └─ locale.pak
│           │  │     │  │  ├─ fil.lproj
│           │  │     │  │  │  └─ locale.pak
│           │  │     │  │  ├─ fr.lproj
│           │  │     │  │  │  └─ locale.pak
│           │  │     │  │  ├─ gu.lproj
│           │  │     │  │  │  └─ locale.pak
│           │  │     │  │  ├─ he.lproj
│           │  │     │  │  │  └─ locale.pak
│           │  │     │  │  ├─ hi.lproj
│           │  │     │  │  │  └─ locale.pak
│           │  │     │  │  ├─ hr.lproj
│           │  │     │  │  │  └─ locale.pak
│           │  │     │  │  ├─ hu.lproj
│           │  │     │  │  │  └─ locale.pak
│           │  │     │  │  ├─ icudtl.dat
│           │  │     │  │  ├─ id.lproj
│           │  │     │  │  │  └─ locale.pak
│           │  │     │  │  ├─ it.lproj
│           │  │     │  │  │  └─ locale.pak
│           │  │     │  │  ├─ ja.lproj
│           │  │     │  │  │  └─ locale.pak
│           │  │     │  │  ├─ kn.lproj
│           │  │     │  │  │  └─ locale.pak
│           │  │     │  │  ├─ ko.lproj
│           │  │     │  │  │  └─ locale.pak
│           │  │     │  │  ├─ lt.lproj
│           │  │     │  │  │  └─ locale.pak
│           │  │     │  │  ├─ lv.lproj
│           │  │     │  │  │  └─ locale.pak
│           │  │     │  │  ├─ ml.lproj
│           │  │     │  │  │  └─ locale.pak
│           │  │     │  │  ├─ mr.lproj
│           │  │     │  │  │  └─ locale.pak
│           │  │     │  │  ├─ ms.lproj
│           │  │     │  │  │  └─ locale.pak
│           │  │     │  │  ├─ nb.lproj
│           │  │     │  │  │  └─ locale.pak
│           │  │     │  │  ├─ nl.lproj
│           │  │     │  │  │  └─ locale.pak
│           │  │     │  │  ├─ pl.lproj
│           │  │     │  │  │  └─ locale.pak
│           │  │     │  │  ├─ pt_BR.lproj
│           │  │     │  │  │  └─ locale.pak
│           │  │     │  │  ├─ pt_PT.lproj
│           │  │     │  │  │  └─ locale.pak
│           │  │     │  │  ├─ resources.pak
│           │  │     │  │  ├─ ro.lproj
│           │  │     │  │  │  └─ locale.pak
│           │  │     │  │  ├─ ru.lproj
│           │  │     │  │  │  └─ locale.pak
│           │  │     │  │  ├─ sk.lproj
│           │  │     │  │  │  └─ locale.pak
│           │  │     │  │  ├─ sl.lproj
│           │  │     │  │  │  └─ locale.pak
│           │  │     │  │  ├─ sr.lproj
│           │  │     │  │  │  └─ locale.pak
│           │  │     │  │  ├─ sv.lproj
│           │  │     │  │  │  └─ locale.pak
│           │  │     │  │  ├─ sw.lproj
│           │  │     │  │  │  └─ locale.pak
│           │  │     │  │  ├─ ta.lproj
│           │  │     │  │  │  └─ locale.pak
│           │  │     │  │  ├─ te.lproj
│           │  │     │  │  │  └─ locale.pak
│           │  │     │  │  ├─ th.lproj
│           │  │     │  │  │  └─ locale.pak
│           │  │     │  │  ├─ tr.lproj
│           │  │     │  │  │  └─ locale.pak
│           │  │     │  │  ├─ uk.lproj
│           │  │     │  │  │  └─ locale.pak
│           │  │     │  │  ├─ ur.lproj
│           │  │     │  │  │  └─ locale.pak
│           │  │     │  │  ├─ v8_context_snapshot.arm64.bin
│           │  │     │  │  ├─ vi.lproj
│           │  │     │  │  │  └─ locale.pak
│           │  │     │  │  ├─ zh_CN.lproj
│           │  │     │  │  │  └─ locale.pak
│           │  │     │  │  └─ zh_TW.lproj
│           │  │     │  │     └─ locale.pak
│           │  │     │  └─ _CodeSignature
│           │  │     │     └─ CodeResources
│           │  │     └─ Current
│           │  │        ├─ Electron Framework
│           │  │        ├─ Helpers
│           │  │        │  └─ chrome_crashpad_handler
│           │  │        ├─ Libraries
│           │  │        │  ├─ libEGL.dylib
│           │  │        │  ├─ libGLESv2.dylib
│           │  │        │  ├─ libffmpeg.dylib
│           │  │        │  ├─ libvk_swiftshader.dylib
│           │  │        │  └─ vk_swiftshader_icd.json
│           │  │        ├─ Resources
│           │  │        │  ├─ Info.plist
│           │  │        │  ├─ MainMenu.nib
│           │  │        │  ├─ af.lproj
│           │  │        │  │  └─ locale.pak
│           │  │        │  ├─ am.lproj
│           │  │        │  │  └─ locale.pak
│           │  │        │  ├─ ar.lproj
│           │  │        │  │  └─ locale.pak
│           │  │        │  ├─ bg.lproj
│           │  │        │  │  └─ locale.pak
│           │  │        │  ├─ bn.lproj
│           │  │        │  │  └─ locale.pak
│           │  │        │  ├─ ca.lproj
│           │  │        │  │  └─ locale.pak
│           │  │        │  ├─ chrome_100_percent.pak
│           │  │        │  ├─ chrome_200_percent.pak
│           │  │        │  ├─ cs.lproj
│           │  │        │  │  └─ locale.pak
│           │  │        │  ├─ da.lproj
│           │  │        │  │  └─ locale.pak
│           │  │        │  ├─ de.lproj
│           │  │        │  │  └─ locale.pak
│           │  │        │  ├─ el.lproj
│           │  │        │  │  └─ locale.pak
│           │  │        │  ├─ en.lproj
│           │  │        │  │  └─ locale.pak
│           │  │        │  ├─ en_GB.lproj
│           │  │        │  │  └─ locale.pak
│           │  │        │  ├─ es.lproj
│           │  │        │  │  └─ locale.pak
│           │  │        │  ├─ es_419.lproj
│           │  │        │  │  └─ locale.pak
│           │  │        │  ├─ et.lproj
│           │  │        │  │  └─ locale.pak
│           │  │        │  ├─ fa.lproj
│           │  │        │  │  └─ locale.pak
│           │  │        │  ├─ fi.lproj
│           │  │        │  │  └─ locale.pak
│           │  │        │  ├─ fil.lproj
│           │  │        │  │  └─ locale.pak
│           │  │        │  ├─ fr.lproj
│           │  │        │  │  └─ locale.pak
│           │  │        │  ├─ gu.lproj
│           │  │        │  │  └─ locale.pak
│           │  │        │  ├─ he.lproj
│           │  │        │  │  └─ locale.pak
│           │  │        │  ├─ hi.lproj
│           │  │        │  │  └─ locale.pak
│           │  │        │  ├─ hr.lproj
│           │  │        │  │  └─ locale.pak
│           │  │        │  ├─ hu.lproj
│           │  │        │  │  └─ locale.pak
│           │  │        │  ├─ icudtl.dat
│           │  │        │  ├─ id.lproj
│           │  │        │  │  └─ locale.pak
│           │  │        │  ├─ it.lproj
│           │  │        │  │  └─ locale.pak
│           │  │        │  ├─ ja.lproj
│           │  │        │  │  └─ locale.pak
│           │  │        │  ├─ kn.lproj
│           │  │        │  │  └─ locale.pak
│           │  │        │  ├─ ko.lproj
│           │  │        │  │  └─ locale.pak
│           │  │        │  ├─ lt.lproj
│           │  │        │  │  └─ locale.pak
│           │  │        │  ├─ lv.lproj
│           │  │        │  │  └─ locale.pak
│           │  │        │  ├─ ml.lproj
│           │  │        │  │  └─ locale.pak
│           │  │        │  ├─ mr.lproj
│           │  │        │  │  └─ locale.pak
│           │  │        │  ├─ ms.lproj
│           │  │        │  │  └─ locale.pak
│           │  │        │  ├─ nb.lproj
│           │  │        │  │  └─ locale.pak
│           │  │        │  ├─ nl.lproj
│           │  │        │  │  └─ locale.pak
│           │  │        │  ├─ pl.lproj
│           │  │        │  │  └─ locale.pak
│           │  │        │  ├─ pt_BR.lproj
│           │  │        │  │  └─ locale.pak
│           │  │        │  ├─ pt_PT.lproj
│           │  │        │  │  └─ locale.pak
│           │  │        │  ├─ resources.pak
│           │  │        │  ├─ ro.lproj
│           │  │        │  │  └─ locale.pak
│           │  │        │  ├─ ru.lproj
│           │  │        │  │  └─ locale.pak
│           │  │        │  ├─ sk.lproj
│           │  │        │  │  └─ locale.pak
│           │  │        │  ├─ sl.lproj
│           │  │        │  │  └─ locale.pak
│           │  │        │  ├─ sr.lproj
│           │  │        │  │  └─ locale.pak
│           │  │        │  ├─ sv.lproj
│           │  │        │  │  └─ locale.pak
│           │  │        │  ├─ sw.lproj
│           │  │        │  │  └─ locale.pak
│           │  │        │  ├─ ta.lproj
│           │  │        │  │  └─ locale.pak
│           │  │        │  ├─ te.lproj
│           │  │        │  │  └─ locale.pak
│           │  │        │  ├─ th.lproj
│           │  │        │  │  └─ locale.pak
│           │  │        │  ├─ tr.lproj
│           │  │        │  │  └─ locale.pak
│           │  │        │  ├─ uk.lproj
│           │  │        │  │  └─ locale.pak
│           │  │        │  ├─ ur.lproj
│           │  │        │  │  └─ locale.pak
│           │  │        │  ├─ v8_context_snapshot.arm64.bin
│           │  │        │  ├─ vi.lproj
│           │  │        │  │  └─ locale.pak
│           │  │        │  ├─ zh_CN.lproj
│           │  │        │  │  └─ locale.pak
│           │  │        │  └─ zh_TW.lproj
│           │  │        │     └─ locale.pak
│           │  │        └─ _CodeSignature
│           │  │           └─ CodeResources
│           │  ├─ Mantle.framework
│           │  │  ├─ Mantle
│           │  │  ├─ Resources
│           │  │  │  └─ Info.plist
│           │  │  └─ Versions
│           │  │     ├─ A
│           │  │     │  ├─ Mantle
│           │  │     │  ├─ Resources
│           │  │     │  │  └─ Info.plist
│           │  │     │  └─ _CodeSignature
│           │  │     │     └─ CodeResources
│           │  │     └─ Current
│           │  │        ├─ Mantle
│           │  │        ├─ Resources
│           │  │        │  └─ Info.plist
│           │  │        └─ _CodeSignature
│           │  │           └─ CodeResources
│           │  ├─ ReactiveObjC.framework
│           │  │  ├─ ReactiveObjC
│           │  │  ├─ Resources
│           │  │  │  └─ Info.plist
│           │  │  └─ Versions
│           │  │     ├─ A
│           │  │     │  ├─ ReactiveObjC
│           │  │     │  ├─ Resources
│           │  │     │  │  └─ Info.plist
│           │  │     │  └─ _CodeSignature
│           │  │     │     └─ CodeResources
│           │  │     └─ Current
│           │  │        ├─ ReactiveObjC
│           │  │        ├─ Resources
│           │  │        │  └─ Info.plist
│           │  │        └─ _CodeSignature
│           │  │           └─ CodeResources
│           │  ├─ Squirrel.framework
│           │  │  ├─ Resources
│           │  │  │  ├─ Info.plist
│           │  │  │  └─ ShipIt
│           │  │  ├─ Squirrel
│           │  │  └─ Versions
│           │  │     ├─ A
│           │  │     │  ├─ Resources
│           │  │     │  │  ├─ Info.plist
│           │  │     │  │  └─ ShipIt
│           │  │     │  ├─ Squirrel
│           │  │     │  └─ _CodeSignature
│           │  │     │     └─ CodeResources
│           │  │     └─ Current
│           │  │        ├─ Resources
│           │  │        │  ├─ Info.plist
│           │  │        │  └─ ShipIt
│           │  │        ├─ Squirrel
│           │  │        └─ _CodeSignature
│           │  │           └─ CodeResources
│           │  ├─ maqh_v1 Helper (GPU).app
│           │  │  └─ Contents
│           │  │     ├─ Info.plist
│           │  │     ├─ MacOS
│           │  │     │  └─ maqh_v1 Helper (GPU)
│           │  │     ├─ PkgInfo
│           │  │     └─ _CodeSignature
│           │  │        └─ CodeResources
│           │  ├─ maqh_v1 Helper (Plugin).app
│           │  │  └─ Contents
│           │  │     ├─ Info.plist
│           │  │     ├─ MacOS
│           │  │     │  └─ maqh_v1 Helper (Plugin)
│           │  │     ├─ PkgInfo
│           │  │     └─ _CodeSignature
│           │  │        └─ CodeResources
│           │  ├─ maqh_v1 Helper (Renderer).app
│           │  │  └─ Contents
│           │  │     ├─ Info.plist
│           │  │     ├─ MacOS
│           │  │     │  └─ maqh_v1 Helper (Renderer)
│           │  │     ├─ PkgInfo
│           │  │     └─ _CodeSignature
│           │  │        └─ CodeResources
│           │  └─ maqh_v1 Helper.app
│           │     └─ Contents
│           │        ├─ Info.plist
│           │        ├─ MacOS
│           │        │  └─ maqh_v1 Helper
│           │        ├─ PkgInfo
│           │        └─ _CodeSignature
│           │           └─ CodeResources
│           ├─ Info.plist
│           ├─ MacOS
│           │  └─ maqh_v1
│           ├─ PkgInfo
│           ├─ Resources
│           │  ├─ af.lproj
│           │  ├─ am.lproj
│           │  ├─ app-update.yml
│           │  ├─ app.asar
│           │  │  ├─ assets
│           │  │  │  ├─ icon_maqh_white.png
│           │  │  │  ├─ maqh.icns
│           │  │  │  ├─ maqh.ico
│           │  │  │  ├─ maqh.iconset
│           │  │  │  │  ├─ icon_128x128.png
│           │  │  │  │  ├─ icon_128x128@2x.png
│           │  │  │  │  ├─ icon_16x16.png
│           │  │  │  │  ├─ icon_16x16@2x.png
│           │  │  │  │  ├─ icon_256x256.png
│           │  │  │  │  ├─ icon_256x256@2x.png
│           │  │  │  │  ├─ icon_32x32.png
│           │  │  │  │  ├─ icon_32x32@2x.png
│           │  │  │  │  ├─ icon_512x512.png
│           │  │  │  │  └─ icon_512x512@2x.png
│           │  │  │  ├─ maqh.png
│           │  │  │  ├─ maqh_1024x1024_1024x1024.icns
│           │  │  │  ├─ maqh_128x128_128x128.icns
│           │  │  │  ├─ maqh_16x16_16x16.icns
│           │  │  │  ├─ maqh_256x256_256x256.icns
│           │  │  │  ├─ maqh_32x32_32x32.icns
│           │  │  │  ├─ maqh_512x512_512x512.icns
│           │  │  │  └─ maqh_64x64_64x64.icns
│           │  │  ├─ config
│           │  │  │  └─ config.json
│           │  │  ├─ data
│           │  │  │  ├─ EURONEXT_actions.csv
│           │  │  │  ├─ stock_data_all.json
│           │  │  │  └─ yahoo_api
│           │  │  │     ├─ AAA.json
│           │  │  │     ├─ AB.json
│           │  │  │     ├─ ABCA.json
│           │  │  │     ├─ ABEO.json
│           │  │  │     ├─ ABLD.json
│           │  │  │     ├─ ABNX.json
│           │  │  │     ├─ ABO.json
│           │  │  │     ├─ ABVX.json
│           │  │  │     ├─ AC.json
│           │  │  │     ├─ ACA.json
│           │  │  │     ├─ ACAN.json
│           │  │  │     ├─ ADOC.json
│           │  │  │     ├─ ADP.json
│           │  │  │     ├─ AELIS.json
│           │  │  │     ├─ AF.json
│           │  │  │     ├─ AFMBS.json
│           │  │  │     ├─ AFME.json
│           │  │  │     ├─ AI.json
│           │  │  │     ├─ AIR.json
│           │  │  │     ├─ AKE.json
│           │  │  │     ├─ AKOM.json
│           │  │  │     ├─ AKW.json
│           │  │  │     ├─ AL2SI.json
│           │  │  │     ├─ ALACT.json
│           │  │  │     ├─ ALADO.json
│           │  │  │     ├─ ALAFY.json
│           │  │  │     ├─ ALAGO.json
│           │  │  │     ├─ ALAGP.json
│           │  │  │     ├─ ALAGR.json
│           │  │  │     ├─ ALAIR.json
│           │  │  │     ├─ ALALO.json
│           │  │  │     ├─ ALAMA.json
│           │  │  │     ├─ ALAMG.json
│           │  │  │     ├─ ALAQU.json
│           │  │  │     ├─ ALARF.json
│           │  │  │     ├─ ALAST.json
│           │  │  │     ├─ ALATA.json
│           │  │  │     ├─ ALATI.json
│           │  │  │     ├─ ALAUD.json
│           │  │  │     ├─ ALAUR.json
│           │  │  │     ├─ ALAVE.json
│           │  │  │     ├─ ALAVI.json
│           │  │  │     ├─ ALBDM.json
│           │  │  │     ├─ ALBFR.json
│           │  │  │     ├─ ALBI.json
│           │  │  │     ├─ ALBIO.json
│           │  │  │     ├─ ALBIZ.json
│           │  │  │     ├─ ALBKK.json
│           │  │  │     ├─ ALBLD.json
│           │  │  │     ├─ ALBLU.json
│           │  │  │     ├─ ALBOA.json
│           │  │  │     ├─ ALBON.json
│           │  │  │     ├─ ALBOO.json
│           │  │  │     ├─ ALBOU.json
│           │  │  │     ├─ ALBPK.json
│           │  │  │     ├─ ALBPS.json
│           │  │  │     ├─ ALCAB.json
│           │  │  │     ├─ ALCAP.json
│           │  │  │     ├─ ALCAR.json
│           │  │  │     ├─ ALCBI.json
│           │  │  │     ├─ ALCBX.json
│           │  │  │     ├─ ALCHI.json
│           │  │  │     ├─ ALCIS.json
│           │  │  │     ├─ ALCJ.json
│           │  │  │     ├─ ALCLA.json
│           │  │  │     ├─ ALCLS.json
│           │  │  │     ├─ ALCOF.json
│           │  │  │     ├─ ALCOG.json
│           │  │  │     ├─ ALCOI.json
│           │  │  │     ├─ ALCOX.json
│           │  │  │     ├─ ALCRB.json
│           │  │  │     ├─ ALCUR.json
│           │  │  │     ├─ ALCWE.json
│           │  │  │     ├─ ALCYB.json
│           │  │  │     ├─ ALDAR.json
│           │  │  │     ├─ ALDBL.json
│           │  │  │     ├─ ALDBT.json
│           │  │  │     ├─ ALDEL.json
│           │  │  │     ├─ ALDEV.json
│           │  │  │     ├─ ALDLS.json
│           │  │  │     ├─ ALDLT.json
│           │  │  │     ├─ ALDMS.json
│           │  │  │     ├─ ALDNE.json
│           │  │  │     ├─ ALDNX.json
│           │  │  │     ├─ ALDOL.json
│           │  │  │     ├─ ALDRV.json
│           │  │  │     ├─ ALDUB.json
│           │  │  │     ├─ ALDUX.json
│           │  │  │     ├─ ALDV.json
│           │  │  │     ├─ ALDVI.json
│           │  │  │     ├─ ALEAC.json
│           │  │  │     ├─ ALECO.json
│           │  │  │     ├─ ALECP.json
│           │  │  │     ├─ ALECR.json
│           │  │  │     ├─ ALEMG.json
│           │  │  │     ├─ ALEMS.json
│           │  │  │     ├─ ALEMV.json
│           │  │  │     ├─ ALENE.json
│           │  │  │     ├─ ALENO.json
│           │  │  │     ├─ ALENR.json
│           │  │  │     ├─ ALENT.json
│           │  │  │     ├─ ALEO2.json
│           │  │  │     ├─ ALERS.json
│           │  │  │     ├─ ALESA.json
│           │  │  │     ├─ ALESE.json
│           │  │  │     ├─ ALESK.json
│           │  │  │     ├─ ALEUA.json
│           │  │  │     ├─ ALEUP.json
│           │  │  │     ├─ ALEXA.json
│           │  │  │     ├─ ALEXP.json
│           │  │  │     ├─ ALFBA.json
│           │  │  │     ├─ ALFLE.json
│           │  │  │     ├─ ALFLO.json
│           │  │  │     ├─ ALFPC.json
│           │  │  │     ├─ ALFRE.json
│           │  │  │     ├─ ALFUM.json
│           │  │  │     ├─ ALGAE.json
│           │  │  │     ├─ ALGAU.json
│           │  │  │     ├─ ALGBE.json
│           │  │  │     ├─ ALGEC.json
│           │  │  │     ├─ ALGEN.json
│           │  │  │     ├─ ALGEV.json
│           │  │  │     ├─ ALGID.json
│           │  │  │     ├─ ALGIL.json
│           │  │  │     ├─ ALGIR.json
│           │  │  │     ├─ ALGLD.json
│           │  │  │     ├─ ALGRO.json
│           │  │  │     ├─ ALGTR.json
│           │  │  │     ├─ ALHAF.json
│           │  │  │     ├─ ALHEX.json
│           │  │  │     ├─ ALHF.json
│           │  │  │     ├─ ALHGO.json
│           │  │  │     ├─ ALHGR.json
│           │  │  │     ├─ ALHIT.json
│           │  │  │     ├─ ALHOP.json
│           │  │  │     ├─ ALHPI.json
│           │  │  │     ├─ ALHRG.json
│           │  │  │     ├─ ALHRS.json
│           │  │  │     ├─ ALHUN.json
│           │  │  │     ├─ ALHYP.json
│           │  │  │     ├─ ALI2S.json
│           │  │  │     ├─ ALICA.json
│           │  │  │     ├─ ALICR.json
│           │  │  │     ├─ ALIDS.json
│           │  │  │     ├─ ALIE.json
│           │  │  │     ├─ ALIKO.json
│           │  │  │     ├─ ALIMO.json
│           │  │  │     ├─ ALIMP.json
│           │  │  │     ├─ ALIMR.json
│           │  │  │     ├─ ALINN.json
│           │  │  │     ├─ ALINS.json
│           │  │  │     ├─ ALINT.json
│           │  │  │     ├─ ALINV.json
│           │  │  │     ├─ ALISP.json
│           │  │  │     ├─ ALITL.json
│           │  │  │     ├─ ALJXR.json
│           │  │  │     ├─ ALKAL.json
│           │  │  │     ├─ ALKEM.json
│           │  │  │     ├─ ALKEY.json
│           │  │  │     ├─ ALKKO.json
│           │  │  │     ├─ ALKLA.json
│           │  │  │     ├─ ALKLH.json
│           │  │  │     ├─ ALKLK.json
│           │  │  │     ├─ ALKOM.json
│           │  │  │     ├─ ALLAM.json
│           │  │  │     ├─ ALLAN.json
│           │  │  │     ├─ ALLDL.json
│           │  │  │     ├─ ALLEC.json
│           │  │  │     ├─ ALLEX.json
│           │  │  │     ├─ ALLGO.json
│           │  │  │     ├─ ALLHB.json
│           │  │  │     ├─ ALLIX.json
│           │  │  │     ├─ ALLLN.json
│           │  │  │     ├─ ALLOG.json
│           │  │  │     ├─ ALLPL.json
│           │  │  │     ├─ ALLUX.json
│           │  │  │     ├─ ALMAR.json
│           │  │  │     ├─ ALMAS.json
│           │  │  │     ├─ ALMCE.json
│           │  │  │     ├─ ALMCP.json
│           │  │  │     ├─ ALMDG.json
│           │  │  │     ├─ ALMDP.json
│           │  │  │     ├─ ALMDT.json
│           │  │  │     ├─ ALMER.json
│           │  │  │     ├─ ALMET.json
│           │  │  │     ├─ ALMEX.json
│           │  │  │     ├─ ALMGI.json
│           │  │  │     ├─ ALMIB.json
│           │  │  │     ├─ ALMIC.json
│           │  │  │     ├─ ALMII.json
│           │  │  │     ├─ ALMIL.json
│           │  │  │     ├─ ALMIN.json
│           │  │  │     ├─ ALMKS.json
│           │  │  │     ├─ ALMKT.json
│           │  │  │     ├─ ALMLB.json
│           │  │  │     ├─ ALMOU.json
│           │  │  │     ├─ ALMRB.json
│           │  │  │     ├─ ALMUN.json
│           │  │  │     ├─ ALNEO.json
│           │  │  │     ├─ ALNEV.json
│           │  │  │     ├─ ALNFL.json
│           │  │  │     ├─ ALNLF.json
│           │  │  │     ├─ ALNMG.json
│           │  │  │     ├─ ALNMR.json
│           │  │  │     ├─ ALNN6.json
│           │  │  │     ├─ ALNOV.json
│           │  │  │     ├─ ALNRG.json
│           │  │  │     ├─ ALNSC.json
│           │  │  │     ├─ ALNSE.json
│           │  │  │     ├─ ALNTG.json
│           │  │  │     ├─ ALNXT.json
│           │  │  │     ├─ ALO.json
│           │  │  │     ├─ ALODC.json
│           │  │  │     ├─ ALOKW.json
│           │  │  │     ├─ ALOPM.json
│           │  │  │     ├─ ALORA.json
│           │  │  │     ├─ ALORD.json
│           │  │  │     ├─ ALPAR.json
│           │  │  │     ├─ ALPAT.json
│           │  │  │     ├─ ALPAU.json
│           │  │  │     ├─ ALPCV.json
│           │  │  │     ├─ ALPDX.json
│           │  │  │     ├─ ALPER.json
│           │  │  │     ├─ ALPHA.json
│           │  │  │     ├─ ALPHI.json
│           │  │  │     ├─ ALPJT.json
│           │  │  │     ├─ ALPM.json
│           │  │  │     ├─ ALPOU.json
│           │  │  │     ├─ ALPRE.json
│           │  │  │     ├─ ALPRG.json
│           │  │  │     ├─ ALPRI.json
│           │  │  │     ├─ ALPRO.json
│           │  │  │     ├─ ALPUL.json
│           │  │  │     ├─ ALQGC.json
│           │  │  │     ├─ ALQP.json
│           │  │  │     ├─ ALQWA.json
│           │  │  │     ├─ ALREA.json
│           │  │  │     ├─ ALREW.json
│           │  │  │     ├─ ALRFG.json
│           │  │  │     ├─ ALRGR.json
│           │  │  │     ├─ ALRIB.json
│           │  │  │     ├─ ALROC.json
│           │  │  │     ├─ ALRPD.json
│           │  │  │     ├─ ALSAF.json
│           │  │  │     ├─ ALSAS.json
│           │  │  │     ├─ ALSEI.json
│           │  │  │     ├─ ALSEN.json
│           │  │  │     ├─ ALSGD.json
│           │  │  │     ├─ ALSMA.json
│           │  │  │     ├─ ALSOG.json
│           │  │  │     ├─ ALSPT.json
│           │  │  │     ├─ ALSPW.json
│           │  │  │     ├─ ALSRS.json
│           │  │  │     ├─ ALSTI.json
│           │  │  │     ├─ ALSTW.json
│           │  │  │     ├─ ALTA.json
│           │  │  │     ├─ ALTAO.json
│           │  │  │     ├─ ALTBG.json
│           │  │  │     ├─ ALTD.json
│           │  │  │     ├─ ALTHE.json
│           │  │  │     ├─ ALTHO.json
│           │  │  │     ├─ ALTHX.json
│           │  │  │     ├─ ALTLX.json
│           │  │  │     ├─ ALTME.json
│           │  │  │     ├─ ALTOO.json
│           │  │  │     ├─ ALTPC.json
│           │  │  │     ├─ ALTRI.json
│           │  │  │     ├─ ALTRO.json
│           │  │  │     ├─ ALTTU.json
│           │  │  │     ├─ ALTUV.json
│           │  │  │     ├─ ALTXC.json
│           │  │  │     ├─ ALU10.json
│           │  │  │     ├─ ALUCI.json
│           │  │  │     ├─ ALUNT.json
│           │  │  │     ├─ ALUPG.json
│           │  │  │     ├─ ALUVI.json
│           │  │  │     ├─ ALVAL.json
│           │  │  │     ├─ ALVAP.json
│           │  │  │     ├─ ALVAZ.json
│           │  │  │     ├─ ALVDM.json
│           │  │  │     ├─ ALVER.json
│           │  │  │     ├─ ALVET.json
│           │  │  │     ├─ ALVG.json
│           │  │  │     ├─ ALVGO.json
│           │  │  │     ├─ ALVIA.json
│           │  │  │     ├─ ALVIN.json
│           │  │  │     ├─ ALVIO.json
│           │  │  │     ├─ ALVU.json
│           │  │  │     ├─ ALWEC.json
│           │  │  │     ├─ ALWED.json
│           │  │  │     ├─ ALWF.json
│           │  │  │     ├─ ALWIT.json
│           │  │  │     ├─ ALWTR.json
│           │  │  │     ├─ AM.json
│           │  │  │     ├─ AMPLI.json
│           │  │  │     ├─ AMUN.json
│           │  │  │     ├─ ANTIN.json
│           │  │  │     ├─ APAM.json
│           │  │  │     ├─ ARAMI.json
│           │  │  │     ├─ ARDO.json
│           │  │  │     ├─ AREIT.json
│           │  │  │     ├─ ARG.json
│           │  │  │     ├─ ARTE.json
│           │  │  │     ├─ ARTO.json
│           │  │  │     ├─ ARVBS.json
│           │  │  │     ├─ ARVEN.json
│           │  │  │     ├─ ASY.json
│           │  │  │     ├─ ATE.json
│           │  │  │     ├─ ATEME.json
│           │  │  │     ├─ ATLD.json
│           │  │  │     ├─ ATO.json
│           │  │  │     ├─ AUB.json
│           │  │  │     ├─ AUGR.json
│           │  │  │     ├─ AURE.json
│           │  │  │     ├─ AVT.json
│           │  │  │     ├─ AXW.json
│           │  │  │     ├─ AYV.json
│           │  │  │     ├─ BAIN.json
│           │  │  │     ├─ BALYO.json
│           │  │  │     ├─ BASS.json
│           │  │  │     ├─ BB.json
│           │  │  │     ├─ BEN.json
│           │  │  │     ├─ BIG.json
│           │  │  │     ├─ BIM.json
│           │  │  │     ├─ BIOS.json
│           │  │  │     ├─ BLC.json
│           │  │  │     ├─ BLEE.json
│           │  │  │     ├─ BLV.json
│           │  │  │     ├─ BN.json
│           │  │  │     ├─ BNBS.json
│           │  │  │     ├─ BNP.json
│           │  │  │     ├─ BOI.json
│           │  │  │     ├─ BOL.json
│           │  │  │     ├─ BON.json
│           │  │  │     ├─ BPBS.json
│           │  │  │     ├─ BPSBS.json
│           │  │  │     ├─ BSD.json
│           │  │  │     ├─ BUI.json
│           │  │  │     ├─ BUR.json
│           │  │  │     ├─ BVI.json
│           │  │  │     ├─ CA.json
│           │  │  │     ├─ CAF.json
│           │  │  │     ├─ CAFO.json
│           │  │  │     ├─ CAP.json
│           │  │  │     ├─ CARM.json
│           │  │  │     ├─ CARP.json
│           │  │  │     ├─ CAT31.json
│           │  │  │     ├─ CATG.json
│           │  │  │     ├─ CBBSA.json
│           │  │  │     ├─ CBDG.json
│           │  │  │     ├─ CBE.json
│           │  │  │     ├─ CBOT.json
│           │  │  │     ├─ CBR.json
│           │  │  │     ├─ CBSAB.json
│           │  │  │     ├─ CBSM.json
│           │  │  │     ├─ CCN.json
│           │  │  │     ├─ CDA.json
│           │  │  │     ├─ CDI.json
│           │  │  │     ├─ CEN.json
│           │  │  │     ├─ CFI.json
│           │  │  │     ├─ CGM.json
│           │  │  │     ├─ CHSR.json
│           │  │  │     ├─ CIV.json
│           │  │  │     ├─ CLA.json
│           │  │  │     ├─ CLARI.json
│           │  │  │     ├─ CMO.json
│           │  │  │     ├─ CNDF.json
│           │  │  │     ├─ CNV.json
│           │  │  │     ├─ CO.json
│           │  │  │     ├─ COBS1.json
│           │  │  │     ├─ COBS3.json
│           │  │  │     ├─ COFA.json
│           │  │  │     ├─ COH.json
│           │  │  │     ├─ COTY.json
│           │  │  │     ├─ COUR.json
│           │  │  │     ├─ COV.json
│           │  │  │     ├─ COVH.json
│           │  │  │     ├─ CRAP.json
│           │  │  │     ├─ CRAV.json
│           │  │  │     ├─ CRBP2.json
│           │  │  │     ├─ CRI.json
│           │  │  │     ├─ CRLA.json
│           │  │  │     ├─ CRLO.json
│           │  │  │     ├─ CROS.json
│           │  │  │     ├─ CRSU.json
│           │  │  │     ├─ CRTO.json
│           │  │  │     ├─ CS.json
│           │  │  │     ├─ CV.json
│           │  │  │     ├─ CYAD.json
│           │  │  │     ├─ CYBK1.json
│           │  │  │     ├─ CYBKA.json
│           │  │  │     ├─ CYBKB.json
│           │  │  │     ├─ DBG.json
│           │  │  │     ├─ DBV.json
│           │  │  │     ├─ DEC.json
│           │  │  │     ├─ DEEZR.json
│           │  │  │     ├─ DEEZW.json
│           │  │  │     ├─ DG.json
│           │  │  │     ├─ DIM.json
│           │  │  │     ├─ DKUPL.json
│           │  │  │     ├─ DMSBS.json
│           │  │  │     ├─ DPAM.json
│           │  │  │     ├─ DPT.json
│           │  │  │     ├─ DSY.json
│           │  │  │     ├─ EAPI.json
│           │  │  │     ├─ EC.json
│           │  │  │     ├─ EDEN.json
│           │  │  │     ├─ EDI.json
│           │  │  │     ├─ EEM.json
│           │  │  │     ├─ EFG.json
│           │  │  │     ├─ EFI.json
│           │  │  │     ├─ EGR.json
│           │  │  │     ├─ EIFF.json
│           │  │  │     ├─ EKI.json
│           │  │  │     ├─ EL.json
│           │  │  │     ├─ ELEC.json
│           │  │  │     ├─ ELIOR.json
│           │  │  │     ├─ ELIS.json
│           │  │  │     ├─ EMEBS.json
│           │  │  │     ├─ EMEIS.json
│           │  │  │     ├─ EN.json
│           │  │  │     ├─ ENGI.json
│           │  │  │     ├─ ENX.json
│           │  │  │     ├─ EOS.json
│           │  │  │     ├─ EQS.json
│           │  │  │     ├─ ERA.json
│           │  │  │     ├─ ERF.json
│           │  │  │     ├─ ES.json
│           │  │  │     ├─ ETL.json
│           │  │  │     ├─ EURS.json
│           │  │  │     ├─ EXA.json
│           │  │  │     ├─ EXE.json
│           │  │  │     ├─ EXENS.json
│           │  │  │     ├─ EXN.json
│           │  │  │     ├─ EXPL.json
│           │  │  │     ├─ FAYE.json
│           │  │  │     ├─ FCMC.json
│           │  │  │     ├─ FDE.json
│           │  │  │     ├─ FDJ.json
│           │  │  │     ├─ FGA.json
│           │  │  │     ├─ FGR.json
│           │  │  │     ├─ FII.json
│           │  │  │     ├─ FINM.json
│           │  │  │     ├─ FIPP.json
│           │  │  │     ├─ FLY.json
│           │  │  │     ├─ FMONC.json
│           │  │  │     ├─ FNAC.json
│           │  │  │     ├─ FNTS.json
│           │  │  │     ├─ FOAF.json
│           │  │  │     ├─ FORE.json
│           │  │  │     ├─ FORSE.json
│           │  │  │     ├─ FPG.json
│           │  │  │     ├─ FR.json
│           │  │  │     ├─ FREY.json
│           │  │  │     ├─ FRVIA.json
│           │  │  │     ├─ GALIM.json
│           │  │  │     ├─ GAM.json
│           │  │  │     ├─ GBT.json
│           │  │  │     ├─ GDS.json
│           │  │  │     ├─ GEA.json
│           │  │  │     ├─ GET.json
│           │  │  │     ├─ GFC.json
│           │  │  │     ├─ GJAJ.json
│           │  │  │     ├─ GLE.json
│           │  │  │     ├─ GLO.json
│           │  │  │     ├─ GNFT.json
│           │  │  │     ├─ GNRO.json
│           │  │  │     ├─ GPE.json
│           │  │  │     ├─ GRVO.json
│           │  │  │     ├─ GTT.json
│           │  │  │     ├─ GUI.json
│           │  │  │     ├─ HCO.json
│           │  │  │     ├─ HDF.json
│           │  │  │     ├─ HDP.json
│           │  │  │     ├─ HO.json
│           │  │  │     ├─ IAM.json
│           │  │  │     ├─ ICAD.json
│           │  │  │     ├─ IDIP.json
│           │  │  │     ├─ IDL.json
│           │  │  │     ├─ IMDA.json
│           │  │  │     ├─ INEA.json
│           │  │  │     ├─ INF.json
│           │  │  │     ├─ INFE.json
│           │  │  │     ├─ IPH.json
│           │  │  │     ├─ IPN.json
│           │  │  │     ├─ IPS.json
│           │  │  │     ├─ ITP.json
│           │  │  │     ├─ ITXT.json
│           │  │  │     ├─ IVA.json
│           │  │  │     ├─ JBOG.json
│           │  │  │     ├─ JCQ.json
│           │  │  │     ├─ KER.json
│           │  │  │     ├─ KOF.json
│           │  │  │     ├─ LACR.json
│           │  │  │     ├─ LAT.json
│           │  │  │     ├─ LBIRD.json
│           │  │  │     ├─ LEBL.json
│           │  │  │     ├─ LHYFE.json
│           │  │  │     ├─ LI.json
│           │  │  │     ├─ LIN.json
│           │  │  │     ├─ LNA.json
│           │  │  │     ├─ LOCAL.json
│           │  │  │     ├─ LOUP.json
│           │  │  │     ├─ LPE.json
│           │  │  │     ├─ LR.json
│           │  │  │     ├─ LSS.json
│           │  │  │     ├─ LTA.json
│           │  │  │     ├─ MAAT.json
│           │  │  │     ├─ MALT.json
│           │  │  │     ├─ MASBS.json
│           │  │  │     ├─ MAU.json
│           │  │  │     ├─ MBWS.json
│           │  │  │     ├─ MC.json
│           │  │  │     ├─ MDM.json
│           │  │  │     ├─ MEDCL.json
│           │  │  │     ├─ MEMS.json
│           │  │  │     ├─ MERY.json
│           │  │  │     ├─ METEX.json
│           │  │  │     ├─ MF.json
│           │  │  │     ├─ MHM.json
│           │  │  │     ├─ ML.json
│           │  │  │     ├─ MLAA.json
│           │  │  │     ├─ MLAAH.json
│           │  │  │     ├─ MLAAT.json
│           │  │  │     ├─ MLABC.json
│           │  │  │     ├─ MLACT.json
│           │  │  │     ├─ MLAEM.json
│           │  │  │     ├─ MLAGI.json
│           │  │  │     ├─ MLAGP.json
│           │  │  │     ├─ MLAIG.json
│           │  │  │     ├─ MLALE.json
│           │  │  │     ├─ MLALV.json
│           │  │  │     ├─ MLARD.json
│           │  │  │     ├─ MLARE.json
│           │  │  │     ├─ MLARI.json
│           │  │  │     ├─ MLARO.json
│           │  │  │     ├─ MLASO.json
│           │  │  │     ├─ MLAST.json
│           │  │  │     ├─ MLAZL.json
│           │  │  │     ├─ MLAZR.json
│           │  │  │     ├─ MLBAR.json
│           │  │  │     ├─ MLBBO.json
│           │  │  │     ├─ MLBIO.json
│           │  │  │     ├─ MLBMD.json
│           │  │  │     ├─ MLBON.json
│           │  │  │     ├─ MLBSP.json
│           │  │  │     ├─ MLCAC.json
│           │  │  │     ├─ MLCAN.json
│           │  │  │     ├─ MLCFD.json
│           │  │  │     ├─ MLCFM.json
│           │  │  │     ├─ MLCHE.json
│           │  │  │     ├─ MLCLI.json
│           │  │  │     ├─ MLCLP.json
│           │  │  │     ├─ MLCMB.json
│           │  │  │     ├─ MLCMG.json
│           │  │  │     ├─ MLCMI.json
│           │  │  │     ├─ MLCNT.json
│           │  │  │     ├─ MLCOE.json
│           │  │  │     ├─ MLCOR.json
│           │  │  │     ├─ MLCOT.json
│           │  │  │     ├─ MLCOU.json
│           │  │  │     ├─ MLCVG.json
│           │  │  │     ├─ MLDAM.json
│           │  │  │     ├─ MLDYN.json
│           │  │  │     ├─ MLDYX.json
│           │  │  │     ├─ MLEAS.json
│           │  │  │     ├─ MLEAV.json
│           │  │  │     ├─ MLECE.json
│           │  │  │     ├─ MLECO.json
│           │  │  │     ├─ MLEDR.json
│           │  │  │     ├─ MLEDS.json
│           │  │  │     ├─ MLEDU.json
│           │  │  │     ├─ MLEFA.json
│           │  │  │     ├─ MLERH.json
│           │  │  │     ├─ MLERO.json
│           │  │  │     ├─ MLETA.json
│           │  │  │     ├─ MLFDV.json
│           │  │  │     ├─ MLFIR.json
│           │  │  │     ├─ MLFNP.json
│           │  │  │     ├─ MLFSG.json
│           │  │  │     ├─ MLFTI.json
│           │  │  │     ├─ MLFXO.json
│           │  │  │     ├─ MLGAI.json
│           │  │  │     ├─ MLGAL.json
│           │  │  │     ├─ MLGDI.json
│           │  │  │     ├─ MLGEQ.json
│           │  │  │     ├─ MLGLA.json
│           │  │  │     ├─ MLGLB.json
│           │  │  │     ├─ MLGLW.json
│           │  │  │     ├─ MLGRC.json
│           │  │  │     ├─ MLGWH.json
│           │  │  │     ├─ MLHAY.json
│           │  │  │     ├─ MLHBB.json
│           │  │  │     ├─ MLHBP.json
│           │  │  │     ├─ MLHCF.json
│           │  │  │     ├─ MLHIN.json
│           │  │  │     ├─ MLHK.json
│           │  │  │     ├─ MLHMC.json
│           │  │  │     ├─ MLHOP.json
│           │  │  │     ├─ MLHOT.json
│           │  │  │     ├─ MLHPE.json
│           │  │  │     ├─ MLHYD.json
│           │  │  │     ├─ MLHYE.json
│           │  │  │     ├─ MLIDS.json
│           │  │  │     ├─ MLIFC.json
│           │  │  │     ├─ MLIFS.json
│           │  │  │     ├─ MLIME.json
│           │  │  │     ├─ MLIML.json
│           │  │  │     ├─ MLIMP.json
│           │  │  │     ├─ MLINM.json
│           │  │  │     ├─ MLINT.json
│           │  │  │     ├─ MLIPO.json
│           │  │  │     ├─ MLIPP.json
│           │  │  │     ├─ MLIRF.json
│           │  │  │     ├─ MLISP.json
│           │  │  │     ├─ MLITN.json
│           │  │  │     ├─ MLJ21.json
│           │  │  │     ├─ MLJDL.json
│           │  │  │     ├─ MLLAB.json
│           │  │  │     ├─ MLLCB.json
│           │  │  │     ├─ MLLOI.json
│           │  │  │     ├─ MLMAB.json
│           │  │  │     ├─ MLMAD.json
│           │  │  │     ├─ MLMAQ.json
│           │  │  │     ├─ MLMCA.json
│           │  │  │     ├─ MLMFI.json
│           │  │  │     ├─ MLMGL.json
│           │  │  │     ├─ MLMIB.json
│           │  │  │     ├─ MLMIV.json
│           │  │  │     ├─ MLMTP.json
│           │  │  │     ├─ MLMUT.json
│           │  │  │     ├─ MLNDG.json
│           │  │  │     ├─ MLNMA.json
│           │  │  │     ├─ MLNOV.json
│           │  │  │     ├─ MLOCT.json
│           │  │  │     ├─ MLOKP.json
│           │  │  │     ├─ MLONE.json
│           │  │  │     ├─ MLONL.json
│           │  │  │     ├─ MLORB.json
│           │  │  │     ├─ MLORQ.json
│           │  │  │     ├─ MLPAC.json
│           │  │  │     ├─ MLPER.json
│           │  │  │     ├─ MLPET.json
│           │  │  │     ├─ MLPHO.json
│           │  │  │     ├─ MLPHW.json
│           │  │  │     ├─ MLPLC.json
│           │  │  │     ├─ MLPRI.json
│           │  │  │     ├─ MLPRX.json
│           │  │  │     ├─ MLPVG.json
│           │  │  │     ├─ MLSAG.json
│           │  │  │     ├─ MLSCI.json
│           │  │  │     ├─ MLSDN.json
│           │  │  │     ├─ MLSEQ.json
│           │  │  │     ├─ MLSGT.json
│           │  │  │     ├─ MLSIL.json
│           │  │  │     ├─ MLSML.json
│           │  │  │     ├─ MLSMP.json
│           │  │  │     ├─ MLSRP.json
│           │  │  │     ├─ MLSTR.json
│           │  │  │     ├─ MLSUM.json
│           │  │  │     ├─ MLTRA.json
│           │  │  │     ├─ MLTRO.json
│           │  │  │     ├─ MLUAV.json
│           │  │  │     ├─ MLUMG.json
│           │  │  │     ├─ MLURC.json
│           │  │  │     ├─ MLVER.json
│           │  │  │     ├─ MLVIE.json
│           │  │  │     ├─ MLVIN.json
│           │  │  │     ├─ MLVIR.json
│           │  │  │     ├─ MLVRE.json
│           │  │  │     ├─ MLVRF.json
│           │  │  │     ├─ MLVST.json
│           │  │  │     ├─ MLVSY.json
│           │  │  │     ├─ MLWEA.json
│           │  │  │     ├─ MLWEL.json
│           │  │  │     ├─ MLWEY.json
│           │  │  │     ├─ MLWIZ.json
│           │  │  │     ├─ MLZAM.json
│           │  │  │     ├─ MMB.json
│           │  │  │     ├─ MMT.json
│           │  │  │     ├─ MONT.json
│           │  │  │     ├─ MRM.json
│           │  │  │     ├─ MRN.json
│           │  │  │     ├─ MT.json
│           │  │  │     ├─ MTU.json
│           │  │  │     ├─ NACON.json
│           │  │  │     ├─ NANO.json
│           │  │  │     ├─ NEOEN.json
│           │  │  │     ├─ NEX.json
│           │  │  │     ├─ NHOA.json
│           │  │  │     ├─ NICBS.json
│           │  │  │     ├─ NK.json
│           │  │  │     ├─ NOKIA.json
│           │  │  │     ├─ NR21.json
│           │  │  │     ├─ NRG.json
│           │  │  │     ├─ NRO.json
│           │  │  │     ├─ NXI.json
│           │  │  │     ├─ ODET.json
│           │  │  │     ├─ OPM.json
│           │  │  │     ├─ OR.json
│           │  │  │     ├─ ORA.json
│           │  │  │     ├─ ORAP.json
│           │  │  │     ├─ OREGE.json
│           │  │  │     ├─ ORIA.json
│           │  │  │     ├─ OSE.json
│           │  │  │     ├─ OVH.json
│           │  │  │     ├─ PAR.json
│           │  │  │     ├─ PARP.json
│           │  │  │     ├─ PARRO.json
│           │  │  │     ├─ PAT.json
│           │  │  │     ├─ PATBS.json
│           │  │  │     ├─ PERR.json
│           │  │  │     ├─ PEUG.json
│           │  │  │     ├─ PHXM.json
│           │  │  │     ├─ PIG.json
│           │  │  │     ├─ PLNW.json
│           │  │  │     ├─ PLX.json
│           │  │  │     ├─ POXEL.json
│           │  │  │     ├─ PRC.json
│           │  │  │     ├─ PROAC.json
│           │  │  │     ├─ PROBT.json
│           │  │  │     ├─ PSAT.json
│           │  │  │     ├─ PUB.json
│           │  │  │     ├─ PVL.json
│           │  │  │     ├─ PWG.json
│           │  │  │     ├─ QDT.json
│           │  │  │     ├─ RAL.json
│           │  │  │     ├─ RBO.json
│           │  │  │     ├─ RBT.json
│           │  │  │     ├─ RCO.json
│           │  │  │     ├─ RF.json
│           │  │  │     ├─ RI.json
│           │  │  │     ├─ RMS.json
│           │  │  │     ├─ RNO.json
│           │  │  │     ├─ ROCBT.json
│           │  │  │     ├─ RUI.json
│           │  │  │     ├─ RXL.json
│           │  │  │     ├─ S30.json
│           │  │  │     ├─ SABE.json
│           │  │  │     ├─ SACI.json
│           │  │  │     ├─ SAF.json
│           │  │  │     ├─ SAMS.json
│           │  │  │     ├─ SAN.json
│           │  │  │     ├─ SAVE.json
│           │  │  │     ├─ SBT.json
│           │  │  │     ├─ SCHP.json
│           │  │  │     ├─ SCR.json
│           │  │  │     ├─ SDG.json
│           │  │  │     ├─ SEC.json
│           │  │  │     ├─ SEFER.json
│           │  │  │     ├─ SELER.json
│           │  │  │     ├─ SESG.json
│           │  │  │     ├─ SFCA.json
│           │  │  │     ├─ SFPI.json
│           │  │  │     ├─ SGO.json
│           │  │  │     ├─ SGRO.json
│           │  │  │     ├─ SIGHT.json
│           │  │  │     ├─ SK.json
│           │  │  │     ├─ SLCO.json
│           │  │  │     ├─ SMCP.json
│           │  │  │     ├─ SMLBS.json
│           │  │  │     ├─ SOI.json
│           │  │  │     ├─ SOLB.json
│           │  │  │     ├─ SOP.json
│           │  │  │     ├─ SPEL.json
│           │  │  │     ├─ SPIE.json
│           │  │  │     ├─ SQI.json
│           │  │  │     ├─ SRP.json
│           │  │  │     ├─ STF.json
│           │  │  │     ├─ STLAP.json
│           │  │  │     ├─ STMPA.json
│           │  │  │     ├─ STRBS.json
│           │  │  │     ├─ STWBS.json
│           │  │  │     ├─ SU.json
│           │  │  │     ├─ SW.json
│           │  │  │     ├─ SWP.json
│           │  │  │     ├─ SYENS.json
│           │  │  │     ├─ TAYN.json
│           │  │  │     ├─ TDBS.json
│           │  │  │     ├─ TE.json
│           │  │  │     ├─ TEP.json
│           │  │  │     ├─ TERBS.json
│           │  │  │     ├─ TFF.json
│           │  │  │     ├─ TFI.json
│           │  │  │     ├─ THEP.json
│           │  │  │     ├─ TITC.json
│           │  │  │     ├─ TKO.json
│           │  │  │     ├─ TKTT.json
│           │  │  │     ├─ TMBSZ.json
│           │  │  │     ├─ TNG.json
│           │  │  │     ├─ TOUP.json
│           │  │  │     ├─ TRACT.json
│           │  │  │     ├─ TRI.json
│           │  │  │     ├─ TTE.json
│           │  │  │     ├─ TVRB.json
│           │  │  │     ├─ UBI.json
│           │  │  │     ├─ UNBL.json
│           │  │  │     ├─ URW.json
│           │  │  │     ├─ VAC.json
│           │  │  │     ├─ VACBS.json
│           │  │  │     ├─ VACBT.json
│           │  │  │     ├─ VANBS.json
│           │  │  │     ├─ VANTI.json
│           │  │  │     ├─ VCT.json
│           │  │  │     ├─ VETO.json
│           │  │  │     ├─ VIE.json
│           │  │  │     ├─ VIL.json
│           │  │  │     ├─ VIRI.json
│           │  │  │     ├─ VIRP.json
│           │  │  │     ├─ VIV.json
│           │  │  │     ├─ VK.json
│           │  │  │     ├─ VKBS.json
│           │  │  │     ├─ VLA.json
│           │  │  │     ├─ VLTSA.json
│           │  │  │     ├─ VMX.json
│           │  │  │     ├─ VRAP.json
│           │  │  │     ├─ VRLA.json
│           │  │  │     ├─ VTR.json
│           │  │  │     ├─ VU.json
│           │  │  │     ├─ WAGA.json
│           │  │  │     ├─ WAVE.json
│           │  │  │     ├─ WLN.json
│           │  │  │     ├─ XFAB.json
│           │  │  │     └─ XIL.json
│           │  │  ├─ index.html
│           │  │  ├─ main.js
│           │  │  ├─ package.json
│           │  │  └─ src
│           │  │     ├─ config.js
│           │  │     ├─ grid.js
│           │  │     ├─ main.js
│           │  │     ├─ parametre.js
│           │  │     ├─ script.js
│           │  │     ├─ sidebar.js
│           │  │     ├─ style.css
│           │  │     └─ utils.js
│           │  ├─ ar.lproj
│           │  ├─ bg.lproj
│           │  ├─ bn.lproj
│           │  ├─ ca.lproj
│           │  ├─ cs.lproj
│           │  ├─ da.lproj
│           │  ├─ de.lproj
│           │  ├─ el.lproj
│           │  ├─ en.lproj
│           │  ├─ en_GB.lproj
│           │  ├─ es.lproj
│           │  ├─ es_419.lproj
│           │  ├─ et.lproj
│           │  ├─ fa.lproj
│           │  ├─ fi.lproj
│           │  ├─ fil.lproj
│           │  ├─ fr.lproj
│           │  ├─ gu.lproj
│           │  ├─ he.lproj
│           │  ├─ hi.lproj
│           │  ├─ hr.lproj
│           │  ├─ hu.lproj
│           │  ├─ icon.icns
│           │  ├─ id.lproj
│           │  ├─ it.lproj
│           │  ├─ ja.lproj
│           │  ├─ kn.lproj
│           │  ├─ ko.lproj
│           │  ├─ lt.lproj
│           │  ├─ lv.lproj
│           │  ├─ ml.lproj
│           │  ├─ mr.lproj
│           │  ├─ ms.lproj
│           │  ├─ nb.lproj
│           │  ├─ nl.lproj
│           │  ├─ pl.lproj
│           │  ├─ pt_BR.lproj
│           │  ├─ pt_PT.lproj
│           │  ├─ ro.lproj
│           │  ├─ ru.lproj
│           │  ├─ sk.lproj
│           │  ├─ sl.lproj
│           │  ├─ sr.lproj
│           │  ├─ sv.lproj
│           │  ├─ sw.lproj
│           │  ├─ ta.lproj
│           │  ├─ te.lproj
│           │  ├─ th.lproj
│           │  ├─ tr.lproj
│           │  ├─ uk.lproj
│           │  ├─ ur.lproj
│           │  ├─ vi.lproj
│           │  ├─ zh_CN.lproj
│           │  └─ zh_TW.lproj
│           └─ _CodeSignature
│              └─ CodeResources
├─ generateFiles.js
├─ generate_per_sector.py
├─ index.html
├─ main.js
├─ maqh_structure.excalidraw
├─ notation.py
├─ package-lock.json
├─ package.json
├─ src
│  ├─ .DS_Store
│  ├─ components
│  │  ├─ cardModal
│  │  │  ├─ cardModal.js
│  │  │  ├─ cardModalDetail.js
│  │  │  ├─ cardModalNotation.js
│  │  │  ├─ conditions.js
│  │  │  ├─ graph.js
│  │  │  └─ notation_setting.js
│  │  └─ evaluation
│  │     └─ evaluationView.js
│  ├─ config.js
│  ├─ grid.js
│  ├─ main.js
│  ├─ parametre.js
│  ├─ script.js
│  ├─ search
│  │  ├─ commands
│  │  │  ├─ AI.js
│  │  │  ├─ index.js
│  │  │  ├─ note.js
│  │  │  └─ secteur.js
│  │  ├─ engine.js
│  │  ├─ index.js
│  │  └─ ui
│  │     ├─ chips.js
│  │     └─ palette.js
│  ├─ searchInput.js
│  ├─ sidebar.js
│  ├─ style.css
│  └─ utils.js
├─ test_single_file.py
├─ to_do.txt
└─ transformation_PER_Sec.py

```
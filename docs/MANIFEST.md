# DESCRIPTIO FORGE – Architektur-Manifest & UI-Stilguide

> **Systemname:** Descriptio Forge (Catalog Harvester, Rule Compiler & Symbol Batch Studio)  
> **Laufzeitumgebung:** Lokaler Entwicklungsserver (Node.js Backend + React/Vite Frontend)  
> **Zielsystem:** Exportiert 100 % validierte, flach kompilierte Artikel- und Symboldatenpakete (`.descriptio.json`) für die E-CAD-Suite **Descriptio**.  
> **Status:** Verbindliche Grundlagenspezifikation (Version 1.0)

---

# TEIL 1: ARCHITEKTUR-MANIFEST & SYSTEMGRUNDLAGEN

## 1. Kernphilosophie & Systemabgrenzung

Um die Hauptapplikation **Descriptio** frei von Scraping-Overhead, unfertigen Staging-Daten, LLM-Prompts und Vererbungslogik zu halten, arbeitet **Descriptio Forge** als eigenständige, lokale „Datenfabrik“.

### Die 4 Grundgesetze von Descriptio Forge:
1. **Trennung von Rohdaten-Cache und Durchläufen (Run-Isolation):**  
   Einmal heruntergeladene HTML-Seiten und PDF-Datenblätter werden global gecacht (nie doppelt scrapen!). Jede KI-Extraktion und Regel-Kompilierung läuft jedoch in einem isolierten, klonbaren **Run-Snapshot** (eigene SQLite-Datei pro Durchlauf).
2. **KI extrahiert nur Fakten – deterministischer Code baut das E-CAD-Modell:**  
   Das LLM liest nur das aus dem Datenblatt, was explizit dort steht. Komplexe E-CAD-Strukturen (Pin-Logik für ERC, Potenzialweitergabe, IEC-Kennbuchstaben, Baureihen-Drehmomente, 3D-Pin-Koordinaten) werden durch einen deterministischen **Regel-Compiler** aus **IEC-Archetypen** und **Baureihen-Vorlagen (Series)** erzeugt.
3. **Zero-Git-Leak Security (Out-of-Repo Vault):**  
   API-Keys, Provider-Konfigurationen und lokale Datenbanken liegen **niemals** im Git-Projektverzeichnis, sondern zwingend außerhalb des Repositories im Betriebssystem-Benutzerverzeichnis (`~/.descriptio-forge/`).
4. **Flattening vor dem Export:**  
   Descriptio Forge löst alle Vererbungen (Baureihe -> Artikel) und Heuristiken vor dem Export auf. Das ausgegebene JSON-Paket ist flach, vollständig typisiert und direkt in Descriptio importierbar.

---

## 2. Technologie-Stack

* **Runtime & Backend:** Node.js (TypeScript, ESM), Fastify + tRPC (für 100 % End-to-End Type-Safety zum Frontend).
* **Datenbank-Engine:** `better-sqlite3` (synchron, extrem schnell, erlaubt Datei-basierte Snapshots in Millisekunden).
* **Scraping & Ingestion:** `Playwright` (für JS-gerenderte Herstellerseiten wie Siemens SiePortal / Phoenix Contact), `Cheerio` (für schnelle ETIM-/ECLASS-HTML-Tabellen), `pdfjs-dist` / nativer Multimodal-PDF-Upload.
* **Validierung & Schema-Sharing:** `Zod` (identische Ziel-Schemata wie in der Descriptio-Hauptapplikation).
* **Queue & Concurrency:** `p-limit` + persistente Job-Tabelle in SQLite (pausierbare, absturzsichere Batch-Läufe für 20.000+ Artikel).
* **Frontend:** React 18+, Vite, Tailwind CSS, `@tanstack/react-table` (v8), `@tanstack/react-virtual` (für flüssiges Scrollen bei 20.000 Zeilen im 24px-Grid), `Lucide React` Icons.

---

## 3. Das „Run-Vault“-System (Durchläufe speichern, klonen & testen)

Beim Extrahieren von 20.000 Artikeln sind mehrere Iterationen die Regel. Um gefahrlos mit neuen Prompts, anderen KI-Modellen oder geänderten Baureihen-Regeln experimentieren zu können, ist die Datenhaltung zweigeteilt:

### 3.1 `global-vault.sqlite` (Unveränderliches Fundament)
Überlebt alle Testläufe und wird niemals zurückgesetzt:
* **`raw_documents`:** Gecachte HTML-DOMs, ETIM-Tabellen, heruntergeladene PDF-Dateien (mit SHA-256 Hash).
* **`ai_providers` & `ai_models`:** Konfigurierte KI-Anbieter, abgerufene Modell-Listen, Token-Preise.
* **`iec_archetypes`:** Globale Vorlagen für Bauteilkategorien (Schütze, LS-Schalter, Klemmen, Netzteile inkl. `CatalogFunctionGroup` und Pin-Rollen).
* **`symbol_library`:** Globale IEC 60617 SVG-Symbole (Vorbereitung für den Symbol-Designer).

### 3.2 Isolierte Run-Datenbanken (`runs/run_<id>_<name>.sqlite`)
Jeder Durchlauf („Run“) ist eine eigenständige SQLite-Datei im Ordner `~/.descriptio-forge/runs/`:
* **Inhalt eines Runs:** Artikel-Liste (`staged_parts`), KI-Roh-Outputs (`ai_extractions`), Baureihen-Regeln (`series_overrides`), kompilierte Pins (`compiled_pins`), Funktionsgruppen (`compiled_function_groups`) und Validierungs-Status (`validation_logs`).
* **Kern-Operationen im UI:**
  1. **Neuer Run (Empty / Aus Artikelnummern-Liste):** Startet auf der grünen Wiese.
  2. **Run klonen / Branch erstellen (`Fork Run`):** Kopiert die aktuelle `.sqlite`-Datei per `better-sqlite3` Backup-API in unter 50 ms (z. B. `Run #04 Eaton Basis` -> `Run #05 Test mit DeepSeek-V3`).
  3. **Snapshot einfrieren (`Lock / Archive`):** Setzt einen Run auf `READ_ONLY`, damit ein erfolgreicher Stand (z. B. „Weidmüller Reihenklemmen v1.0 – Fertig exportiert“) niemals versehentlich überschrieben wird.
  4. **Run-Diffing:** Vergleicht zwei Runs tabellarisch (z. B. *„Was hat Prompt V2 im Vergleich zu Prompt V1 bei 50 Eaton-Schützen verändert?“*).

---

## 4. Multi-Provider KI-Gateway & Out-of-Repo Security

### 4.1 Physische Trennung der API-Keys (Kein GitHub-Leak möglich)
Das Projekt-Repository enthält **keinerlei** `.env`-Dateien mit echten Schlüsseln. Stattdessen greift der Node.js-Server über `os.homedir()` auf ein Verzeichnis außerhalb des Projektordners zu:
* **Windows:** `C:\Users\<Username>\.descriptio-forge\credentials.json`
* **Linux / macOS:** `/home/<username>/.descriptio-forge/credentials.json`

Selbst bei einem fehlerhaften `git add -A` im Projektordner ist es technisch unmöglich, die API-Keys in GitHub hochzuladen. Optional werden die Keys in der `credentials.json` zusätzlich mit einem lokalen Maschinen-Schlüssel (AES-256-GCM) verschleiert.

### 4.2 Unterstützte Provider-Architektur (Unified Adapter)
Das KI-Gateway abstrahiert verschiedene Anbieter über ein einheitliches Interface (`IAiProviderAdapter`):
1. **Google Gemini API (Nativ):** Ideal für direkten PDF-Byte-Upload (Multimodal) und extrem günstige Massenverarbeitung (z. B. Gemini 2.5 Flash / Pro).
2. **OpenAI API (Nativ):** Für Structured Outputs (`json_schema`) und Reasoning-Modelle.
3. **Anthropic API (Claude):** Für komplexe Datenblatt-Analysen und SVG-Symbol-Generierung.
4. **OpenAI-Kompatible Endpoints (Universal-Adapter):**
   * **OpenRouter:** Zugriff auf hunderte Modelle über einen Key.
   * **DeepSeek API:** Extrem kostengünstige Text-/HTML-Extraktion.
   * **Lokale Modelle (Ollama / LM Studio / vLLM):** `http://localhost:11434/v1` für 0,00 EUR Kosten bei großen Vorfilter-Läufen.

### 4.3 Pflichtfunktionen im KI-Provider-Manager (UI & Backend)
* **Live-Verbindungstest (`Test Connection` Button):**  
  Sendet einen minimalen Test-Request an den gewählten Provider, prüft Authentifizierung, misst die Antwortzeit in `ms` und zeigt den Status (`OK 142ms` oder exakte HTTP-Fehlermeldung) sofort in der 24px-Zeile an.
* **Dynamischer Modell-Abruf (`Fetch & Sync Models` Button):**  
  Ruft über den jeweiligen API-Endpunkt (z. B. `GET /v1/models` oder Gemini `models.list`) alle für diesen API-Key freigeschalteten Modelle live ab und speichert sie in der `global-vault.sqlite`.
* **Aufgaben-Routing (Model Assignment):**  
  Der Nutzer kann in der Tabelle gezielt festlegen, welches abgerufene Modell für welche Aufgabe genutzt wird:
  * `TASK_HTML_EXTRACT` (Schnell & billig, z. B. Gemini Flash / DeepSeek)
  * `TASK_PDF_VISION` (Multimodal für Zeichnungen/Beipackzettel)
  * `TASK_SYMBOL_SVG` (Code-/Geometrie-starkes Modell für den zukünftigen Symbol-Designer)
* **Kosten- & Token-Wächter:**  
  Vor jedem Batch-Lauf (z. B. 5.000 Artikel) berechnet die App die geschätzten Input-/Output-Tokens und zeigt die voraussichtlichen Kosten in EUR/USD an, inklusive eines konfigurierbaren **Hard-Stop-Budgets** pro Run.

---

## 5. Die 4-Stufen-Pipeline (Vom Artikelnamen zum Descriptio-JSON)

Jeder Artikel durchläuft in einem Run vier klar getrennte Status-Stufen:

1. **Stufe 1: `INGESTED` (Rohdaten-Sammlung)**  
   HTML-Produktseite (ETIM-Tabelle) und/oder PDF-Datenblatt liegen im globalen Cache vor.
2. **Stufe 2: `AI_EXTRACTED` (Fakten-Extraktion)**  
   KI extrahiert Basisdaten (Maße, Nennspannung, Nennstrom, Verlustleistung, Querschnitt, Baureihen-Name) und ordnet den passenden **IEC-Archetyp** zu (z. B. `CONTACTOR_3P_1NO`). Nicht gefundene Werte bleiben strikt `null`.
3. **Stufe 3: `COMPILED` (Deterministischer Regel-Compiler)**  
   Ein TypeScript-Compiler verheiratet den KI-Output mit:
   * dem **IEC-Archetyp** (erzeugt `CatalogFunctionGroup`, `CatalogPin`, `potentialPropagation`, `pinElectricalRole`, `defaultBmkPrefix`),
   * der **Baureihen-Vorlage (`Series`)** (ergänzt fehlende Werte wie `torque`, `strippingLength`, `maxCrossSecTwin`, `dinRailMountOffsetY`, `PartAccessoryRelation`),
   * der **Geometrie-Heuristik** (berechnet `physicalOffsetX/Y/Z` und `wireEntryDirection`, sofern keine echten CAD-Koordinaten vorliegen, und markiert diese mit `isHeuristicValue: true`).
4. **Stufe 4: `VALIDATED / EXPORT_READY` (Qualitäts-Gate)**  
   Zod-Schema-Prüfung gegen das Descriptio-Datenmodell. Berechnung des Qualitäts-Scores (`GOLD`, `SILVER`, `BRONZE`) und Export als `.descriptio.json`.

---

## 6. Vorbereitete Architektur: Symbol-Designer & KI-Batching (Phase 2)

Obwohl der grafische Symbol-Designer erst in einer späteren Ausbaustufe implementiert wird, sind Datenbank, UI-Navigation und KI-Pipeline bereits vollständig darauf vorbereitet:

* **Datenbank-Slot (`symbol_definitions` in `global-vault.sqlite`):**  
  Speichert IEC 60617 konforme SVGs, Raster-Metadaten (4mm/8mm Grid), Pin-Andockpunkte (`x, y, topologyDir`) und die Zuordnung zu `CatalogFunctionGroup`.
* **KI-Symbol-Batching (Geplante Pipeline):**  
  * *Modus A (Auto-Mapping):* KI prüft neue Artikel/Archetypen und weist ihnen bestehende Standard-Symbole aus der Bibliothek zu.
  * *Modus B (SVG-Synthese aus Datenblatt-Schaltbild):* Vision-LLM schneidet das aufgedruckte Schaltbild aus dem PDF-Datenblatt (z. B. komplexes Sicherheitsrelais oder Frequenzumrichter) aus und generiert daraus im Batch einen normgerechten SVG-Rohling im 4mm-Raster zur Schnellkontrolle im Symbol-Designer.
* **UI-Slot:**  
  In der Hauptnavigation und im rechten Inspector-Panel ist das Modul `Symbol Studio (IEC 60617)` bereits als fester Knotenpunkt verankert.

---

## 7. Verzeichnisstruktur (Repo vs. Lokales System)

    # 1. AUSSERHALB DES GIT-REPOS (Lokales OS-User-Verzeichnis: ~/.descriptio-forge/)
    ~/.descriptio-forge/
    ├── credentials.json                 # Geheime API-Keys (NIEMALS im Git!)
    ├── global-vault.sqlite              # Globaler HTML/PDF-Cache, KI-Modelle, Archetypen, Symbole
    ├── raw-cache/                       # Heruntergeladene PDFs & HTML-Snapshots (nach SHA256)
    ├── runs/                            # Isolierte SQLite-Datenbanken pro Durchlauf
    │   ├── run_001_eaton_dilm_v1.sqlite
    │   ├── run_002_eaton_dilm_v2_fork.sqlite
    │   └── run_003_weidmueller_wdu.sqlite
    └── exports/                         # Fertige .descriptio.json Pakete für den Import

    # 2. INNERHALB DES GITHUB-REPOS (descriptio-forge/)
    descriptio-forge/
    ├── MANIFEST.md                      # Dieses Dokument (Architektur & UI-Stilguide)
    ├── AGENT_PLAN.md                    # Detaillierter Implementierungsplan für den Agenten
    ├── package.json                     # Workspaces (apps/server, apps/web, packages/shared)
    ├── packages/
    │   └── shared/                      # Geteilte Zod-Schemata (Descriptio Export, Archetypen, KI-Schemas)
    ├── apps/
    │   ├── server/                      # Node.js + Fastify + tRPC + better-sqlite3
    │   │   └── src/
    │   │       ├── vault/               # Zugriff auf ~/.descriptio-forge/ & Run-Cloner
    │   │       ├── ai-gateway/          # Multi-Provider-Adapter, Connection-Tester, Model-Fetcher
    │   │       ├── scraper/             # Playwright / Cheerio / PDF-Ingestion
    │   │       ├── compiler/            # Deterministischer Archetyp-, Serien- & Geometrie-Compiler
    │   │       ├── symbol-engine/       # [Platzhalter Phase 2] KI-SVG-Generator & Pin-Snapper
    │   │       └── exporter/            # Generator für .descriptio.json Pakete
    │   └── web/                         # React + Vite + Tailwind + TanStack Table (24px Industrie-UI)
    │       └── src/
    │           ├── components/
    │           │   ├── tree/            # HighDensityTreeGrid.tsx (24px Standard)
    │           │   ├── hover/           # IndustrialHoverCard.tsx (600ms Delay)
    │           │   └── inspector/       # 24px Property-Grid Inspector
    │           └── views/
    │               ├── RunManagerView/  # Durchläufe verwalten, klonen, vergleichen
    │               ├── HarvestGridView/ # Haupttabelle (20.000 Artikel, Tree: Serie -> Artikel -> Pins)
    │               ├── ArchetypeView/   # IEC-Archetypen & Baureihen-Vererbung pflegen
    │               ├── AiVaultView/     # Provider, API-Test, Modell-Sync & Kosten-Kontrolle
    │               └── SymbolStudioView/# [Vorbereitet für Phase 2] Symbol-Designer & KI-Batch

---

# TEIL 2: UI-STILGUIDE FÜR DESCRIPTIO FORGE (24px Industrie- / IDE-Look)

> **Status:** Verbindlicher Architektur- und UI-Standard für die gesamte **Descriptio Forge** Applikation  
> **Geltungsbereich:** Alle Listen, Hierarchiebäume, Tabellen, Sidebar-Navigatoren, Inspektoren und Werkzeugleisten  
> **Ziel:** Maximale Informationsdichte, absolute visuelle Ruhe, pixelgenaue Ausrichtung und intuitive Hierarchie-Führung bei der Massenverarbeitung von 20.000+ Katalogartikeln und Symbolen.

---

## 1. Philosophie & Gestaltungsprinzipien

In professioneller Engineering- und Datenaufbereitungs-Software steht **die effiziente Informationsaufnahme und Arbeitsgeschwindigkeit** an oberster Stelle. Klassische Web-UI-Muster mit großem Weißraum, runden "Pillen"-Buttons, unruhigen Schatten und variablen Zeilenhöhen erzeugen kognitive Unruhe und verschwenden wertvollen Bildschirmplatz.

### Die 7 Säulen des Industrie-Looks:
1. **Maximale Datendichte ("Zero Waste"):**  
   Jeder vertikale Pixel zählt. Zeilenhöhen sind strikt auf **24px** standardisiert, sodass 30–50 Datensätze (Artikel, Funktionsgruppen, Pins, KI-Modelle) ohne Scrollen auf einen Blick erfassbar sind.
2. **Visuelle Führung durch Führungslinien statt Leerraum:**  
   Verschachtelungen (`Baureihe -> Artikel -> Funktionsgruppe -> Pin`) werden nicht durch riesige Einrückungen verdeutlicht, sondern durch feine, ununterbrochene L-Führungslinien (Windows Explorer / STEP-CAD-Standard).
3. **Status-Spalte ganz links (`w-[28px]`):**  
   Eine sehr schmale Spalte (28px) ohne Spaltentitel zeigt ausschließlich kompakte Status-Icons (z. B. Rohdaten geladen, KI extrahiert, Kompiliert, Validierungsfehler) zentriert an.
4. **Excel-Gitternetz:**  
   Jede Zelle besitzt feste horizontale und vertikale Trennlinien (`border-r border-b`) für ermüdungsfreies horizontales Verfolgen von Parametern.
5. **Ziffernflucht & Tabellarische Ausrichtung:**  
   Numerische Werte (Maße, Ströme, Querschnitte, Drehmomente, Token-Preise, API-Latenzen) fluchten immer rechtsbündig untereinander mit Festbreitenziffern (`tabular-nums font-mono`).
6. **Eindeutige Selektionsoptik:**  
   Ausgewählte oder aktive Zeilen erhalten einen hellblauen Hintergrund (`bg-blue-50/80 dark:bg-blue-950/50`) mit blauem Text (`text-blue-700 dark:text-blue-300 font-medium`).
7. **Farbdisziplin & Dark-Mode-Konsistenz:**  
   Farben dienen ausschließlich der Status-, Datenherkunfts- und Typunterscheidung (gedeckte Slate-Töne, dezente Farbakzente für Herkunft wie `AI`, `SER`, `ARC`, `HEU`, `MAN`), keine dekorativen Farbverläufe.

---

## 2. Visuelle & Typografische Standards (Master-Tabelle)

| Element | Tailwind-Klassen | Messwert / Spezifikation | Begründung |
| :--- | :--- | :--- | :--- |
| **Zeilenhöhe (Row Height)** | `h-[24px] min-h-[24px] max-h-[24px]` | Exakt **24px** | Ermöglicht höchste Datendichte ohne Textkollision |
| **Status-Spalte (ganz links)** | `w-[28px] min-w-[28px] max-w-[28px] text-center p-0` | Exakt **28px**, kein Titel | Schnelle Erfassung von Pipeline-Status/Fehlern |
| **Checkbox-Spalte (Batch)** | `w-[28px] min-w-[28px] max-w-[28px] text-center p-0` | Exakt **28px** | Zentrierte 14px Checkbox für KI-/Compiler-Batches |
| **Zellen-Padding (Tabelle)** | `px-2 py-0` | Horizontal 8px, vertikal 0px | Hält die Zeile exakt auf 24px zentriert |
| **Typografie (Standard)** | `text-[13px] tracking-tight truncate` | Schriftgröße 13px, enge Laufweite | Maximale Lesbarkeit technischer Bezeichnungen |
| **Typografie (Zahlen)** | `text-right tabular-nums font-mono text-[13px]` | Rechtsbündig, tabellarische Ziffern | Ziffern (Maße, Ströme, Kosten, ms) stehen exakt untereinander |
| **Icons (Allgemein)** | `w-3.5 h-3.5 shrink-0` | Exakt **14 × 14 px** | Perfekt proportioniert zur 13px Schrift |
| **Auf-/Zuklappen (Toggle)** | `PlusSquare`, `MinusSquare` (`w-3.5 h-3.5`) | Lucide Icons | Technisches IDE-Erscheinungsbild |
| **Endknoten-Markierung** | `w-3.5 h-px bg-slate-300 dark:bg-slate-700` | Waagerechter Strich | Führt die L-Linie sauber bis zum Typ-Icon |
| **Gitternetz (Zellen)** | `border-r border-b border-slate-200 dark:border-slate-800` | 1px Trennlinien | Excel-Grid für fehlerfreies Zeilenverfolgen |
| **Tabellenkopf (Header)** | `h-[24px] bg-slate-100 dark:bg-slate-900 border-b-2 border-slate-300 dark:border-slate-700 font-semibold text-slate-700 dark:text-slate-300` | 24px Höhe, leicht abgesetzt | Klare Trennung zwischen Kopf und Datensätzen |
| **Aktive Zeile (Selected)** | `bg-blue-50/80 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 font-medium` | Hellblauer Hintergrund, blauer Text | Schnelle Identifikation ohne grelle Kontraste |
| **Hover-Zeile (Unselected)**| `hover:bg-slate-100/70 dark:hover:bg-slate-800/50` | Sehr dezentes Grau | Subtiles Feedback ohne Flackern |
| **Badges / Tags** | `px-1.5 py-0 text-[10px] font-semibold rounded uppercase tracking-wider` | Höhe max 18px | Kompakte Typen- und Herkunftsanzeige (`AI`, `SER`, `ARC`) |
| **Toolbars über Listen** | `h-[32px] px-2 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800` | 32px Toolbar-Höhe | Beherbergt Run-Switcher, Suche, Filter-Chips und Batch-Buttons |
| **Footer-Statusleiste** | `h-[24px] px-2.5 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 text-[11px]` | 24px Footer-Höhe | Zeigt Gesamtzeilen, aktiven Run, Queue-Fortschritt und Kosten |

---

## 3. Die L-förmigen Führungslinien (Hierarchie-Regeln)

Verschachtelte Hierarchien (`Baureihe -> Artikel -> Funktionsgruppe -> Pin`) müssen optisch mit durchgehenden vertikalen und horizontalen Linien verbunden werden.

### Technische Umsetzung (rein mit Tailwind CSS & absoluter Positionierung):
- **Abstand / Versatz:** Jede Hierarchieebene rückt um genau `16px` ein (in reinen schmalen Sidebars `12px`).
- **Vertikale Linie:**  
  `absolute left-[7px] top-0 w-px bg-slate-300 dark:bg-slate-700`
- **Horizontale Abzweigung:**  
  `absolute left-[7px] top-[12px] w-[8px] h-px bg-slate-300 dark:bg-slate-700`
- **Wichtigste Regel (Letztes Kind-Element):**  
  Beim letzten Kind-Element einer Ebene darf die vertikale Linie nicht nach unten durchlaufen, sondern muss exakt beim horizontalen Abzweig enden (`h-[12px]` statt `h-full`):

    {/* isLastChild: Linie endet bei 12px (Mitte der Zeile) statt h-full */}
    <div
      className={`absolute left-[7px] top-0 w-px bg-slate-300 dark:bg-slate-700 ${
        isLastChild ? 'h-[12px]' : 'h-full'
      }`}
    />
    <div className="absolute left-[7px] top-[12px] w-[8px] h-px bg-slate-300 dark:bg-slate-700" />

- **Endknoten ohne Kinder:**  
  Erhalten **kein** Plus/Minus-Icon, sondern an dieser Stelle einen horizontalen Strich (`w-3.5 h-px`), der die L-Linie sauber bis zum Typ-Icon weiterführt.

---

## 4. Standard für TreeGrids (Kombination aus Tree & Tabelle)

Für alle datenreichen Ansichten in Descriptio Forge (Harvest-Grid, Baureihen-Baum, Archetypen-Pin-Baum, Symbol-Batch-Liste) wird ein **wiederverwendbares TreeGrid** auf Basis von `@tanstack/react-table` (v8) und `@tanstack/react-virtual` eingesetzt:  
`apps/web/src/components/tree/HighDensityTreeGrid.tsx`.

### Architektur-Vorgaben:
1. **Spaltenaufbau:**
   - **Spalte 0: Status-Spalte (`w-[28px]`):**  
     Ohne Titel, zentrierte Status-Icons (`FileDown` für Rohdaten fehlen, `FileText` für gecacht, `Sparkles` für KI-extrahiert, `Cpu` für kompiliert, `CheckCircle2` für validiert, `AlertCircle` für Fehler).
   - **Optionale Checkbox-Spalte (Mehrfachauswahl):**  
     `w-[28px]`, Checkbox zentriert für Batch-Aktionen (z. B. *"500 ausgewählte Artikel durch KI extrahieren"*).
   - **Spalte 1: Hierarchie / Kennzeichnung (Baureihe -> Artikel-Nr. -> Funktionsgruppe -> Pin):**  
     Enthält die Einrückung (`row.depth * 16px`), die L-Führungslinien, den Expand-Toggle (`PlusSquare`/`MinusSquare`), das semantische Lucide-Typ-Icon und den Text.
   - **Mittlere Spalten: Fachliche Beschreibungen & Stammdaten:**  
     Linksbündig (`text-left`), mit `truncate`.
   - **Typenspalten & Herkunfts-Badges:**  
     Zentriert (`text-center`), mit kompakten 18px-Badges (z. B. `px-1.5 py-0 text-[10px] rounded`).
   - **Rechte Spalten: Maße, elektrische Kennwerte, Drehmomente, Latenzen, Kosten:**  
     Rechtsbündig (`text-right`), zwingend mit `tabular-nums font-mono`.

2. **TanStack Table Konfiguration:**

    const table = useReactTable({
      data,
      columns: finalColumns, // status column + checkbox column + data columns
      state: { expanded },
      onExpandedChange: setExpanded,
      getSubRows: (row) => row.subItems || row.children,
      getCoreRowModel: getCoreRowModel(),
      getExpandedRowModel: getExpandedRowModel(),
    });

3. **Performance & Skalierung:**
   - **Eingeklappt zum Start (`defaultExpanded: false`):** Verhindert lange Ladezeiten bei 20.000 Artikeln.
   - **Zeilen-Virtualisierung (`@tanstack/react-virtual`):** Rendert bei festen `24px` Zeilenhöhe nur die sichtbaren Zeilen im DOM.
   - **Zustandsspeicherung (`storageKey` via `localStorage`):** Beim Wechseln zwischen Views bleiben aufgeklappte Knoten erhalten.
   - **Toolbar mit Schnellfunktionen:** Enthält Filter-/Suchfeld sowie "Auf"- und "Zu"-Buttons zum globalen Expandieren/Kollabieren.
   - **Statusleiste (Footer):** Zeigt Zeilenanzahl, aktiven Run und aktuell selektiertes Element kompakt an.

---

## 5. Inline-Editing in 24px-Zellen & Manueller Schreibschutz

Für die schnelle Korrektur von extrahierten Werten (z. B. Drehmoment nachtragen, Archetyp ändern, Pin-Querschnitt anpassen) gilt: **Die Zeilenhöhe von exakt 24px darf sich beim Bearbeiten keinesfalls verändern!**
Zudem setzt jede manuelle Änderung automatisch das Flag `isManuallyCurated = true` (angezeigt durch ein kleines `Lock`-Icon), damit spätere KI- oder Compiler-Läufe diesen Wert niemals überschreiben.

### Standards für Inline-Inputs:

    {/* Text-Input innerhalb einer 24px Tabellenzelle */}
    <input
      type="text"
      defaultValue={value}
      autoFocus
      className="w-full h-[22px] px-1 -my-0.5 bg-white dark:bg-slate-800 border border-blue-500 rounded-none text-[12px] text-slate-800 dark:text-slate-100 font-sans outline-none ring-1 ring-blue-500"
      onKeyDown={(e) => {
        if (e.key === 'Enter') handleSave();
        if (e.key === 'Escape') handleCancel();
      }}
    />

### Standards für Inline-Dropdowns (Select):

    {/* Select-Feld innerhalb einer 24px Tabellenzelle */}
    <select
      defaultValue={value}
      autoFocus
      className="w-full h-[22px] px-1 -my-0.5 bg-white dark:bg-slate-800 border border-blue-500 rounded-none text-[12px] text-slate-800 dark:text-slate-100 outline-none cursor-pointer"
      onChange={(e) => handleSave(e.target.value)}
      onBlur={handleCancel}
    >
      <option value="CONTACTOR_3P_1NO">Schütz 3P + 1S</option>
      <option value="CONTACTOR_3P_1NC">Schütz 3P + 1Ö</option>
      <option value="MCB_1P">LS-Schalter 1P</option>
    </select>

### Tastatur-Verhalten beim Inline-Editing:
- **`Doppelklick` oder `F2` oder `Enter`:** Startet die Bearbeitung der selektierten Zelle.
- **`Enter`:** Speichert den Wert, setzt `isManuallyCurated = true` und springt optional zur nächsten Zeile (`ArrowDown`).
- **`Tab`:** Speichert den Wert und springt zur nächsten editierbaren Zelle derselben Zeile (`ArrowRight`).
- **`Shift + Tab`:** Speichert den Wert und springt zur vorherigen editierbaren Zelle (`ArrowLeft`).
- **`Escape`:** Bricht die Bearbeitung ab und stellt den ursprünglichen Wert wieder her.

---

## 6. Tastaturnavigation (Excel- / IDE-Standard)

Jedes TreeGrid in Descriptio Forge muss folgende Tastaturnavigation unterstützen:

| Taste | Aktion im TreeGrid / in der Tabelle |
| :--- | :--- |
| `ArrowUp` (Pfeil hoch) | Selektiert die vorherige Zeile |
| `ArrowDown` (Pfeil runter) | Selektiert die nächste Zeile |
| `ArrowRight` (Pfeil rechts) | Auf geklapptem Knoten: Klappt den Knoten auf. Auf offenem Knoten: Springt zum ersten Kind |
| `ArrowLeft` (Pfeil links) | Auf offenem Knoten: Klappt den Knoten zu. Auf geschlossenem Knoten: Springt zum Parent-Knoten |
| `Leertaste` | Schaltet die Checkbox der aktuellen Zeile um (Mehrfachauswahl für Batch-Lauf) |
| `Enter` / `F2` | Startet das Inline-Editing der fokussierten Zelle |
| `Strg + A` | Wählt alle aktuell sichtbaren / gefilterten Zeilen aus |
| `Pos1 (Home)` | Springt zur ersten Zeile der Tabelle |
| `Ende (End)` | Springt zur letzten Zeile der Tabelle |

---

## 7. Spalten-Interaktionen (Resizing, Sorting & Visibility)

### 7.1 Spaltenbreiten anpassen (Column Resizing)
- **Trennlinie im Header:** An der rechten Trennlinie jeder Header-Zelle befindet sich eine unscheinbare 4px breite Hover-Zone (`cursor-col-resize`).
- **Drag-Verhalten:** Beim Ziehen wird die Spaltenbreite in Echtzeit angepasst.
- **Doppelklick:** Doppelklick auf die Trennlinie passt die Spalte automatisch an die maximale Inhaltsbreite an (*Auto-Fit*).
- **Mindestbreite:** Keine Datenspalte darf schmaler als `40px` gezogen werden (Status- und Checkbox-Spalten sind fest auf `28px` gesperrt).

### 7.2 Sortierung (Sorting)
- Klick auf den Spaltenkopf sortiert aufsteigend (`asc`), erneuter Klick absteigend (`desc`), dritter Klick hebt Sortierung auf.
- Aktive Sortierung wird mit einem dezenten 10px-Icon (`ChevronUp` / `ChevronDown`, `w-3 h-3 text-blue-600`) direkt neben dem Spaltentitel angezeigt.
- Die Hierarchie- / Tree-Spalte behält bei Sortierung stets ihre Eltern-Kind-Struktur (Kinder werden innerhalb ihres Elternknotens sortiert).

### 7.3 Spalten ein- und ausblenden (Column Visibility)
- In der Toolbar rechts befindet sich ein Standard-Button (*"Spalten"* / `SlidersHorizontal`, `w-3.5 h-3.5`).
- Klick öffnet ein kompaktes Dropdown mit Checkboxen für jede ausblendbare Spalte.
- Ausgeblendete Spalten werden im `localStorage` unter `descriptio_forge_cols_<viewKey>` persistiert.

---

## 8. Selektionsmodelle & Mehrfachauswahl

Um zwischen **Fokus für den rechten Detail-/PDF-Inspektor** und **Batch-Aktionen (KI-Extraktion, Regel-Compiler, Export)** klar zu unterscheiden, gibt es zwei Selektionsebenen:

1. **Aktive Zeile (Row Focus / Navigation):**
   - Klick auf eine Zeile markiert sie als aktiv (`bg-blue-50/80 dark:bg-blue-950/50 text-blue-700`).
   - Aktualisiert sofort den rechten Dual-Inspector (Kompilierte Eigenschaften + Original-PDF/HTML-Beweis).
2. **Bereichsauswahl (Range Selection):**
   - `Shift + Klick`: Markiert alle Zeilen zwischen der zuletzt aktiven Zeile und der angeklickten Zeile.
   - `Strg + Klick`: Fügt einzelne Zeilen zur Auswahl hinzu oder entfernt sie.
3. **Checkbox-Auswahl (Batch Operations):**
   - Checkboxen in Spalte 1 sind primär für Massen-Operationen gedacht (z. B. *"Ausgewählte 250 Artikel neu kompilieren"*, *"Ausgewählte Serie mit KI-Modell X extrahieren"*).
   - Oberste Checkbox im Header toggelt alle gefilterten Zeilen und zeigt bei Teil-Auswahl den Status `indeterminate`.

---

## 9. Industrie-Kontextmenü (Rechtsklick)

Ein Rechtsklick auf eine beliebige Tabellen- oder Tree-Zeile öffnet ein kompaktes Kontextmenü im IDE-Stil:

    {/* Standard Industrie-Kontextmenü in Descriptio Forge */}
    <div className="fixed z-50 min-w-[200px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded shadow-md py-1 text-[12px] font-sans">
      <button className="w-full h-[24px] px-2.5 flex items-center gap-2 hover:bg-blue-50 dark:hover:bg-blue-950/50 hover:text-blue-600 transition-colors text-left">
        <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
        <span>Mit KI neu extrahieren...</span>
      </button>
      <button className="w-full h-[24px] px-2.5 flex items-center gap-2 hover:bg-blue-50 dark:hover:bg-blue-950/50 hover:text-blue-600 transition-colors text-left">
        <Cpu className="w-3.5 h-3.5 text-amber-500" />
        <span>Regel-Compiler ausführen</span>
      </button>
      <button className="w-full h-[24px] px-2.5 flex items-center gap-2 hover:bg-blue-50 dark:hover:bg-blue-950/50 hover:text-blue-600 transition-colors text-left">
        <FileText className="w-3.5 h-3.5 text-slate-500" />
        <span>Rohdaten-PDF im Inspector öffnen</span>
      </button>
      <div className="my-1 h-px bg-slate-200 dark:bg-slate-800" />
      <button className="w-full h-[24px] px-2.5 flex items-center gap-2 hover:bg-rose-50 dark:hover:bg-rose-950/50 text-rose-600 transition-colors text-left">
        <Trash2 className="w-3.5 h-3.5 text-rose-500" />
        <span>Aus aktuellem Run entfernen</span>
      </button>
    </div>

- **Höhe pro Menüeintrag:** Exakt `h-[24px]` mit `text-[12px]`.
- **Icons im Menü:** Einheitlich `w-3.5 h-3.5`.
- **Kanten & Schatten:** Dezentes `rounded` (kein stark abgerundetes `rounded-xl`), Schatten `shadow-md`.

---

## 10. Reine Navigationsbäume in Sidebars (Hersteller-Baum, Archetypen, Symbol-Katalog)

Für schmale Sidebars ohne Tabellenspalten (linke Hauptnavigation, Hersteller-/Baureihen-Filterbaum, IEC-60617-Symbolkategorien) gilt dasselbe visuelle Muster mit folgenden Sidebar-Anpassungen:

- **Zeilenhöhe:** Weiterhin strikt `h-[24px] min-h-[24px] max-h-[24px]`.
- **Einrückung:** Kompakte `12px` pro Ebene (statt 16px) zur Schonung der Sidebar-Breite.
- **Toggles:** Weiterhin `PlusSquare` und `MinusSquare` (`w-3.5 h-3.5`).
- **Drag & Drop (Zuordnen von Artikeln zu Baureihen oder Archetypen):**
  - Wird ein Element verschoben, erscheint zwischen den Zeilen eine **2px blaue Linie** (`bg-blue-500`) als Einfügemarke.
  - Wird ein Artikel auf eine Baureihe oder einen Archetyp gezogen, erhält der Zielknoten einen 1px blauen Rahmen (`ring-1 ring-blue-500 bg-blue-50/50`).
- **Zähler & Badges:** Zähler (z. B. Anzahl Artikel pro Hersteller/Serie) werden am rechten Rand dezent dargestellt (`text-[10px] text-slate-400 font-mono ml-auto mr-1.5`).

---

## 11. Industrie-Chrome: Run-Bar, Toolbars, Filter & Modals

### 11.1 Globale Run-Bar & Werkzeugleisten (Toolbars)
- **Höhe:** Einheitlich `h-[32px] px-2 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800`.
- **Run-Selector & Snapshot-Buttons (links in der Top-Bar):**
  - Dropdown zur Auswahl der aktiven SQLite-Run-Datei (`h-[22px] text-[12px] font-medium`).
  - Buttons `Run klonen (Fork)`, `Snapshot sperren (Lock)` und `Diff-Ansicht` (`h-[22px] px-2 text-[11px]`).
- **Suchfeld:** `h-[22px] pl-7 pr-6 text-[12px] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded`.
- **Button-Gruppen (Filter-Chips):**  
  Höhe `h-[20px] px-1.5 text-[11px] font-medium border border-slate-200 dark:border-slate-700 rounded`. Aktiver Zustand: `bg-slate-200 dark:bg-slate-700 font-bold` (z. B. `Alle`, `Nur Fehler`, `Unvollständig`, `Export-Bereit`).
- **Expand/Collapse-Schalter:** Kompaktes Button-Paar mit `PlusSquare` (*"Auf"*) und `MinusSquare` (*"Zu"*).

### 11.2 Statusleisten (Footer)
- **Höhe:** Einheitlich `h-[24px] px-2.5 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 text-[11px] text-slate-500`.
- **Inhalt links:** Aktiver Run-Dateiname, Anzahl Zeilen (*"Artikel: 20.412 | Gefiltert: 420"*), aktive Selektion.
- **Inhalt rechts:** Aktiver KI-Provider, Queue-Status (*"Batch: 140/500 (28%) | Kosten: $0.14"*).

### 11.3 Modale Dialoge
- Tabellen innerhalb von Dialogen (z. B. Run-Diff-Vergleich, KI-Kosten-Voranschlag vor Batch-Start, JSON-Export-Vorschau) nutzen **denselben 24px-Standard**.
- Dialog-Header: `h-[40px] px-4 bg-slate-50 dark:bg-slate-900 border-b font-bold text-sm`.
- Dialog-Footer: `h-[44px] px-4 bg-slate-50 dark:bg-slate-900 border-t flex justify-end gap-2`.

---

## 12. Farbpaletten, Datenherkunft & Dark-Mode-Referenz (Token-Tabelle)

| UI-Element / Herkunft | Tailwind (Light Mode) | Tailwind (Dark Mode) | Bedeutung / Einsatz |
| :--- | :--- | :--- | :--- |
| **Canvas / Tabellenhintergrund** | `bg-white` | `bg-slate-900` | `#ffffff` / `#0f172a` |
| **Header-Hintergrund** | `bg-slate-100` | `bg-slate-900` | `#f1f5f9` / `#0f172a` |
| **Toolbar- & Footer-Hintergrund** | `bg-slate-50` | `bg-slate-900` | `#f8fafc` / `#0f172a` |
| **Gitternetz (Zellentrennlinien)**| `border-slate-200` | `border-slate-800` | `#e2e8f0` / `#1e293b` |
| **Header-Trennlinie unten** | `border-slate-300` | `border-slate-700` | `#cbd5e1` / `#334155` |
| **L-Führungslinien** | `bg-slate-300` | `border-slate-700` | `#cbd5e1` / `#334155` |
| **Hover-Zeile** | `hover:bg-slate-100/70` | `hover:bg-slate-800/50` | `#f1f5f9` / `#1e293b` |
| **Aktive Zeile (Background)** | `bg-blue-50/80` | `bg-blue-950/50` | `#eff6ff` / `#172554` |
| **Aktive Zeile (Text)** | `text-blue-700` | `text-blue-300` | `#1d4ed8` / `#93c5fd` |
| **Status OK / Validiert** | `text-emerald-500` / `bg-emerald-50` | `text-emerald-400` / `bg-emerald-950/50` | Artikel 100 % Export-bereit / API-Test OK |
| **Status Warnung / Heuristik** | `text-amber-500` / `bg-amber-50` | `text-amber-400` / `bg-amber-950/50` | Teilwerte fehlen, aber per Serie/Heuristik gefüllt |
| **Status Fehler** | `text-rose-500` / `bg-rose-50` | `text-rose-400` / `bg-rose-950/50` | Zod-Validierungsfehler / API-Key ungültig |
| **Herkunft `AI` (KI-Extrakt)** | `bg-sky-100 text-sky-800` | `bg-sky-950/60 text-sky-300` | Wert stammt direkt aus LLM-Datenblattanalyse |
| **Herkunft `SER` (Baureihe)** | `bg-amber-100 text-amber-800` | `bg-amber-950/60 text-amber-300` | Wert wurde aus der `CatalogSeries` geerbt |
| **Herkunft `ARC` (Archetyp)** | `bg-emerald-100 text-emerald-800` | `bg-emerald-950/60 text-emerald-300` | Pin/ERC-Logik stammt aus IEC-Funktionsschablone |
| **Herkunft `HEU` (Heuristik)** | `bg-purple-100 text-purple-800` | `bg-purple-950/60 text-purple-300` | Berechneter Fallback (z. B. 3D-Pin-Offset aus Maß) |
| **Herkunft `MAN` (Manuell)** | `bg-slate-200 text-slate-900 font-bold` | `bg-slate-700 text-white font-bold` | Vom User übersteuert – schreibgeschützt (`Lock`) |

---

## 13. Standard für verzögerte Detail-Hoverkarten (Delayed Industrial Hover Cards)

Um in datendichten Bäumen und Tabellen maximale Arbeitsruhe zu garantieren, dürfen Tooltips und Inspektionskarten **niemals sofort aufploppen**.

### 13.1 Gestaltungsregeln & Einschaltverzögerung (0,6s)
1. **0,6 Sekunden Einschaltverzögerung (`INDUSTRIAL_HOVER_DELAY_MS = 600`):**
   - Beim schnellen Überfahren von Zeilen bleibt das Interface vollkommen ruhig.
   - Erst wenn der Mauszeiger mindestens **0,6 Sekunden** auf einer Zeile verweilt, öffnet sich die Detailkarte.
   - Verlässt der Mauszeiger die Zeile vor 0,6 Sekunden, wird der Öffnungstimer sofort verworfen.
2. **Erst laden wenn gehovert wird (Lazy Loading):**
   - Datenintensive Details (Vektor-SVGs, vollständige Pin-Listen, Zod-Fehler-Stacks, Rohdaten-Snippets) werden erst abgerufen, wenn die Hoverkarte nach 600ms tatsächlich aufpoppt (`enabled: isOpen`).
3. **Gemeinsame Komponente & Portal-Rendering (`IndustrialHoverCard`):**
   - Alle Listen und Bäume nutzen `apps/web/src/components/hover/IndustrialHoverCard.tsx`.
   - Rendert via `createPortal` direkt in `document.body` mit `position: fixed` und automatischer Kollisionserkennung.

### 13.2 Spezifikation für Artikelzeilen & Hover
- **Format in der 24px-Zeile (Kompaktformat):**
  - **1. Artikelnummer:** Auf **15 Zeichen** gekürzt.
  - **2. Name/Typ:** Auf **15 Zeichen** gekürzt.
  - **3. Hersteller in Klammern:** Auf **10 Zeichen** gekürzt.
- **Inhalt der Hoverkarte (Vollformat):**
  - Dunkle Karte (`bg-slate-900/95 dark:bg-slate-800/95 border border-slate-700/80 text-white`).
  - Ungekürzte Artikelnummer (`font-mono select-all`), Name, Hersteller, Baureihe und Archetyp.
  - Vollständigkeits-Aufschlüsselung (z. B. `14 Felder AI | 5 Felder Serie | 8 Pins Archetyp`) sowie etwaige Validierungswarnungen.

### 13.3 Spezifikation für Archetyp- & Symbolzeilen (Hover)
- **Format in der 24px-Zeile:** `Symbol/Archetyp: {Name}` mit `Zap`-Icon.
- **Inhalt der Hoverkarte (Vollformat):**
  - **Kopfbereich:** Name, IEC-Kategorie und `defaultBmkPrefix`-Badge (z. B. `-Q`, `-F`, `-K`, `-X`).
  - **Vorschau-Vektor (SVG in Weiß):**
    - Renderbox: `w-[190px] h-[95px] bg-slate-950/90 rounded border border-slate-800`.
    - Vektor-Symbol mit weißen Pfaden (`stroke: #ffffff`) und roten Anschlusspunkten.
  - **Generierte Funktionsgruppen & Pins:**
    - Liste aller Anschlussbezeichnungen inkl. `potentialPropagation` als kompakte Badges (`font-mono text-[9px] bg-slate-800 border border-slate-700`).

---

## 14. Übersicht der App-Bereiche & Umsetzungs-Fahrplan für Descriptio Forge

Die Umsetzung von Descriptio Forge erfolgt modular in 5 Phasen:

### Phase 1: Fundament, Run-Vault & KI-Provider-Tresor (Höchste Priorität)
1. **Out-of-Repo Vault (`~/.descriptio-forge/`):**
   - Lese-/Schreibzugriff auf `credentials.json` außerhalb des Git-Ordners.
   - Verwaltung von `global-vault.sqlite` und dem `runs/`-Verzeichnis.
2. **KI-Provider & Modell-Manager (`AiVaultView.tsx`):**
   - 24px-Provider-Tabelle für Gemini, OpenAI, Anthropic, DeepSeek, OpenRouter und Ollama.
   - **Live-Test-Button (`Test Connection`)** mit Latenzmessung (`ms`) und Fehleranzeige.
   - **Modell-Abruf-Button (`Fetch & Sync Models`)**, der verfügbare Modelle direkt über die Provider-API zieht und in der Datenbank speichert.
3. **Run-Manager & Snapshot-Cloner (`RunManagerView.tsx`):**
   - Erstellen, Klonen (`Fork`), Sperren (`Lock`) und Löschen von Durchlauf-Datenbanken (`.sqlite`).

### Phase 2: IEC-Archetypen, Baureihen-Studio & Deterministischer Compiler
1. **Geteilte Zod-Schemata (`packages/shared`):**
   - Exakte Definition von `CatalogPartVersion`, `CatalogFunctionGroup`, `CatalogPin`, `PartAccessoryRelation` und `CatalogCableSpec`.
2. **Archetypen- & Serien-Editor (`ArchetypeView.tsx`):**
   - 24px-TreeGrid zur Definition der ~60 IEC-Standard-Bauteilklassen (Schütze, LS-Schalter, Motorschutzschalter, Klemmen, Netzteile) inkl. `potentialPropagation` und `pinElectricalRole`.
   - Pflege von Baureihen-Defaults (`torque`, `strippingLength`, `maxCrossSecTwin`, `dinRailMountOffsetY`).
3. **Regel-Compiler (`apps/server/src/compiler`):**
   - Deterministisches Zusammenführen von KI-Extrakt + Archetyp + Baureihe + 3D-Geometrie-Heuristik.

### Phase 3: Scraper, KI-Batch-Pipeline & Harvest-Grid
1. **Rohdaten-Ingestor (`apps/server/src/scraper`):**
   - HTML/ETIM-Tabellen-Parser und PDF-Caching in `raw-cache/`.
2. **KI-Extraktions-Queue:**
   - Pausierbare Batch-Verarbeitung mit `p-limit`, Kosten-Vorschau und Budget-Stop.
3. **Harvest-Haupttabelle (`HarvestGridView.tsx`) & Dual-Inspector:**
   - Virtualisiertes 24px-TreeGrid für 20.000+ Artikel mit Herkunfts-Badges (`AI`, `SER`, `ARC`, `HEU`, `MAN`), Inline-Editing und PDF/HTML-Beweis-Viewer im rechten Inspector.

### Phase 4: Run-Diffing & Descriptio-Paket-Exporter
1. **Run-Diff-Ansicht (`RunDiffView.tsx`):**
   - 24px-Vergleichstabelle zwischen zwei Runs (zeigt geänderte Felder nach Prompt- oder Regel-Anpassungen).
2. **Exporter (`apps/server/src/exporter`):**
   - Generiert flache, vollständig validierte `.descriptio.json`-Pakete inkl. `importHash` für den Import in die Hauptapplikation.

### Phase 5: Symbol-Designer & KI-Symbol-Batching (Spätere Ausbaustufe)
1. **Grafischer IEC 60617 SVG-Editor (`SymbolStudioView.tsx`):**
   - 4mm/8mm Raster-Canvas, Pin-Platzierung und Validierung gegen `CatalogFunctionGroup`.
2. **KI-Symbol-Synthese:**
   - Batch-Erkennung von Schaltbildern in PDF-Datenblättern und automatische Generierung von SVG-Symbol-Rohlingen.

---

## 15. Entwickler-Checkliste für neue Komponenten

Vor jedem Commit oder Review einer Tree- oder Tabellen-Ansicht müssen alle folgenden Kriterien erfüllt sein:

- [ ] **Zeilenhöhe:** Besitzt jede Tabellenzeile strikt `h-[24px] min-h-[24px] max-h-[24px]`?
- [ ] **Status-Spalte:** Gibt es ganz links eine `w-[28px]` schmale Spalte ohne Header-Titel für zentrierte Status-Icons?
- [ ] **Padding:** Haben Datenzellen minimales Padding (`px-2 py-0`) und Status-/Checkbox-Zellen `p-0`?
- [ ] **Typografie:** Wird durchgehend `text-[13px] tracking-tight truncate` verwendet?
- [ ] **Zahlenfelder:** Haben alle numerischen Spalten `text-right tabular-nums font-mono`?
- [ ] **Gitternetz:** Besitzt jede Zelle die Klassen `border-r border-b border-slate-200 dark:border-slate-800`?
- [ ] **Icons:** Werden für das Auf-/Zuklappen ausschließlich `PlusSquare` und `MinusSquare` (`w-3.5 h-3.5`) verwendet?
- [ ] **L-Führungslinien:** Sind Linien absolut positioniert und endet die vertikale Linie beim letzten Kind bei `h-[12px]`?
- [ ] **Endknoten:** Besitzen Blätter ohne Kinder einen waagerechten Verbindungsstrich `w-3.5 h-px`?
- [ ] **Selektion:** Erhält eine ausgewählte Zeile `bg-blue-50/80 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 font-medium`?
- [ ] **Hoverkarten:** Nutzen Detail-Tooltips `IndustrialHoverCard` mit 0,6s Verzögerung (`INDUSTRIAL_HOVER_DELAY_MS = 600`) und Lazy Loading?
- [ ] **Kopfzeile:** Ist der Header mit `h-[24px] bg-slate-100 dark:bg-slate-900 border-b-2 font-semibold` gestaltet?
- [ ] **Toolbar:** Hat die Werkzeugleiste `h-[32px]` mit kompakten Buttons (`h-[20px]` bis `h-[22px]`)?
- [ ] **Footer:** Gibt es eine `h-[24px]` Statusleiste mit Zeilenzähler, aktivem Run und Queue-Status?
- [ ] **Persistenz:** Wird der Expand-Zustand über einen passenden `storageKey` im `localStorage` gemerkt?
- [ ] **Eingeklappt zum Start:** Startet die Komponente mit `defaultExpanded: false`?

---

## 16. Inspector-Panels & Rohdaten-Beweis-Viewer im Industrie-Look

Die rechte Seitenleiste (Dual-Inspector) dient der schnellen Kontrolle und Nachbearbeitung eines selektierten Artikels sowie dem direkten Abgleich mit dem Original-Datenblatt.

### 16.1 Scroll-Architektur & Layout
- **Root-Container:** `w-full h-full flex flex-col bg-white dark:bg-slate-950 border-l border-slate-200 dark:border-slate-800 overflow-hidden`
- **Sticky Header mit Tab-Umschalter (oben):** `h-9 px-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80 shrink-0 flex items-center justify-between`
  - Umschalter zwischen `Tab 1: Eigenschaften (24px Grid)` und `Tab 2: Rohdaten-Beweis (PDF / HTML)`.
- **Scrollbarer Inhaltsbereich:** `flex-1 min-h-0 overflow-y-auto p-2 space-y-2.5`

### 16.2 Sektions-Container (Property Cards)
Jeder logische Block (`Identifikation`, `Mechanik & 3D`, `Thermik & Elektrik`, `Funktionsgruppen & Pins`, `Zubehör-Relationen`) wird in einer kompakten Industrie-Karte zusammengefasst:
- **Karten-Rahmen:** `border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 select-none text-[12px]`
- **Kategorie-Header (24px):** `h-[24px] px-2 bg-slate-100 dark:bg-slate-800/90 border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center justify-between cursor-pointer`
  - Links: Icon (`w-3.5 h-3.5 text-slate-500`) + Titel
  - Rechts: Herkunfts-Zusammenfassung / Akkordeon-Pfeil (`ChevronDown` / `ChevronRight` `w-3 h-3 text-slate-400`)

### 16.3 Eigenschaftszeilen, Herkunfts-Badges & Eingabefelder (24px Property-Grid)
- **Eigenschaftszeile:** `h-[24px] flex items-stretch border-b border-slate-200 dark:border-slate-800 last:border-b-0`
- **Label-Spalte:** `w-32 shrink-0 px-2 border-r border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/40 text-slate-600 dark:text-slate-400 font-medium flex items-center justify-between truncate text-[11px]`
- **Herkunfts-Spalte (`w-[36px]`):** Zeigt zentriert das 10px-Badge der Datenquelle (`AI`, `SER`, `ARC`, `HEU`, `MAN`) inkl. Klick zum Entsperren manuell fixierter Werte.
- **Wert- / Input-Spalte:** `flex-1 flex items-center bg-white dark:bg-slate-950 px-1`
- **Eingabeelemente:**
  - **Text-/Zahlen-Input:** `w-full h-[20px] px-1 bg-transparent text-slate-800 dark:text-slate-100 font-sans/font-mono text-[11px] outline-none focus:bg-sky-50 dark:focus:bg-sky-950/40 focus:ring-1 focus:ring-sky-500 rounded-none disabled:opacity-50`
  - **Dropdown (Select):** `w-full h-[20px] px-1 bg-transparent text-slate-800 dark:text-slate-100 text-[11px] outline-none cursor-pointer focus:bg-sky-50 dark:focus:bg-sky-950/40 focus:ring-1 focus:ring-sky-500`
  - **Checkbox:** `h-[14px] w-[14px] accent-sky-600 rounded cursor-pointer`
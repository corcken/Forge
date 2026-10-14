# DESCRIPTIO FORGE – Implementierungs- & Ablaufplan für Coding-Agenten

> **Zweck:** Schritt-für-Schritt Bauplan zur Umsetzung von **Descriptio Forge** gemäß `MANIFEST.md`.  
> **Zielgruppe:** Autonome Coding-Agenten (Claude Code, Cursor, Windsurf, Cline) & Entwickler.

---

## 1. Verbindliche Arbeitsdirektiven für den Coding-Agenten

Bevor die erste Zeile Code geschrieben wird, gelten folgende eiserne Regeln:

1. **Modulare Dateigrößen (Kleine, wartbare Teile):**
   * Keine Datei darf länger als **200–250 Zeilen** werden.
   * Logik wird strikt nach Verantwortlichkeit getrennt (ein eigener Adapter pro KI-Provider, ein eigenes Modul pro Compiler-Stufe, eigene Sub-Komponenten für Toolbar, Header, Row und Inspector).
2. **Immer vollständige Dateien liefern:**
   * Niemals Platzhalter wie `// ... rest of code` oder `// TODO: implement` verwenden. Bei jeder Erstellung oder Änderung muss die komplette, kompilierbare Datei ausgegeben werden.
3. **Strikte Einhaltung der `MANIFEST.md`:**
   * **Out-of-Repo Security:** Alle API-Keys (`credentials.json`), der Rohdaten-Cache und alle SQLite-Datenbanken müssen zwingend über `os.homedir()` unter `~/.descriptio-forge/` gespeichert werden.
   * **24px Industrie-Look:** Jede Tabellen- und Baumzeile im Frontend muss exakt `h-[24px] min-h-[24px] max-h-[24px]` hoch sein, ein 1px Excel-Gitternetz (`border-r border-b`) besitzen und für Zahlenwerte `text-right tabular-nums font-mono` verwenden.
4. **Sequenzielles Vorgehen (Meilenstein-Prinzip):**
   * Die unten definierten **Meilensteine M1 bis M7** werden nacheinander abgearbeitet. Nach jedem Meilenstein wird geprüft, ob `npm run build` / TypeScript fehlerfrei durchläuft.

---

## 2. Exakte System-Ablaufpläne (State Machines & Flows)

### Ablauf 1: Bootstrapping & Out-of-Repo Tresor (`VaultInitializer`)

Beim Start des Node.js-Servers (`apps/server`) läuft folgender Initialisierungsprozess ab:

    [Server-Start]
          │
          ▼
    Prüfe OS-Pfad: ~/.descriptio-forge/
          ├── Existiert nicht? ──► Erstelle Ordnerstruktur:
          │                        ├── ~/.descriptio-forge/raw-cache/
          │                        ├── ~/.descriptio-forge/runs/
          │                        └── ~/.descriptio-forge/exports/
          ▼
    Prüfe ~/.descriptio-forge/credentials.json
          ├── Existiert nicht? ──► Erzeuge leeres Template (chmod 600) für:
          │                        [gemini, openai, anthropic, deepseek, openrouter, ollama]
          ▼
    Öffne ~/.descriptio-forge/global-vault.sqlite
          ├── Führe SQL-Migrationen für globale Tabellen aus
          ├── Seede Standard-IEC-Archetypen (falls Tabelle leer)
          ▼
    Prüfe aktiven Run (aus global_settings)
          └── Kein Run vorhanden? ──► Erstelle "run_001_initial_sandbox.sqlite" und mounte ihn

---

### Ablauf 2: KI-Provider-Test & Dynamischer Modell-Sync (`AiVaultFlow`)

Ablauf im Backend, wenn in `AiVaultView.tsx` auf **[Verbindung testen]** oder **[Modelle abrufen & speichern]** geklickt wird:

    [User klickt "Verbindung testen" in 24px Provider-Zeile]
          │
          ▼
    1. Backend liest API-Key für Provider X frisch aus ~/.descriptio-forge/credentials.json
    2. Startet Timer (performance.now())
    3. Sendet Minimal-Request an Provider-Endpunkt (Timeout: 8.000 ms)
          ├── Erfolg (HTTP 200):
          │     Berechne latencyMs = Math.round(now - start)
          │     Speichere Status = 'OK', latencyMs, lastTestedAt in global-vault.sqlite
          │     UI: Spalte 0 zeigt grünes CheckCircle2 + "118 ms" (tabular-nums)
          └── Fehler (HTTP 401/403/429/Timeout):
                Speichere Status = 'ERROR', errorMessage in global-vault.sqlite
                UI: Spalte 0 zeigt rotes AlertCircle (Hoverkarte zeigt nach 600ms den Fehlertext)

    [User klickt "Modelle abrufen & speichern"]
          │
          ▼
    1. Adapter ruft Provider-API auf:
          ├── Gemini:      GET https://generativelanguage.googleapis.com/v1beta/models
          ├── OpenAI/Komp: GET {baseUrl}/v1/models
          ├── Anthropic:   GET https://api.anthropic.com/v1/models
          └── Ollama:      GET http://localhost:11434/api/tags
    2. Normalisiere Antwort auf internes Schema (modelId, displayName, contextWindow, supportsVision)
    3. UPSERT in Tabelle `ai_models` in global-vault.sqlite (manuell gesetzte Task-Zuweisungen bleiben erhalten!)
    4. UI aktualisiert sofort die untere 24px Modell-Tabelle

---

### Ablauf 3: Die 4-Stufen-Artikel-Pipeline & Schutz vor Überschreibung

Dieser Ablauf stellt sicher, dass Rohdaten gecacht werden, die KI nur Fakten liest, der deterministische Compiler das E-CAD-Modell baut und manuelle Korrekturen (`MAN`) niemals verloren gehen:

    ┌─────────────────────────────────────────────────────────────────────────┐
    │ STUFE 1: INGESTION (Rohdaten-Cache in global-vault.sqlite)              │
    └─────────────────────────────────────────────────────────────────────────┘
      Input: Hersteller + Artikelnummer (z.B. "Eaton", "276565") + Quelle (URL/PDF)
      1. Berechne Hash der Quelle. Liegt Dokument in `raw_documents` vor?
         ├── JA: Lade gecachten Markdown/HTML-Text + PDF-Pfad (0 ms Scraping-Zeit)
         └── NEIN: Lade HTML (ETIM-Tabelle via Cheerio/Playwright) oder PDF,
                   speichere Datei in ~/.descriptio-forge/raw-cache/ und Metadaten in DB.
      2. Setze Artikel-Status im aktiven Run auf `INGESTED`.

    ┌─────────────────────────────────────────────────────────────────────────┐
    │ STUFE 2: KI-FAKTEN-EXTRAKTION (Nur im aktiven Run)                      │
    └─────────────────────────────────────────────────────────────────────────┘
      Input: Gecachter Text/PDF + System-Prompt + Liste erlaubter IEC-Archetyp-IDs
      1. Kosten-Wächter prüft vor Batch-Start: Geschätzte Tokens <= Run-Budget?
      2. Sende Request mit erzwungenem JSON-Schema (`AiExtractionOutputSchema`).
      3. KI liefert ausschließlich belegbare Fakten (Rest strikt `null`) + `archetypeId` + `seriesName`.
      4. Speichere Roh-JSON in Tabelle `staged_parts.ai_raw_json`. Status -> `AI_EXTRACTED`.

    ┌─────────────────────────────────────────────────────────────────────────┐
    │ STUFE 3: DETERMINISTISCHER REGEL-COMPILER (Kein LLM!)                   │
    └─────────────────────────────────────────────────────────────────────────┘
      Für jedes Feld des Ziel-Artikels prüft die Prioritäts-Kaskade:
      
      Priorität 1: Ist das Feld im Run in `manual_overrides_json` [MAN] vorhanden?
                   ──► JA: Behalte den manuellen Wert (Unantastbar!).
      Priorität 2: Hat die KI in Stufe 2 einen validen Wert != null geliefert?
                   ──► JA: Übernehme Wert, setze Herkunft = `AI`.
      Priorität 3: Gibt es in `series_overrides` für die erkannte Baureihe einen Wert?
                   ──► JA: Übernehme Wert (z.B. torque, clearance), setze Herkunft = `SER`.
      Priorität 4: Gibt es im zugewiesenen `iec_archetype` einen Norm-Default?
                   ──► JA: Generiere `defaultBmkPrefix`, `CatalogFunctionGroup` und
                           `CatalogPin` (inkl. `potentialPropagation`, `pinElectricalRole`),
                           setze Herkunft = `ARC`.
      Priorität 5: Geometrie-Fallback (für `physicalOffsetX/Y/Z` & `wireEntryDirection`):
                   ──► Berechne Koordinaten aus `width`, `height`, `depth`,
                       setze Herkunft = `HEU` (`isHeuristicValue = true`).

    ┌─────────────────────────────────────────────────────────────────────────┐
    │ STUFE 4: ZOD-VALIDIERUNG & EXPORT                                       │
    └─────────────────────────────────────────────────────────────────────────┘
      1. Prüfe kompiliertes Objekt gegen `DescriptioPartExportSchema` (Zod).
      2. Prüfe ERC-Plausibilität (z.B. hat jede Spule A1/A2 eine Nennspannung?).
      3. Berechne Qualitäts-Badge (`GOLD`, `SILVER`, `BRONZE`) und Status `VALIDATED` oder `ERROR`.

---

## 3. Vollständige Datenbank-Schemata (SQLite DDL)

Es werden zwei getrennte Datenbank-Schemata in `apps/server/src/vault/schemas/` angelegt:

### 3.1 Schema 1: `global-vault.sqlite` (Globaler Tresor)

    -- 1. Konfigurierte KI-Provider (API-Keys selbst liegen in credentials.json!)
    CREATE TABLE IF NOT EXISTS ai_providers (
      id TEXT PRIMARY KEY,                  -- 'gemini', 'openai', 'anthropic', 'deepseek', 'openrouter', 'ollama'
      display_name TEXT NOT NULL,
      base_url TEXT NOT NULL,
      adapter_type TEXT NOT NULL,           -- 'GEMINI', 'OPENAI_COMPAT', 'ANTHROPIC'
      is_enabled INTEGER DEFAULT 1,
      last_test_status TEXT DEFAULT 'UNTESTED', -- 'UNTESTED', 'OK', 'ERROR'
      last_latency_ms INTEGER,
      last_error_msg TEXT,
      last_tested_at TEXT
    );

    -- 2. Über die Provider-API abgerufene & gespeicherte Modelle
    CREATE TABLE IF NOT EXISTS ai_models (
      id TEXT PRIMARY KEY,                  -- z.B. 'gemini:gemini-2.5-flash'
      provider_id TEXT NOT NULL REFERENCES ai_providers(id) ON DELETE CASCADE,
      model_id TEXT NOT NULL,               -- z.B. 'gemini-2.5-flash'
      display_name TEXT NOT NULL,
      context_window INTEGER DEFAULT 128000,
      input_price_per_1m REAL DEFAULT 0.0,  -- Preis in USD pro 1M Tokens
      output_price_per_1m REAL DEFAULT 0.0,
      supports_vision INTEGER DEFAULT 0,
      supports_json_schema INTEGER DEFAULT 1,
      is_active INTEGER DEFAULT 1,
      assigned_tasks_json TEXT DEFAULT '[]' -- JSON-Array: ['TASK_HTML_EXTRACT', 'TASK_PDF_VISION', 'TASK_SYMBOL_SVG']
    );

    -- 3. Globaler Rohdaten-Cache (Nie doppelt scrapen!)
    CREATE TABLE IF NOT EXISTS raw_documents (
      id TEXT PRIMARY KEY,                  -- SHA-256 über (manufacturer + article_nr + source_type)
      manufacturer TEXT NOT NULL,
      article_nr TEXT NOT NULL,
      source_type TEXT NOT NULL,            -- 'HTML_ETIM', 'PDF_DATASHEET', 'PDF_MANUAL'
      source_url TEXT,
      local_file_path TEXT,                 -- Relativer Pfad in ~/.descriptio-forge/raw-cache/
      extracted_markdown TEXT,              -- Aufbereiteter Text / ETIM-Markdown für LLM
      file_hash_sha256 TEXT,
      created_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_raw_docs_lookup ON raw_documents(manufacturer, article_nr);

    -- 4. Globale IEC-Archetypen (Schütze, LS-Schalter, Klemmen, Netzteile etc.)
    CREATE TABLE IF NOT EXISTS iec_archetypes (
      id TEXT PRIMARY KEY,                  -- z.B. 'CONTACTOR_3P_1NO_1NC'
      name TEXT NOT NULL,
      category TEXT NOT NULL,               -- 'SWITCHGEAR', 'PROTECTION', 'TERMINAL', 'POWER_SUPPLY', 'PLC', 'CABLE'
      default_bmk_prefix TEXT NOT NULL,     -- 'Q', 'F', 'K', 'X', 'G', 'W'
      mounting_type_default TEXT,           -- 'DIN_RAIL', 'MOUNTING_PLATE', 'DOOR'
      function_groups_template_json TEXT NOT NULL, -- JSON: Generierungsregeln für CatalogFunctionGroup & CatalogPin
      updated_at TEXT NOT NULL
    );

    -- 5. Globale Symbolbibliothek (Vorbereitung für Phase 5: Symbol-Designer)
    CREATE TABLE IF NOT EXISTS symbol_library (
      id TEXT PRIMARY KEY,                  -- z.B. 'sym_iec_no_1p_v1'
      name TEXT NOT NULL,
      iec_60617_ref TEXT,
      bmk_prefix TEXT NOT NULL,
      grid_base_mm REAL DEFAULT 4.0,
      svg_content TEXT NOT NULL,
      pins_json TEXT NOT NULL,              -- JSON: [{ pinIndex, x, y, topologyDir }]
      origin_type TEXT DEFAULT 'STANDARD',  -- 'STANDARD', 'AI_GENERATED', 'MANUAL'
      updated_at TEXT NOT NULL
    );

    -- 6. Verzeichnis aller Durchläufe (Runs)
    CREATE TABLE IF NOT EXISTS registered_runs (
      id TEXT PRIMARY KEY,                  -- z.B. 'run_001'
      name TEXT NOT NULL,
      sqlite_filename TEXT NOT NULL,        -- Dateiname in ~/.descriptio-forge/runs/
      parent_run_id TEXT,                   -- Gesetzt, wenn per Fork/Klon erstellt
      is_locked INTEGER DEFAULT 0,          -- 1 = Snapshot eingefroren (READ_ONLY)
      part_count INTEGER DEFAULT 0,
      validated_count INTEGER DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

---

### 3.2 Schema 2: `run_<id>.sqlite` (Isolierte Datenbank pro Durchlauf)

Jede Datei in `~/.descriptio-forge/runs/` besitzt dieses Schema und kann per Datei-Kopie geklont werden:

    -- 1. Baureihen-Vererbungsregeln innerhalb dieses Runs (CatalogSeries)
    CREATE TABLE IF NOT EXISTS series_overrides (
      id TEXT PRIMARY KEY,                  -- z.B. 'EATON_DILM_BG1'
      manufacturer TEXT NOT NULL,
      series_name TEXT NOT NULL,            -- z.B. 'DILM7..15'
      default_archetype_id TEXT,
      shared_fields_json TEXT NOT NULL,     -- JSON: { torque, strippingLength, maxCrossSecTwin, dinRailMountOffsetY, clearances... }
      accessories_json TEXT DEFAULT '[]',   -- JSON: Erlaubte PartAccessoryRelation-Einträge für die ganze Serie
      updated_at TEXT NOT NULL
    );

    -- 2. Haupttabelle der Artikel im Durchlauf (Staged & Compiled Parts)
    CREATE TABLE IF NOT EXISTS staged_parts (
      id TEXT PRIMARY KEY,                  -- UUID oder 'manufacturer:article_nr'
      manufacturer TEXT NOT NULL,
      article_nr TEXT NOT NULL,
      series_id TEXT REFERENCES series_overrides(id),
      archetype_id TEXT,                    -- Verknüpfter IEC-Archetyp
      pipeline_status TEXT NOT NULL DEFAULT 'PENDING_INGEST',
        -- 'PENDING_INGEST' | 'INGESTED' | 'AI_EXTRACTED' | 'COMPILED' | 'VALIDATED' | 'ERROR'
      quality_tier TEXT DEFAULT 'BRONZE',   -- 'GOLD' | 'SILVER' | 'BRONZE'
      completeness_pct INTEGER DEFAULT 0,
      
      -- Roh-Ergebnis der KI aus Stufe 2
      ai_raw_json TEXT,
      ai_model_used TEXT,
      ai_cost_usd REAL DEFAULT 0.0,
      
      -- Flach kompiliertes Artikel-Objekt (CatalogPartVersion) aus Stufe 3
      compiled_part_json TEXT,
      
      -- Herkunfts-Tracking pro Feld: { "width": "AI", "torque": "SER", "defaultBmkPrefix": "ARC", "torque": "MAN" }
      field_origins_json TEXT DEFAULT '{}',
      
      -- Manuell vom User im 24px-Grid übersteuerte & gesperrte Felder (Schreibschutz!)
      manual_overrides_json TEXT DEFAULT '{}',
      
      -- Validierungsfehler aus Stufe 4
      validation_errors_json TEXT DEFAULT '[]',
      updated_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_staged_parts_status ON staged_parts(pipeline_status);
    CREATE INDEX IF NOT EXISTS idx_staged_parts_series ON staged_parts(manufacturer, series_id);

    -- 3. Kompilierte Funktionsgruppen (Für TreeGrid Ebene 2 & Descriptio-Export)
    CREATE TABLE IF NOT EXISTS compiled_function_groups (
      id TEXT PRIMARY KEY,
      part_id TEXT NOT NULL REFERENCES staged_parts(id) ON DELETE CASCADE,
      group_key TEXT NOT NULL,              -- z.B. 'COIL_1', 'MAIN_NO_3P', 'AUX_NC_1'
      function_type TEXT NOT NULL,          -- 'COIL', 'NO_CONTACT', 'NC_CONTACT', 'TERMINAL_PASS', 'POWER_OUT'
      symbol_definition_id TEXT,
      potential_propagation TEXT NOT NULL,  -- 'INTERNAL_BRIDGE' | 'SWITCHED_PASS_THROUGH' | 'POTENTIAL_SINK' | 'ISOLATED_TRANSFORM'
      is_positively_driven INTEGER DEFAULT 0,
      origin_source TEXT DEFAULT 'ARC'      -- 'ARC' | 'AI' | 'MAN'
    );

    -- 4. Kompilierte Anschlüsse / Pins (Für TreeGrid Ebene 3 & Descriptio-Export)
    CREATE TABLE IF NOT EXISTS compiled_pins (
      id TEXT PRIMARY KEY,
      part_id TEXT NOT NULL REFERENCES staged_parts(id) ON DELETE CASCADE,
      function_group_id TEXT REFERENCES compiled_function_groups(id) ON DELETE CASCADE,
      pin_name TEXT NOT NULL,               -- z.B. '13', '14', 'A1', 'A2', '1/L1'
      contact_type TEXT NOT NULL,
      electrical_role TEXT NOT NULL,        -- 'SOURCE' | 'SINK' | 'PASSIVE' | 'REFERENCE' | 'BIDIRECTIONAL'
      voltage_type TEXT NOT NULL,           -- 'AC' | 'DC' | 'AC_DC' | 'ANY'
      nominal_voltage REAL,
      min_voltage REAL,
      max_voltage REAL,
      max_current REAL,
      min_cross_sec REAL,
      max_cross_sec REAL,
      max_cross_sec_twin REAL,              -- Querschnitt bei Doppeladerendhülse
      max_connections INTEGER DEFAULT 1,
      connection_type TEXT,                 -- 'SCREW' | 'PUSH_IN' | 'SPRING' | 'BOLT'
      stripping_length_mm REAL,
      torque_nm REAL,
      physical_offset_x REAL,
      physical_offset_y REAL,
      physical_offset_z REAL,
      wire_entry_direction TEXT,            -- 'TOP' | 'BOTTOM' | 'FRONT'
      is_heuristic_geometry INTEGER DEFAULT 1,
      field_origins_json TEXT DEFAULT '{}',
      manual_overrides_json TEXT DEFAULT '{}'
    );

---

## 4. Geteilte Zod-Schemata (`packages/shared`)

In `packages/shared/src/schemas/` werden vier zentrale Dateien angelegt, die sowohl vom Backend-Compiler als auch vom React-Frontend importiert werden:

1. **`origins.schema.ts`:**
   * Definiert `FieldOriginEnum = z.enum(['AI', 'SER', 'ARC', 'HEU', 'MAN', 'NULL'])`, `PipelineStatusEnum`, `ElectricalRoleEnum` und `PotentialPropagationEnum`.
2. **`ai-extraction.schema.ts`:**
   * Das schlanke Schema für Structured Outputs der KI. Enthält **nur** im Text auffindbare Fakten (`name`, `type`, `seriesName`, `archetypeId`, `width`, `height`, `depth`, `weight`, `powerLoss`, `coilNominalVoltage`, `coilVoltageType`, `mainCurrentAmps`, `minCrossSec`, `maxCrossSec`, `torqueNm`, `strippingLengthMm`, `terminalLevels`) – alle Felder `.nullable()`.
3. **`archetype.schema.ts`:**
   * Definiert die Struktur eines IEC-Archetyps (Vorlage für Funktionsgruppen + Pin-Generierung) sowie `SeriesOverrideSchema` (Baureihen-Defaults).
4. **`descriptio-export.schema.ts`:**
   * Das finale Zielschema für den Export nach **Descriptio** (`CatalogPart`, `CatalogPartVersion`, `CatalogFunctionGroup`, `CatalogPin`, `PartAccessoryRelation`, `CatalogCableSpec`).

---

## 5. Schritt-für-Schritt Implementierungsplan (Meilensteine M1 bis M7)

### Meilenstein 1: Monorepo-Grundgerüst & Shared Schemas (`packages/shared`)
**Ziel:** Sauberes TypeScript-Workspace-Setup und 100 % typisierte Datenverträge.
* **Schritt 1.1:** Erstelle Root `package.json` (npm workspaces für `packages/shared`, `apps/server`, `apps/web`), `tsconfig.base.json` und `.gitignore`.
* **Schritt 1.2:** Implementiere `packages/shared/src/schemas/origins.schema.ts`.
* **Schritt 1.3:** Implementiere `packages/shared/src/schemas/ai-extraction.schema.ts`.
* **Schritt 1.4:** Implementiere `packages/shared/src/schemas/archetype.schema.ts`.
* **Schritt 1.5:** Implementiere `packages/shared/src/schemas/descriptio-export.schema.ts` und `packages/shared/src/index.ts`.
* **Abnahme-Kriterium M1:** `npm run build --workspace=@descriptio-forge/shared` läuft fehlerfrei durch.

---

### Meilenstein 2: Out-of-Repo Vault & Run-Snapshot-Engine (`apps/server/src/vault`)
**Ziel:** Lokale Datenhaltung unter `~/.descriptio-forge/` und das Klonen/Einfrieren ganzer Durchläufe.
* **Schritt 2.1 (`paths.ts`):** Hilfsmodul, das über `os.homedir()` den Pfad `~/.descriptio-forge/` auflöst und beim Start alle Unterordner (`raw-cache`, `runs`, `exports`) sicherstellt.
* **Schritt 2.2 (`credentials-store.ts`):** Liest und schreibt `~/.descriptio-forge/credentials.json`. Gibt ans Frontend niemals den Klartext-Key zurück, sondern nur eine maskierte Vorschau (`••••8f9a`) und `hasKey: boolean`.
* **Schritt 2.3 (`global-db.ts`):** Verbindungs-Singleton für `global-vault.sqlite` (`better-sqlite3` im WAL-Modus) inkl. Tabellen-Migration und Seeding der ersten 10 Standard-IEC-Archetypen (`CONTACTOR_3P_1NO`, `CONTACTOR_3P_1NC`, `MCB_1P`, `MCB_3P`, `MSS_3P`, `TERMINAL_THROUGH_1LVL_2PIN`, `TERMINAL_THROUGH_1LVL_4PIN`, `TERMINAL_PE_1LVL`, `PSU_1AC_24VDC`, `RELAY_COIL_2CO`).
* **Schritt 2.4 (`run-manager.ts`):** Verwaltet die Run-Datenbanken in `~/.descriptio-forge/runs/`:
  * `createRun(name)`: Legt eine neue `.sqlite`-Datei mit dem Run-Schema an.
  * `forkRun(sourceRunId, newName)`: Kopiert eine bestehende Run-SQLite-Datei atomar und registriert den Klon in `registered_runs`.
  * `toggleLockRun(runId)`: Schaltet `is_locked` um (verhindert Schreibzugriffe auf eingefrorene Snapshots).
  * `switchActiveRun(runId)`: Wechselt die aktive SQLite-Verbindung im Server zur Laufzeit.
* **Abnahme-Kriterium M2:** Server startet, legt `~/.descriptio-forge/` automatisch an und kann über tRPC-Routen Runs erstellen, klonen und sperren.

---

### Meilenstein 3: Multi-Provider KI-Gateway (`apps/server/src/ai-gateway`)
**Ziel:** Einbindung beliebiger KI-Provider, Live-Verbindungstest und automatischer Modell-Download.
* **Schritt 3.1 (`adapter.interface.ts`):** Definiert `IAiProviderAdapter` mit:
  * `testConnection(apiKey, baseUrl): Promise<{ ok: boolean; latencyMs: number; error?: string }>`
  * `fetchAvailableModels(apiKey, baseUrl): Promise<NormalizedAiModel[]>`
  * `extractPartFacts(params): Promise<{ data: AiExtractionOutput; inputTokens: number; outputTokens: number }>`
* **Schritt 3.2 (`gemini.adapter.ts`):** Nativer Adapter für Google Gemini API (unterstützt Text-Prompts, native PDF-Bytes via `inlineData` und `models.list`).
* **Schritt 3.3 (`openai-compat.adapter.ts`):** Universeller Adapter für OpenAI, DeepSeek, OpenRouter und lokales Ollama (`GET /v1/models` und `POST /v1/chat/completions` mit `response_format: { type: 'json_schema' }`).
* **Schritt 3.4 (`anthropic.adapter.ts`):** Adapter für Claude-Modelle (inkl. PDF-Support und strukturierter JSON-Ausgabe).
* **Schritt 3.5 (`cost-estimator.ts`):** Berechnet vor einem Batch-Lauf die erwarteten Token-Kosten anhand der in `ai_models` hinterlegten Preise.
* **Abnahme-Kriterium M3:** Über tRPC lassen sich API-Keys außerhalb des Repos speichern, die Verbindung live testen (mit `ms`-Anzeige) und alle verfügbaren Modelle in `global-vault.sqlite` synchronisieren.

---

### Meilenstein 4: Deterministischer Regel-Compiler (`apps/server/src/compiler`)
**Ziel:** Aus wenigen KI-Fakten entsteht vollautomatisch ein ERC- und 3D-fähiger Descriptio-Artikel.
* **Schritt 4.1 (`archetype-expander.ts`):** Nimmt `archetypeId` + extrahierte Spannungs-/Stromwerte und generiert `compiled_function_groups` und `compiled_pins` inkl. `potentialPropagation`, `pinElectricalRole` und `defaultBmkPrefix`.
* **Schritt 4.2 (`series-merger.ts`):** Lädt die passende Baureihe aus `series_overrides` und füllt alle im KI-Extrakt `null` gebliebenen Felder (`torque`, `strippingLength`, `maxCrossSecTwin`, `dinRailMountOffsetY`, `clearances`, `accessories`) mit Herkunft `SER` auf.
* **Schritt 4.3 (`geometry-heuristics.ts`):** Berechnet für alle Pins ohne echte CAD-Koordinaten die vorläufigen 3D-Anschlusspunkte (`physicalOffsetX/Y/Z` und `wireEntryDirection = TOP / BOTTOM`) anhand der Gehäusemaße (`width`, `height`, `depth`) und markiert sie mit `HEU`.
* **Schritt 4.4 (`part-compiler.ts`):** Führt alle Stufen unter strikter Beachtung von `manual_overrides_json` (`MAN` hat immer Vorrang!) zusammen, validiert gegen `DescriptioPartExportSchema` und speichert das Ergebnis in der aktiven Run-DB.
* **Abnahme-Kriterium M4:** Ein Test-Artikel mit nur 5 KI-Basiswerten wird in unter 5 ms zu einem vollständigen Datensatz mit 8 Pins, 3 Funktionsgruppen, Drehmoment und 3D-Pin-Koordinaten kompiliert.

---

### Meilenstein 5: Frontend-Fundament im 24px Industrie-Look (`apps/web/src/components`)
**Ziel:** Exakte Umsetzung des UI-Stilguides (Teil 2 der `MANIFEST.md`) als wiederverwendbare Basis-Komponenten.
* **Schritt 5.1 (`AppShell.tsx` & `TopRunBar.tsx`):**
  * Permanente `h-[32px]` Kopfzeile mit Run-Dropdown, `[Run klonen]`, `[Sperren]` und KI-Status-Indikator.
  * Linke Navigations-Sidebar (`w-[220px]`, 24px Zeilenhöhe, 12px Einrückung) zum Umschalten zwischen:
    1. `Harvest & Compiler Grid`
    2. `IEC-Archetypen & Serien`
    3. `KI-Provider & Modell-Tresor`
    4. `Run-Manager & Diffing`
    5. `Symbol Studio (IEC 60617)` *(Vorbereitet mit Platzhalter-Ansicht)*
* **Schritt 5.2 (`HighDensityTreeGrid.tsx`):**
  * Wiederverwendbares 24px-TreeGrid auf Basis von `@tanstack/react-table` und `@tanstack/react-virtual`.
  * Implementiert Spalte 0 (`w-[28px]` Status-Icon), Spalte 1 (`w-[28px]` Batch-Checkbox), Spalte 2 (Hierarchie mit 16px Versatz, L-Führungslinien inkl. `isLastChild ? 'h-[12px]' : 'h-full'` und `PlusSquare`/`MinusSquare` Toggles).
  * Unterstützt Tastatur-Handling (`ArrowUp`, `ArrowDown`, `ArrowLeft`, `ArrowRight`, `F2`, `Enter`, `Escape`, `Space`) sowie Inline-Editing in `h-[22px]` Inputs ohne Veränderung der 24px Zeilenhöhe.
* **Schritt 5.3 (`OriginBadge.tsx` & `IndustrialHoverCard.tsx`):**
  * Kompakte 10px-Badges für `AI`, `SER`, `ARC`, `HEU`, `MAN`.
  * Verzögerte Portal-Hoverkarte mit strikten `600ms` Einschaltverzögerung (`INDUSTRIAL_HOVER_DELAY_MS = 600`) und Lazy-Loading.
* **Abnahme-Kriterium M5:** Alle Checklisten-Punkte aus Kapitel 15 der `MANIFEST.md` (24px Zeilenhöhe, L-Linien, Ziffernflucht `tabular-nums`, 600ms Hover) sind im Browser sichtbar erfüllt.

---

### Meilenstein 6: Die 4 Arbeits-Ansichten (`apps/web/src/views`)
**Ziel:** Verknüpfung des 24px-Frontends mit den tRPC-Backend-Routen.
* **Schritt 6.1 (`AiVaultView.tsx`):**
  * Obere 24px-Tabelle: Liste der Provider, Eingabe/Änderung des API-Keys (wird direkt nach `~/.descriptio-forge/credentials.json` geschrieben), Button **`[Verbindung testen]`** (zeigt Live-Latenz in `ms` oder Fehler) und Button **`[Modelle abrufen & speichern]`**.
  * Untere 24px-Tabelle: Alle abgerufenen Modelle mit Filter, Aktiv-Checkbox, Preis-Spalten (`tabular-nums`) und Task-Routing-Badges (`[HTML-Extrakt]`, `[PDF-Vision]`, `[Symbol-SVG]`).
* **Schritt 6.2 (`RunManagerView.tsx`):**
  * 24px-Tabelle aller gespeicherten `.sqlite`-Runs mit Buttons zum Aktivieren, Klonen (`Fork`), Einfrieren (`Lock`) und Löschen sowie Import einer CSV/TXT-Artikelnummernliste in einen Run.
* **Schritt 6.3 (`ArchetypeView.tsx`):**
  * Split-View zum Bearbeiten der IEC-Archetypen (Funktionsgruppen & Pin-Schablonen) und der Baureihen-Vererbung (`CatalogSeries`, z. B. Drehmoment & Zubehör für eine ganze Eaton- oder Weidmüller-Serie).
* **Schritt 6.4 (`HarvestGridView.tsx` & `DualInspectorPanel.tsx`):**
  * Das große 24px-TreeGrid (`Serie -> Artikel -> Funktionsgruppe -> Pin`) mit Batch-Aktionsleiste (*„Ausgewählte mit KI extrahieren“*, *„Ausgewählte kompilieren“*).
  * Rechts daneben der `DualInspectorPanel`: Tab 1 zeigt das 24px-Property-Grid mit `AI`/`SER`/`ARC`/`HEU`/`MAN`-Badges und Schreibschutz-Schloss; Tab 2 zeigt den gecachten Rohdaten-Text bzw. das PDF-Datenblatt als Beweis.

---

### Meilenstein 7: Scraper-Queue, Run-Diffing & Descriptio-Exporter
**Ziel:** Massenverarbeitung für die 20.000 Artikel und Export für die Haupt-App.
* **Schritt 7.1 (`batch-queue.ts`):** Pausierbare Hintergrund-Queue mit `p-limit` (z. B. Concurrency 5), Live-Fortschrittsanzeige in der `h-[24px]` Footer-Statusleiste und automatischem Stopp bei Erreichen des Kosten-Limits.
* **Schritt 7.2 (`raw-ingestor.ts`):** Modul zum Einlesen lokaler PDF-Ordner, HTML-Dateien oder URLs in den globalen Cache (`raw_documents`).
* **Schritt 7.3 (`run-differ.ts` & `exporter.ts`):**
  * Vergleicht zwei Runs Feld für Feld im 24px-Grid.
  * Exportiert alle validierten Artikel eines Runs als flaches `.descriptio.json`-Paket nach `~/.descriptio-forge/exports/`.

---

## 6. Start-Prompt für den Coding-Agenten

    Lies zuerst die Dateien MANIFEST.md und AGENT_PLAN.md vollständig durch. Sie sind das verbindliche Architektur- und UI-Gesetz für dieses Projekt ("Descriptio Forge").

    Bitte beachte bei jedem Schritt strikt folgende Regeln:
    1. Liefere mir immer vollständige Dateien (niemals Platzhalter wie "// ... rest of code").
    2. Teile den Code in kleine, übersichtliche Dateien auf (maximal 200-250 Zeilen pro Datei).
    3. Halte dich im Frontend zu 100 % an den 24px Industrie-Look aus Teil 2 der MANIFEST.md (exakt h-[24px] Zeilenhöhe, 1px Excel-Gitternetz, L-Führungslinien, tabular-nums für Zahlen).
    4. Speichere API-Keys, Caches und SQLite-Datenbanken niemals im Projektordner, sondern immer über os.homedir() unter ~/.descriptio-forge/.

    Wir starten jetzt mit MEILENSTEIN 1 (Monorepo-Grundgerüst & packages/shared Zod-Schemata) gemäß AGENT_PLAN.md.
    Erstelle bitte zuerst die Projektstruktur und alle vollständigen Dateien für Meilenstein 1.
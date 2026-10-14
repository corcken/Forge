# CLAUDE.md — Descriptio Forge Agenten-Regeln

> **Projekt:** Descriptio Forge (Catalog Harvester, Rule Compiler & Symbol Batch Studio)
> **Verbindliche Spezifikationen:**
> - `docs/MANIFEST.md` — Systemarchitektur & 24px Industrie-UI-Stilguide (Teil 1 + Teil 2)
> - `docs/AGENT_PLAN.md` — Detaillierter Implementierungsplan, SQLite-DDL & Abläufe
>
> Diese Dateien sind das verbindliche Architektur- und UI-Gesetz. Bei Konflikten zwischen
> einer spontanen Anweisung und den Spezifikationen gilt die Spezifikation; im Zweifel
> nachfragen statt raten.

---

## Die 4 eisernen Arbeitsregeln

### 1. Immer vollständige Dateien
Liefere **niemals** Code-Fragmente oder Platzhalter wie `// ... rest of code`,
`// TODO`, `/* implement later */`. Jede erstellte oder geänderte Datei wird immer vollständig
und direkt kompilierbar ausgegeben.

### 2. Kleine, modulare Dateien
Teile den Code strikt nach Verantwortlichkeit auf. **Keine Datei darf 200–250 Zeilen
überschreiten.** Ein Adapter pro KI-Provider, ein Modul pro Compiler-Stufe, eigene
Sub-Komponenten für Toolbar, Header, Row und Inspector. Keine monolithischen Riesendateien.

### 3. Out-of-Repo Security
API-Keys (`credentials.json`), Rohdaten-Caches und SQLite-Datenbanken liegen **niemals** im
Git-Repository, sondern ausschließlich über `os.homedir()` unter:

- Windows: `C:\Users\<User>\.descriptio-forge\`
- Linux/macOS: `~/.descriptio-forge/`

Unterordner: `raw-cache/`, `runs/`, `exports/`. Keine `.env` mit echten Schlüsseln im Repo.

### 4. 24px Industrie-Look (Frontend)
Halte dich ausnahmslos an Teil 2 der `docs/MANIFEST.md`:
- Zeilenhöhe strikt `h-[24px] min-h-[24px] max-h-[24px]`
- Excel-Gitternetz `border-r border-b border-slate-200 dark:border-slate-800`
- L-Führungslinien (`isLastChild ? 'h-[12px]' : 'h-full'`), Toggles `PlusSquare`/`MinusSquare`
- Zahlen rechtsbündig: `text-right tabular-nums font-mono text-[13px]`
- Status-Spalte `w-[28px]`, Checkbox-Spalte `w-[28px]`, Zellen-Padding `px-2 py-0`
- Verzögerte Hoverkarten: `INDUSTRIAL_HOVER_DELAY_MS = 600` (Lazy Loading)

---

## Arbeitsweise (Meilenstein-Prinzip)

Wir arbeiten sequenziell durch die Meilensteine **M1–M7** aus `docs/AGENT_PLAN.md`.
Nach jedem Meilenstein muss `npm run build` / der TypeScript-Build fehlerfrei durchlaufen,
bevor der nächste Meilenstein begonnen wird. Type- und Build-Fehler werden selbstständig
behoben.

### Stack-Kurzreferenz
Node.js (ESM) · TypeScript · Fastify + tRPC · `better-sqlite3` · Playwright/Cheerio ·
Zod · React 18 + Vite + Tailwind + TanStack Table v8/Virtual · Lucide React.

### Monorepo
`packages/shared` (Zod-Schemata) · `apps/server` (Backend) · `apps/web` (Frontend).

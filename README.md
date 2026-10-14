# Descriptio Forge ⚡

> **Catalog Harvester, Rule Compiler & Symbol Batch Studio**  
> Lokale „Datenfabrik“ zur Extraktion, KI-Analyse, Regel-Kompilierung und Validierung von E-CAD-Artikeldaten (`.descriptio.json`) für die E-CAD-Suite **Descriptio**.

---

## 📖 Übersicht

**Descriptio Forge** entlastet die Hauptapplikation von Scraping-Overhead, Staging-Daten, LLM-Prompts und komplexer Vererbungslogik. Es arbeitet als eigenständiger lokaler Entwicklungsserver mit Web-GUI.

Detaillierte Architektur- und UI-Spezifikationen befinden sich im [Architektur-Manifest](docs/MANIFEST.md).

---

## 🏛️ Die 4 Grundgesetze von Descriptio Forge

1. **Run-Isolation:** Unveränderlicher Rohdaten-Cache (`global-vault.sqlite`) getrennt von isolierten, klonbaren Durchläufen (`~/.descriptio-forge/runs/run_<id>.sqlite`).
2. **KI extrahiert Fakten – deterministischer Code baut das Modell:** LLMs extrahieren tabellarische Rohdaten; deterministische Regel-Compiler erzeugen E-CAD-Archetypen, Pin-Logik und ERC-Strukturen.
3. **Zero-Git-Leak Security:** Alle Provider-Keys und lokalen Datenbanken liegen außerhalb des Git-Repositories im Benutzerverzeichnis (`~/.descriptio-forge/credentials.json`).
4. **Flattening vor Export:** Alle Vererbungen werden vor dem Export aufgelöst. Das resultierende Datenpaket ist flach und direkt in Descriptio importierbar.

---

## 🛠️ Technologie-Stack

* **Backend:** Node.js (ESM), TypeScript, Fastify, tRPC
* **Frontend:** React, Vite, Tailwind CSS, TanStack Table v8, TanStack Virtual, Lucide Icons
* **Datenbank:** `better-sqlite3` (für synchrone, ultraschnelle SQLite-Snapshots)
* **Ingestion:** Playwright, Cheerio, pdfjs-dist / Multimodal PDF-Upload
* **Validierung:** Zod (100 % schema-kompatibel zur Descriptio-Kernapp)

---

## 🚀 Erste Schritte

*(Entwicklungsumgebung im Aufbau)*

```bash
# Abhängigkeiten installieren
npm install

# Entwicklungsserver starten
npm run dev
```

---

## 📄 Lizenz & Dokumentation

* Siehe [docs/MANIFEST.md](docs/MANIFEST.md) für alle Spezifikationen, Datenmodelle und UI-Wireframes.

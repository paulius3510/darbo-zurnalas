# Darbo Žurnalas - Projekto Kontekstas ir Planas

## Apžvalga

**Projekto tikslas:** Sukurti darbo valandų ir medžiagų sekimo web aplikaciją plytelių klojimo verslui su sinchronizacija tarp įrenginių.

**Vartotojas:** Paulius - plytelių klojėjas, dirbantis privačiai Reykjavike, Islandijoje. Dirba pas įvairius klientus skirtinguose objektuose.

**Įrenginiai:**
- Mac Pro M3 (pagrindinis kompiuteris)
- Google Pixel 9 XL (mobilusis)
- Naršyklė: Chrome abiejuose įrenginiuose

**Esamas workflow:** Iki šiol duomenys vesti ranka į knygą. Dabar pereinama prie skaitmeninio žurnalo.

---

## Esamas Prototipas

### Technologija
React/JSX komponentas, šiuo metu veikiantis Claude Artifacts aplinkoje.

### Funkcionalumas
- Projektų/objektų valdymas (klientai, adresai, valandiniai įkainiai)
- Darbo valandų sekimas (data, pradžia, pabaiga, pastabos)
- Medžiagų/efnių sekimas (data, pavadinimas, kiekis, kaina)
- JSON importo funkcija ("Flytja inn")
- Sąskaitos/reikningur peržiūra
- Būsenos kopijavimas klientui

### Duomenų struktūra

**Darbo valandos (vinna):**
```json
{
  "vinna": [
    {
      "dags": "2025-11-28",
      "byrjun": "12:30",
      "lok": "15:00",
      "stundir": 2.5,
      "athugasemd": "Flísalögn á sturtagólfi"
    }
  ]
}
```

**Medžiagos (efni):**
```json
{
  "efni": [
    {
      "dags": "2025-11-17",
      "heiti": "Weber Floor 4150 Fine Flow 25kg",
      "magn": "11 stk",
      "verd": 42658
    }
  ]
}
```

### Kalba ir valiuta
- Interface: islandų kalba (Verkefnaskrá, Vinnustundir, Efni, kt.)
- Valiuta: ISK (Islandijos kronos)
- Tipinis valandinis įkainis: ~8.500 kr/klst

### Esamas klientas/objektas
- Ólafur Hilmarsson - aktyvus projektas su realiais duomenimis

---

## Tikslinė Architektūra

### Reikalavimai
1. **Sinchronizacija** - duomenys pasiekiami iš Mac ir Pixel
2. **Offline palaikymas** - galimybė dirbti be interneto, sync vėliau
3. **PWA** - app-like patirtis telefone (ikona home screen)
4. **Paprastumas** - minimali priežiūra, nemokamos paslaugos

### Rekomenduojama architektūra

```
┌─────────────────────────────────────────────────────┐
│                    FRONTEND                          │
│  HTML/CSS/JS (vanilla arba React build)             │
│  PWA manifest + Service Worker                       │
│  Hosted: GitHub Pages                                │
│  URL: https://[username].github.io/darbo-zurnalas   │
└─────────────────────────────────────────────────────┘
                         ↕
┌─────────────────────────────────────────────────────┐
│                   BACKEND/API                        │
│  Google Apps Script (Web App)                        │
│  Veikia kaip REST API tarpininkas                   │
└─────────────────────────────────────────────────────┘
                         ↕
┌─────────────────────────────────────────────────────┐
│                   DATABASE                           │
│  Google Sheets                                       │
│  Lapai: projects, work_entries, materials           │
│  Paulius jau turi 2TB Google Drive                  │
└─────────────────────────────────────────────────────┘
```

### Alternatyvios architektūros (svarstyti jei reikia)

| Variantas | Privalumai | Trūkumai |
|-----------|------------|----------|
| Firebase + Firestore | Real-time sync, offline | Sudėtingesnė konfigūracija |
| Supabase | PostgreSQL, gera dokumentacija | Reikia mokytis naujos platformos |
| Lokalus JSON + manual sync | Paprasta | Nėra auto-sync |

---

## Įrankiai ir Aplinka

### Pauliaus turimi įrankiai
- **VS Code** - pagrindinis editorius
- **Claude Code CLI** - veikia VS Code ir Mac Terminal
- **GitHub** - repozitorija sukurta, bet GitHub Pages dar nenaudotas
- **Google Drive** - 2TB saugykla

### Claude Code integracijos galimybės

**VS Code su Claude Code:**
- Tiesioginis failų kūrimas/redagavimas
- Terminal komandų vykdymas
- Git operacijos

**Terminal CLI:**
- `claude` komanda interaktyviam režimui
- Projekto konteksto perdavimas per failus

**Rekomenduojami Claude Code naudojimo būdai:**
1. Pradėti sesiją projekto aplanke: `cd darbo-zurnalas && claude`
2. Naudoti `/init` komandą projekto kontekstui
3. Įtraukti šį dokumentą kaip kontekstą
4. Leisti Claude Code kurti/modifikuoti failus tiesiogiai

---

## Implementacijos Gairės

### Fazė 1: Paruošimas
- [ ] Sukurti GitHub repo `darbo-zurnalas`
- [ ] Sukonfigūruoti GitHub Pages
- [ ] Sukurti bazinę projekto struktūrą

### Fazė 2: Google Sheets + Apps Script
- [ ] Sukurti Google Sheets su struktūra (projects, work_entries, materials)
- [ ] Parašyti Apps Script Web App (GET/POST endpoints)
- [ ] Testuoti API

### Fazė 3: Frontend
- [ ] Konvertuoti React į vanilla JS arba sukurti build procesą
- [ ] Integruoti su Google Sheets API
- [ ] Pridėti PWA manifest ir service worker
- [ ] Pridėti offline cache

### Fazė 4: Testavimas ir deploy
- [ ] Testuoti Mac Chrome
- [ ] Testuoti Pixel Chrome
- [ ] Testuoti offline režimą
- [ ] Pridėti į home screen kaip PWA

---

## Failų Struktūra (siūloma)

```
darbo-zurnalas/
├── index.html              # Pagrindinis puslapis
├── css/
│   └── styles.css          # Stiliai
├── js/
│   ├── app.js              # Pagrindinė logika
│   ├── api.js              # Google Sheets API wrapper
│   └── storage.js          # Lokalus cache + sync
├── manifest.json           # PWA manifest
├── sw.js                   # Service Worker
├── icons/
│   ├── icon-192.png
│   └── icon-512.png
├── docs/
│   └── PROJECT_CONTEXT.md  # Šis dokumentas
└── google-apps-script/
    └── Code.gs             # Apps Script kodas (reference)
```

---

## Google Sheets Struktūra (siūloma)

### Lapas: projects
| id | name | client | address | hourlyRate | status | createdAt |
|----|------|--------|---------|------------|--------|-----------|

### Lapas: work_entries
| id | projectId | date | startTime | endTime | hours | notes |
|----|-----------|------|-----------|---------|-------|-------|

### Lapas: materials
| id | projectId | date | name | quantity | amount |
|----|-----------|------|------|----------|--------|

---

## Claude Integracija (Nuolatinė)

### Čekių nuskaitymas
Paulius įkelia čekių nuotraukas į Claude (web arba Claude Code), Claude generuoja JSON formatą importui.

**Tipinės parduotuvės:**
- Múrbúðin
- Byko
- IKEA
- Húsasmiðjan

### Darbo įrašai
Paulius aprašo darbo dieną lietuviškai, Claude konvertuoja į JSON su islandiškomis pastabomis.

**Pavyzdys:**
- Input: "28.11.2025, 12:30-15:00, dušo grindų plytelių klijavimas"
- Output: `{"vinna": [{"dags": "2025-11-28", "byrjun": "12:30", "lok": "15:00", "stundir": 2.5, "athugasemd": "Flísalögn á sturtagólfi"}]}`

---

## Svarbios Pastabos

### Lankstumas
Šis dokumentas yra gairės, ne griežtas planas. Implementacijos metu gali keistis:
- Technologijų pasirinkimas
- Failų struktūra
- API dizainas
- UI/UX detalės

### Prioritetai
1. **Veikia** - pirma funkcionalumas, paskui tobulinimai
2. **Paprasta** - vengti per-engineering
3. **Sinchronizacija** - pagrindinis tikslas

### Žinomi apribojimai
- Google Apps Script turi kvotų limitus (pakanka asmeniniam naudojimui)
- GitHub Pages tik statiniams failams (nėra server-side)
- PWA reikalauja HTTPS (GitHub Pages suteikia automatiškai)

---

## Naudingos Nuorodos

- [GitHub Pages dokumentacija](https://pages.github.com/)
- [Google Apps Script Web Apps](https://developers.google.com/apps-script/guides/web)
- [PWA dokumentacija](https://web.dev/progressive-web-apps/)
- [Google Sheets API](https://developers.google.com/sheets/api)

---

## Kontaktas su Claude

### Claude Web (dabartinis)
- Čekių nuskaitymas
- JSON generavimas
- Konsultacijos

### Claude Code (VS Code / Terminal)
- Kodo generavimas
- Failų kūrimas/redagavimas
- Git operacijos
- Debugging

**Rekomenduojama:** Pradėti Claude Code sesiją su šiuo dokumentu kaip kontekstu:
```bash
cd ~/Projects/darbo-zurnalas
claude
# Tada: "Perskaityk PROJECT_CONTEXT.md ir pradėkime nuo Fazės 1"
```

---

*Dokumentas sukurtas: 2025-11-29*
*Paskutinis atnaujinimas: 2025-11-29*

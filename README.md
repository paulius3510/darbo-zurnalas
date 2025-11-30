# Darbo Žurnalas

Darbo valandų ir medžiagų sekimo PWA aplikacija plytelių klojimo verslui.

## 🚀 Live Demo

**Production:** https://paulius3510.github.io/darbo-zurnalas/

## 📱 Funkcionalumas

- ✅ Projektų valdymas (klientai, adresai, valandiniai įkainiai)
- ✅ Darbo valandų sekimas (data, pradžia, pabaiga, pastabos)
- ✅ Medžiagų/efnių sekimas (data, pavadinimas, kiekis, kaina)
- ✅ JSON importo funkcija
- ✅ Sąskaitos/reikningur peržiūra
- ✅ Būsenos kopijavimas klientui
- ✅ PWA support (veikia offline, galima įdiegti telefone)
- ✅ LocalStorage duomenų saugojimas
- ✅ Google Sheets sinchronizacija (veikia)

## 🛠️ Tech Stack

- **Frontend:** React 18 + TypeScript
- **Styling:** TailwindCSS 3.4
- **Build:** Vite 6
- **Icons:** Lucide React
- **Deployment:** GitHub Pages
- **Backend:** Google Apps Script Web App (optional)
- **Database:** Google Sheets (optional)

## 📦 Installation

```bash
# Clone repository
git clone https://github.com/paulius3510/darbo-zurnalas.git
cd darbo-zurnalas

# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Deploy to GitHub Pages
npm run deploy
```

## 🔧 Development

```bash
# Start dev server (http://localhost:5173/darbo-zurnalas/)
npm run dev

# Build production
npm run build

# Preview production build
npm run preview
```

## 📊 Google Sheets Integration (Optional)

Aplikacija šiuo metu veikia su LocalStorage. Jei nori sinchronizuoti duomenis tarp įrenginių per Google Sheets:

### Žingsnis 1: Sukurti Google Sheets

1. Atidaryti: https://docs.google.com/spreadsheets/d/1ds-_5uX6T4qrQdsNK_xvW7i7PPFam8ckbsa2NDLvnnk/edit
2. Arba sukurti naują Sheet
3. Sekti instrukcijas: [docs/GOOGLE_SHEETS_SETUP.md](docs/GOOGLE_SHEETS_SETUP.md)

### Žingsnis 2: Deploy Apps Script

1. Google Sheets → **Extensions** → **Apps Script**
2. Nukopijuoti kodą iš `google-apps-script/Code.gs`
3. **Deploy** → **New deployment** → **Web app**
4. Nukopijuoti Web App URL

### Žingsnis 3: Konfigūruoti React App

1. Sukurti `.env` failą projekto šaknyje (arba nukopijuoti iš `.env.example`):
   ```bash
   cp .env.example .env
   ```

2. Užpildyti `.env` failą:
   ```env
   VITE_APPS_SCRIPT_URL=https://script.google.com/macros/s/YOUR_ID/exec
   VITE_API_ENABLED=true
   ```

3. Rebuild ir deploy:
   ```bash
   npm run deploy
   ```

Išsamios instrukcijos: [docs/ENV_SETUP.md](docs/ENV_SETUP.md)

## 📱 PWA Installation

### Mac/Desktop:
1. Atidaryti https://paulius3510.github.io/darbo-zurnalas/
2. Chrome → Address bar → Install icon

### Android (Pixel):
1. Atidaryti Chrome
2. Eiti į https://paulius3510.github.io/darbo-zurnalas/
3. Menu → "Add to Home screen"

## 🗂️ Projekto Struktūra

```
darbo-zurnalas/
├── index.html              # Pagrindinis HTML
├── src/
│   ├── main.tsx           # React entry point
│   ├── App.tsx            # Main App component
│   ├── WorkHoursJournal.tsx  # Pagrindinis komponentas
│   ├── index.css          # TailwindCSS styles
│   └── api/
│       └── googleSheetsAPI.ts  # Google Sheets API
├── public/
│   ├── manifest.json      # PWA manifest
│   ├── sw.js             # Service Worker
│   ├── icon.svg          # App icon
│   └── icons/            # PWA icons
├── docs/
│   ├── GOOGLE_SHEETS_SETUP.md  # Sheets struktūros instrukcijos
│   ├── ENV_SETUP.md            # Environment konfigūracija
│   └── CORS_FIX.md             # CORS problemų sprendimai
└── google-apps-script/
    └── Code.gs           # Apps Script kodas
```

## 🌐 Kalba ir Valiuta

- **Interface:** Islandų kalba (Verkefnaskrá, Vinnustundir, Efni)
- **Valiuta:** ISK (Islandijos kronos)
- **Data formatas:** IS-IS locale

## 🔐 Saugumas

- LocalStorage duomenys saugomi tik naršyklėje
- Google Sheets prieiga tik su tavo Google account
- Apps Script vykdomas kaip tu
- Jokių slaptažodžių ar API keys kode

## 📝 Changelog

### v1.1.0 (2025-11-30)
- ✅ Pilna Google Sheets sinchronizacija (visos CRUD operacijos)
- ✅ CORS pataisymas (perjungta iš POST į GET)
- ✅ Service Worker pataisymai (API bypass)
- ✅ Pradinio duomenų įkėlimo iš Sheets palaikymas
- ✅ onBlur sync tekstiniams laukams

### v1.0.0 (2025-11-29)
- ✅ Pradinis release
- ✅ Vite + React + TypeScript setup
- ✅ PWA support
- ✅ GitHub Pages deployment
- ✅ Google Sheets API integracija (paruošta)

## 📄 License

Private project - Paulius Grigaliunas

## 🤝 Support

Jei reikia pagalbos:
- Dokumentacija: [docs/](docs/)
- GitHub Issues: https://github.com/paulius3510/darbo-zurnalas/issues

---

🤖 Generated with [Claude Code](https://claude.com/claude-code)

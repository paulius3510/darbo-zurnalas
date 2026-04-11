# Darbo Žurnalas

Darbo valandų ir medžiagų sekimo PWA aplikacija plytelių klojimo verslui.

## Live Demo

**Production:** https://paulius3510.github.io/darbo-zurnalas/

## Funkcionalumas

- Projektų valdymas (klientai, adresai, valandiniai įkainiai)
- Darbo valandų sekimas (data, pradžia, pabaiga, pastabos)
- Medžiagų/efnių sekimas (data, pavadinimas, kiekis, kaina)
- JSON importo funkcija
- Profesionalus Reikningur su išsamia informacija
- Public Invoice nuoroda klientui (dalintis per SMS/email)
- PWA support (veikia offline, galima įdiegti telefone)
- Google Auth prisijungimas
- Firebase Firestore duomenų saugojimas su offline palaikymu

## Tech Stack

- **Frontend:** React 18 + TypeScript
- **Styling:** TailwindCSS 3.4
- **Build:** Vite 6
- **Icons:** Lucide React
- **Auth:** Firebase Authentication (Google)
- **Database:** Firebase Firestore
- **Deployment:** GitHub Pages

## Installation

```bash
git clone https://github.com/paulius3510/darbo-zurnalas.git
cd darbo-zurnalas
npm install
npm run dev
```

## Firebase Setup

1. Sukurti Firebase projektą: https://console.firebase.google.com
2. Įjungti Authentication (Google provider)
3. Sukurti Firestore Database
4. Sukurti `.env` failą su Firebase config:

```env
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```

5. Nustatyti Firestore security rules (žr. `firestore.rules`)

## PWA Installation

### Desktop:
1. Atidaryti https://paulius3510.github.io/darbo-zurnalas/
2. Chrome → Address bar → Install icon

### Android:
1. Atidaryti Chrome
2. Eiti į https://paulius3510.github.io/darbo-zurnalas/
3. Menu → "Add to Home screen"

## Projekto Struktūra

```
darbo-zurnalas/
├── index.html
├── firestore.rules
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── WorkHoursJournal.tsx
│   ├── firebase.ts
│   ├── index.css
│   └── api/
│       └── firebaseAPI.ts
├── public/
│   ├── manifest.json
│   ├── sw.js
│   ├── icon.svg
│   └── icons/
```

## Kalba ir Valiuta

- **Interface:** Islandų kalba (Verkefnaskrá, Vinnustundir, Efni)
- **Valiuta:** ISK (Islandijos kronos)

## License

Private project - Paulius Grigaliunas

# Environment Variables Setup

## 📝 Quick Start

1. **Nukopijuoti template:**
   ```bash
   cp .env.example .env
   ```

2. **Atidaryti `.env` failą ir užpildyti:**
   ```env
   VITE_APPS_SCRIPT_URL=https://script.google.com/macros/s/ABC.../exec
   VITE_API_ENABLED=true
   ```

3. **Restart dev server:**
   ```bash
   npm run dev
   ```

---

## 🔑 Environment Variables

### `VITE_APPS_SCRIPT_URL`
- **Aprašymas:** Google Apps Script Web App deployment URL
- **Gaunamas:** Apps Script → Deploy → Web app → Copy URL
- **Pavyzdys:** `https://script.google.com/macros/s/AKfycbx.../exec`
- **Default:** `''` (tuščias)

### `VITE_API_ENABLED`
- **Aprašymas:** Įjungti/išjungti Google Sheets sync
- **Reikšmės:** `true` arba `false`
- **Default:** `false`

---

## 🔐 Saugumas

### ⚠️ SVARBU: Kodėl .env failas .gitignore?

`.env` failas **NIEKADA** neturi būti commit'intas į Git, nes:
1. Jame gali būti sensitive informacija
2. Skirtingose aplinkose (dev/prod) gali būti skirtingi URL

### ✅ Web App URL yra SAUGUS, nes:

Nors Web App URL yra "public accessible", **tavo duomenys SAUGŪS**:

1. **Apps Script autentifikacija:**
   - Deployed kaip: "Anyone can access"
   - Vykdomas kaip: "Me" (tavo Google account)
   - Tai reiškia, kad API naudoja TAVO leidimus

2. **Kas gali atsitikti:**
   - ✅ Tu gali skaityti/rašyti savo Google Sheets
   - ❌ Kiti negali pasiekti tavo duomenų
   - ❌ Kiti negali redaguoti tavo Sheets
   - ⚠️ Kiti gali call'inti URL (bet negali nieko padaryti)

3. **Google apsauga:**
   - Rate limiting automatically
   - Logging visi requests
   - Gali revoke deployment bet kada

---

## 🚀 Development Workflow

### Lokalus development:
```bash
# 1. Sukurti .env failą
cp .env.example .env

# 2. Užpildyti su tavo Web App URL
nano .env

# 3. Paleisti dev server
npm run dev
```

### Production deployment:
```bash
# Build automatiškai naudos .env reikšmes
npm run build

# Deploy to GitHub Pages
npm run deploy
```

---

## 🧪 Testavimas

### Patikrinti ar veikia:
1. Atidaryti Console (F12)
2. Turėtų būti log: `"Syncing to Google Sheets..."`
3. Jei klaida: `"API disabled, using localStorage only"`

### Debug mode:
```typescript
// src/api/googleSheetsAPI.ts
console.log('API_ENABLED:', API_ENABLED);
console.log('APPS_SCRIPT_URL:', APPS_SCRIPT_WEB_APP_URL);
```

---

## 📋 Troubleshooting

### Problem: "API disabled, using localStorage only"
**Solution:**
- Patikrinti ar `.env` turi `VITE_API_ENABLED=true`
- Restart dev server (`Ctrl+C`, `npm run dev`)

### Problem: "Failed to fetch"
**Solution:**
- Patikrinti Web App URL `.env` faile
- Patikrinti ar Apps Script deployed
- Patikrinti ar Web App access: "Anyone"

### Problem: .env pakeitimai neveikia
**Solution:**
- Vite cache .env failus
- **Visada restart dev server** po .env pakeitimų
- `Ctrl+C` → `npm run dev`

---

## 🔄 Migration Guide

### Nuo localStorage į Google Sheets:

1. **Backup localStorage data:**
   - Atidaryti Console (F12)
   - Vykdyti: `localStorage.getItem('verkefni_data')`
   - Nukopijuoti output

2. **Enable API:**
   ```env
   VITE_API_ENABLED=true
   ```

3. **Sync to Sheets:**
   - Aplikacijoje bus automatinis sync pirmą kartą

---

## 📖 Examples

### .env (development):
```env
VITE_APPS_SCRIPT_URL=https://script.google.com/macros/s/AKfycbx-DEV.../exec
VITE_API_ENABLED=true
```

### .env (production) - SAME:
```env
VITE_APPS_SCRIPT_URL=https://script.google.com/macros/s/AKfycbx-PROD.../exec
VITE_API_ENABLED=true
```

⚠️ **Pastaba:** GitHub Pages build'e environment variables compile'inami į JavaScript bundle. Nors URL bus matomas production kode, tai yra SAUGUS (žr. "Saugumas" sekciją aukščiau).

---

*Sukurta: 2025-11-29*

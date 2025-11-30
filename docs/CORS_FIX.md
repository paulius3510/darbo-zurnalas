# CORS Fix for Google Apps Script

## ❌ Problema

Kai testuoji lokaliai (localhost:5173), matai CORS error:
```
Access to fetch at 'https://script.google.com/...' from origin 'http://localhost:5173'
has been blocked by CORS policy
```

## ✅ Sprendimas

Google Apps Script Web Apps turi apribojimus su CORS headers. Yra **2 būdai**:

---

## Būdas 1: Testuoti Production URL (REKOMENDUOJAMA)

Kadangi Apps Script negali pridėti CORS headers ContentService response'e, **geriausia testuoti tiesiogiai production aplinkoje**.

### Žingsniai:

1. **Deploy lokalius pakeitimus:**
   ```bash
   npm run deploy
   ```

2. **Atidaryti production URL:**
   ```
   https://paulius3510.github.io/darbo-zurnalas/
   ```

3. **CORS problema nebus**, nes GitHub Pages veikia per HTTPS ir Apps Script leidžia HTTPS requests.

---

## Būdas 2: Naudoti Google Apps Script CORS Proxy (Sudėtingiau)

Jei tikrai reikia testuoti lokaliai, galima:

### Option A: Temporary disable web security (TIK TESTAVIMUI!)

**Chrome (Mac):**
```bash
open -na "Google Chrome" --args --disable-web-security --user-data-dir="/tmp/chrome_dev"
```

**SVARBU:** Naudoti TIK testavimui! Niekada nenaršyti kitų puslapių su šiuo režimu!

### Option B: Naudoti Apps Script API (ne Web App)

Vietoj Web App, naudoti Google Sheets API v4 su API key. Tai sudėtingesnė konfigūracija.

---

## 📌 Mano Rekomendacija

**Naudok production URL testavimui:**

1. Lokaliai dirbi development (`npm run dev`)
2. Kai nori testuoti Google Sheets sync:
   - `npm run deploy` (1-2 sekundės)
   - Atidaryti https://paulius3510.github.io/darbo-zurnalas/
   - Testuoti sync
3. Grįžti į lokalų dev

**Kodėl tai geriausia:**
- ✅ Jokių CORS problemų
- ✅ Testavimas tikroje aplinkoje
- ✅ GitHub Pages deploy greitas (~2 sec)
- ✅ Service Worker veikia tik production (PWA testas)

---

## 🔍 Techninė informacija

### Kodėl Apps Script neturi CORS?

Google Apps Script Web Apps vykdomi per `script.google.com` domeną:
- GET requests leidžiami iš visur
- POST requests blokuojami localhost (CORS policy)
- ContentService negali pridėti custom headers (Apps Script apribojimas)

### Kas veikia:
- ✅ HTTPS → HTTPS (production → Apps Script)
- ❌ HTTP → HTTPS (localhost → Apps Script)

### Sprendimas:
Testuoti production aplinkoje, kur viskas HTTPS.

---

## 🚀 Quick Deploy Workflow

```bash
# 1. Dirbti lokaliai
npm run dev

# 2. Kai reikia testuoti sync
npm run deploy

# 3. Atidaryti production
# https://paulius3510.github.io/darbo-zurnalas/

# 4. Testuoti, tada grįžti į dev
npm run dev
```

---

*Sukurta: 2025-11-30*

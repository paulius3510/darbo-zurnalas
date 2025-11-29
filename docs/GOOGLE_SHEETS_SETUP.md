# Google Sheets + Apps Script Setup Guide

## 📊 1. Google Sheets Struktūra

### Lapas 1: `projects`

| Stulpelis | Pavadinimas | Aprašymas |
|-----------|-------------|-----------|
| A | id | Unikalus projekto ID |
| B | name | Projekto pavadinimas |
| C | client | Kliento vardas |
| D | address | Adresas |
| E | hourlyRate | Valandinis įkainis (ISK) |
| F | status | Statusas (active/completed) |
| G | createdAt | Sukūrimo data (ISO format) |

**Pavyzdys:**
```
id                  | name              | client           | address                    | hourlyRate | status | createdAt
abc123             | Vonios remontas   | Ólafur Hilmarsson| Vesturgata 5, Reykjavík   | 8500      | active | 2025-11-29T10:00:00Z
```

### Lapas 2: `work_entries`

| Stulpelis | Pavadinimas | Aprašymas |
|-----------|-------------|-----------|
| A | id | Unikalus įrašo ID |
| B | projectId | Projekto ID (nuoroda į projects) |
| C | date | Data (YYYY-MM-DD) |
| D | startTime | Pradžios laikas (HH:MM) |
| E | endTime | Pabaigos laikas (HH:MM) |
| F | hours | Valandų skaičius |
| G | notes | Pastabos |

**Pavyzdys:**
```
id      | projectId | date       | startTime | endTime | hours | notes
w001   | abc123    | 2025-11-28 | 12:30    | 15:00   | 2.5   | Flísalögn á sturtagólfi
```

### Lapas 3: `materials`

| Stulpelis | Pavadinimas | Aprašymas |
|-----------|-------------|-----------|
| A | id | Unikalus įrašo ID |
| B | projectId | Projekto ID (nuoroda į projects) |
| C | date | Data (YYYY-MM-DD) |
| D | name | Medžiagos pavadinimas |
| E | quantity | Kiekis |
| F | amount | Suma (ISK) |

**Pavyzdys:**
```
id     | projectId | date       | name                           | quantity | amount
m001  | abc123    | 2025-11-17 | Weber Floor 4150 Fine Flow 25kg| 11 stk   | 42658
```

---

## 📝 2. Google Sheets Sukūrimo Instrukcija

1. **Atidaryti jau sukurtą spreadsheet:**
   - URL: https://docs.google.com/spreadsheets/d/1ds-_5uX6T4qrQdsNK_xvW7i7PPFam8ckbsa2NDLvnnk/edit

2. **Pervadinti lapus:**
   - Dešiniu pelės mygtuku ant "Lapas1" → "Pervadinti" → `projects`
   - Pridėti naują lapą (+) → Pervadinti į `work_entries`
   - Pridėti naują lapą (+) → Pervadinti į `materials`

3. **Sukurti header eilutes kiekviename lape:**

   **projects lape (A1:G1):**
   ```
   id | name | client | address | hourlyRate | status | createdAt
   ```

   **work_entries lape (A1:G1):**
   ```
   id | projectId | date | startTime | endTime | hours | notes
   ```

   **materials lape (A1:F1):**
   ```
   id | projectId | date | name | quantity | amount
   ```

4. **Formatavimas (pasirinktinai):**
   - Pažymėti pirmą eilutę → Pastorintas šriftas
   - Pažymėti pirmą eilutę → Formatas → Teksto sulygiavimas → Centre
   - Pažymėti pirmą eilutę → Fono spalva → Šviesiai pilka

---

## ⚙️ 3. Apps Script Web App Deployment

### Žingsnis 1: Atidaryti Script Editor

1. Google Sheets, kur sukūrei lapus
2. Meniu: **Extensions** → **Apps Script**
3. Ištrinti default kodą (`function myFunction() {}`)

### Žingsnis 2: Įklijuoti Apps Script kodą

Nukopijuok ir įklijuok kodą iš failo `google-apps-script/Code.gs` (kurį sukursiu kitame žingsnyje)

### Žingsnis 3: Deploy kaip Web App

1. Apps Script editoriuje, viršuje dešinėje: **Deploy** → **New deployment**
2. Šalia "Select type", spausk ⚙️ (krumpliaratį) → **Web app**
3. Užpildyk:
   - **Description:** Darbo Zurnalas API v1
   - **Execute as:** Me (tavo_email@gmail.com)
   - **Who has access:** Anyone (**SVARBU!**)
4. Spausk **Deploy**
5. Patvirtink leidimus (Authorize access)
6. **Nukopijuok Web App URL!** (atrodo taip: `https://script.google.com/macros/s/ABC.../exec`)

### Žingsnis 4: Išsaugok Web App URL

Web App URL reikės įdėti į React aplikacijos konfigūraciją.

**Saugumas:**
- Nors API public, duomenys matomi tik tau (per Google Sheets autorizaciją)
- Apps Script vykdomas kaip tu, todėl turi prieigą prie tavo Sheet

---

## 🔐 Alternatyva: Google Sheets API (jei Apps Script neveiks)

Jei Apps Script Web App neveiks arba norėsi saugesnį sprendimą, galime naudoti Google Sheets API v4:

### Privalumai:
- Oficialus Google API
- Greitesnis
- Geresnis saugumas su API keys

### Setup:
1. Google Cloud Console → Sukurti projektą
2. Enable Google Sheets API
3. Sukurti API Key (restricted)
4. Naudoti `@google-cloud/sheets` biblioteką React'e

**Šiuo metu pradėkime nuo Apps Script - paprasčiau setup'inti!**

---

## 📍 Nuorodos

- Google Sheets: https://docs.google.com/spreadsheets/d/1ds-_5uX6T4qrQdsNK_xvW7i7PPFam8ckbsa2NDLvnnk/edit
- Apps Script Docs: https://developers.google.com/apps-script
- Web Apps Guide: https://developers.google.com/apps-script/guides/web

---

*Sukurta: 2025-11-29*

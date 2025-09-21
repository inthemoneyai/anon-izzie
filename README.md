# Anon-Izzie — Your Excel/CSV Privacy Shield 🛡️

A Chrome extension that scrubs sensitive HR, payroll, and equity comp data from Excel/CSV files.  
**100% local. Zero uploads. No creepy permissions.**

Built by [In the Money AI](https://inthemoney.ai) — the same nerds behind Izzie, your AI for equity and payroll.

---

## 🛡️ Privacy First

- **Zero network permissions** — extension doesn’t even ask.
- **100% client-side** — anonymization happens in your browser.
- **No uploads, ever** — your data never leaves your machine.
- **Reversible mapping** — CSV export shows exactly what got scrubbed and how.

---

## 🎯 Who It’s For

Perfect for anonymizing files before sharing, demoing, or running through AI tools. Handles:

- Employee names and IDs
- SSNs and tax IDs
- Emails and phone numbers
- Home addresses, DOBs
- Salary and comp data
- Equity grant and award info
- Bank, visa, demographics, transactions

---

## 🚀 How to Use

1. **Install the extension**
   - From the [Chrome Web Store](https://chromewebstore.google.com/detail/anon-izzie-%E2%80%94-excelcsv-pri/dijaecjpfipkbnohflbhnfohebnjgbpc)
   - Or load manually:
     - Go to `chrome://extensions/`
     - Enable **Developer Mode**
     - Click **Load unpacked** and select this folder
        
2. **Anonymize your data**
    
    - Click the Anon-Izzie extension icon
    - Drop in your Excel/CSV file
    - Choose anonymization options (Strict 🔒 vs Contextual 📊)
    - Hit **Anonymize Data** 🚀
    - Get two downloads:
        - `YourFile_anonymized.xlsx`
        - `YourFile_anonymization_map.csv`

---

## 🔧 Features

### Smart PII Detection

- Header-based detection for HR/payroll/equity columns
- Regex safety net (catches rogue SSNs/emails in “Notes” fields)
- Detailed mapping includes detection method (header vs regex)

### Flexible Modes

- **Strict Mode 🔒**: wipes everything sensitive (safe for demos).
- **Contextual Mode 📊**: keeps analysis-friendly values (e.g. date-shifted DOBs, salary ranges, state codes).

### Audit-Friendly Mapping

- CSV map logs original → anonymized values
- Includes sheet, row, column, detection method
- End-of-run summary in the UI:  
    `📊 112 header, 🔎 3 regex → Total 115 fields scrubbed`

### Smooth UI

- Drag & drop Excel/CSV
- Real-time log updates
- Fast anonymization — usually done in seconds
- Reset button for quick fresh starts

---

## 🔒 Security & Privacy

- **No telemetry** — we don’t phone home.
- **No host permissions** — nothing scary in the manifest.
- **Open source** — full transparency.

---

## 🛠️ Development

### Prerequisites

- Chrome browser
- Zero patience for creepy SaaS “black box” anonymizers

### Install for Dev

1. Clone/download this repo
2. Go to `chrome://extensions/`
3. Enable Developer Mode
4. Load unpacked → select project folder

---

## ⚠️ Notes

- This tool is provided “as is.”  
- Not legal, tax, or compliance advice — validate anonymized outputs before sharing.  
- No anonymizer is perfect: check your file before you send it, and keep the mapping CSV private and secure if you plan to reverse.  
- The original file is never modified, only a copy is generated.  

---

🐿️ Fun fact: Anon-Izzie anonymizes spreadsheets, not your browser history.  
🤖 She doesn’t talk to the cloud. She barely talks to her coworkers.

---

## 👩‍💻 About
Built by [In the Money AI](https://inthemoney.ai)  
Want AI to actually answer your equity/payroll questions?  
Check out [Izzie →](https://inthemoney.ai)

---

## 📄 License
MIT License © 2025 Good Work People LLC

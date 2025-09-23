# Anon-Izzie — Your Excel/CSV Anonymizer & Privacy Shield 🛡️

A Chrome extension that anonymizes and redacts personally identifiable information (PII) from Excel/CSV files.  
Think HR, payroll, or equity comp spreadsheets — cleaned in seconds.  
**100% local. Zero uploads. No creepy permissions. No PII, no cry.**

Built by [In the Money AI](https://inthemoney.ai) — the same nerds behind Izzie, your AI for equity and payroll.

---

## 🛡️ Privacy First

- **Zero network permissions** — extension doesn’t even ask.  
- **100% client-side** — anonymization happens in your browser.  
- **No uploads, ever** — your data never leaves your machine.  
- **Reversible mapping (optional)** — CSV export shows exactly what got scrubbed and how.  
- **Audit-ready summary (optional)** — JSON export documents detection details and version info.

---

## 🎯 Who It’s For

Perfect for anonymizing files before sharing, demoing, audits, or running through AI tools. Handles:

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
   - Choose an anonymization mode:  
     - Contextual 📊 (fake but consistent values)  
     - Range 📈 (salary-style compensation buckets)  
     - Strict 🔒 (wipe everything)  
   - Pick your download options:  
     - ✅ Anonymized Excel file (always included)  
     - ⬜ Mapping CSV (original → anonymized values)  
     - ⬜ Summary JSON (audit trail + detection details)  
   - Hit **Anonymize** 🚀  
   - Files download instantly. No cloud. No leaks.  

---

## 🔧 Features

- **Smart PII / personal info detection** — HR, payroll, and equity fields auto-detected, with regex backup for rogue values.  
- **Flexible modes** — Contextual, Range, and Strict.  
- **Pick your downloads** — anonymized file always included; mapping CSV and JSON summary are optional.  
- **Audit-friendly outputs** — summary JSON proves what was scrubbed and which version of Anon-Izzie did it.  
- **Consistent anonymization** — same value → same token, so pivot tables and relationships still work.  
- **Fast + friendly UI** — drag & drop, progress tracker, field-by-field selection, real-time logs.  

---

## 🔒 Security & Privacy

- **No telemetry** — we don’t phone home.  
- **No host permissions** — nothing scary in the manifest.  
- **Open source** — full transparency (MIT licensed).  

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

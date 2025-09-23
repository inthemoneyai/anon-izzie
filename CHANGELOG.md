# Changelog

All notable changes to Anon-Izzie will be documented here.  
This project uses [Semantic Versioning](https://semver.org/) (MAJOR.MINOR.PATCH).

---

## [Unreleased]
- ✨ Planned: De-anonymizer add-on
- ✨ Planned: Named-table-only mode
- ✨ Planned: Header mapping UI
- ✨ Planned: Context-menu action ("Anonymize before upload")

---

## [1.1.1] – 2025-09-23
### Fixed
- Shortened `manifest.json` description to meet Chrome Web Store 132-character limit

---

## [1.1.0] – 2025-09-23
🎯 Quality of Life & Stronger PII Redaction  

Anon-Izzie is now even sharper at anonymizing and redacting personal info (PII) in Excel/CSV files — so your sensitive data stays private, audit-ready, and “No PII, no cry.”

### Added
- **Better Date Recognition**: Detects and preserves format for 9+ date patterns (YYYY-MM-DD, MM/DD/YYYY, DD.MM.YYYY, DD-MMM-YYYY, etc.)
- **Keyboard Shortcuts**: `Ctrl+A` (or `Cmd+A` on Mac) to toggle all field selections; `Escape` closes the extension
- **Progress Tracking**: Completion % for large files (updates every 5% or 100 rows)
- **Enhanced PII Detection**: Now catches IP addresses and international phone numbers via regex
- **Formula Awareness**: Warns users when Excel formulas will be converted to values
- **Download Options**: New checkboxes let you choose what to save:
  - ✅ Anonymized Excel file (always included)  
  - ⬜ Mapping CSV (original → anonymized values)  
  - ⬜ Summary JSON (field detection details + version info)  
- **Enhanced Summary Report**: JSON includes column-level PII detection details and version info for audit trails
- **Relationship Preservation**: Same values always get same tokens within columns (was already there, now documented!)

### Fixed
- Tax-related “amount” fields now correctly categorized as taxValue instead of compensation
- Fair market value variants properly detected as FMV instead of compensation
- “ss#” pattern correctly detected as SSN field
- Token counters reset between sessions for consistent results

### Technical
- Switched from re-checking patterns to using detected types during anonymization
- Added support for detecting multiple-sheet workbooks (processing still limited to first sheet)
- Better error messages for password-protected and old Excel formats

---

## [1.0.2] – 2025-09-09
🏪 Chrome Web Store prep mode  

- Icons, screenshots, promo tile — all rebuilt to match Chrome’s picky rules  
- Tidied up stray assets and references  
- Anon-Izzie is now dressed up and ready to submit to the Chrome Web Store ✨

---

## [1.0.1] – 2025-09-06
🚀 Big glow-up for Anon-Izzie!  

- Added **Range Mode** (salary-style anonymization with value bands) alongside Strict + Contextual  
- Fresh **Chrome Web Store screenshots** (clean, consistent, and fun)  
- Brand-new **header design** with tagline — Izzie finally gets her marketing moment 🎤  
- Compact, balanced **action buttons** (no more “giant purple bars of doom”)  
- UI polish: tightened spacing, smaller logs by default, cleaner file card styling  
- Hero thumbnail ready for the Web Store (logo on a bold gradient)  

💡 TL;DR: She’s prettier, more flexible, and one step closer to Chrome Web Store fame.
 
---

## [1.0.0] – 2025-09-05
🎉 First public release!  

- Local anonymization for Excel/CSV files  
- Smart detection for HR, payroll, equity comp PII  
- Strict vs Contextual modes  
- Friendly anonymization map CSV export  
- Clean UI, real-time logs  
- MIT licensed, open source  

---

## [0.9.0] – 2025-08-30
Internal preview build, not published.  

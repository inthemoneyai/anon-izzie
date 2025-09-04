# DataGuard - Excel Anonymizer

A Chrome extension that anonymizes Excel and CSV files containing sensitive HR/Finance data, keeping all processing 100% local on your machine.

**Brought to you by [In the Money AI](https://inthemoney.ai)** - Your trusted partner for AI-powered financial tools and data protection solutions.

## 🛡️ Privacy First

- **No network permissions** - Extension requires zero host permissions
- **100% client-side processing** - Your data never leaves your computer
- **No uploads** - All anonymization happens in your browser
- **Reversible mapping** - Download anonymization map to reverse changes if needed

## 🎯 Perfect for HR/Finance Teams

Designed specifically for equity, payroll, and HR data containing:
- Employee names and IDs
- Social Security Numbers
- Email addresses
- Phone numbers
- Addresses and personal information
- Salary and compensation data
- Grant and award information

## 🚀 How to Use

1. **Install the Extension**
   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked" and select this folder

2. **Anonymize Your Data**
   - Click the DataGuard extension icon
   - Drag & drop your Excel (.xlsx) or CSV file
   - Configure anonymization options
   - Click "Anonymize Data"
   - Download the anonymized file and mapping CSV

## 📁 Project Structure

```
excel-anonymizer/
├── manifest.json          # Extension configuration
├── popup.html            # Extension popup interface
├── popup.js              # Core anonymization logic
├── styles.css            # Modern UI styling
├── libs/
│   └── xlsx.full.min.js  # SheetJS library for Excel processing
├── icons/                # Extension icons (placeholder)
└── README.md            # This file
```

## 🔧 Features

### Smart PII Detection
Automatically detects common HR/Finance fields:
- Employee names, IDs, and numbers
- Email addresses and phone numbers
- Social Security Numbers
- Addresses and location data
- Salary and compensation
- Grant and award information

### Flexible Anonymization
- **Tokenization**: Replace names/IDs with consistent tokens (EMP0001, EID0001, etc.)
- **Masking**: Partially mask SSNs (***-**-1234) and phone numbers
- **Range masking**: Convert salaries to ranges ($50,000 - $75,000)
- **Preservation**: Keep 2-letter state codes when desired

### Reversible Mapping
- Download complete anonymization map as CSV
- Track original → anonymized value mappings
- Includes sheet name, row, column, and both values

## 🎨 Modern UI

- Clean, professional interface
- Drag & drop file support
- Real-time processing feedback
- Configurable anonymization options
- Privacy-focused design

## 🔒 Security & Privacy

- **Zero network access** - Extension has no host permissions
- **Local processing only** - All data stays on your machine
- **No telemetry** - No usage tracking or data collection
- **Open source** - Full transparency in code

## 🛠️ Development

### Prerequisites
- Chrome browser
- Basic understanding of Chrome extensions

### Installation for Development
1. Clone or download this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode"
4. Click "Load unpacked" and select the project folder

### File Structure
- `manifest.json`: Extension configuration (MV3)
- `popup.html`: User interface
- `popup.js`: Core anonymization logic
- `styles.css`: Modern CSS styling
- `libs/xlsx.full.min.js`: SheetJS library for Excel processing

## 📝 License

This project is open source. Feel free to modify and distribute according to your needs.

## 🤝 Contributing

Contributions are welcome! Areas for improvement:
- Additional PII detection patterns
- More anonymization options
- Better icon design
- Enhanced UI/UX
- Additional file format support

## ⚠️ Important Notes

- This tool is designed for legitimate data anonymization needs
- Always ensure you have proper authorization to anonymize data
- Keep the anonymization map secure if you need to reverse changes
- Test with sample data before using with production files

---

**DataGuard** - Protecting sensitive data, one spreadsheet at a time. 🛡️

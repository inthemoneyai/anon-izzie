// Anon-Izzie — Your Excel/CSV Privacy Shield
// 100% client-side PII protection for HR/Finance data

// PII detection patterns for equity/HR data
const PII_PATTERNS = {
  name: ["employee name", "full name", "name", "first name", "last name", "employee", "worker"],
  empId: ["employee id", "person number", "emp id", "worker id", "person id", "employee number", "staff id"],
  grantId: ["grant id", "grant #", "grant number", "award id", "award number", "award #", "option id", "option number"],
  email: ["email", "e-mail", "email address", "work email", "corporate email"],
  ssn: ["ssn", "social security", "social security number", "ss#", "ss #"],
  address: ["address", "address line 1", "address1", "address line1", "street address", "home address"],
  city: ["city", "municipality"],
  state: ["state", "st", "province", "region"],
  zip: ["zip", "zip code", "postal", "postal code", "zipcode"],
  phone: ["phone", "phone number", "telephone", "cell", "mobile", "work phone", "home phone"],
  dob: ["dob", "date of birth", "birthdate", "birth date"],
  salary: ["salary", "compensation", "pay", "wage", "annual salary", "base salary"],
  department: ["department", "dept", "division", "team", "unit"],
  manager: ["manager", "supervisor", "reporting manager", "direct manager"],
  bank: ["bank account", "account number", "routing", "iban", "swift"],
  tax: ["itin", "ein", "tax id", "withholding", "allowances"],
  visa: ["visa", "work permit", "passport"],
  demographics: ["gender", "ethnicity", "marital status"],
  transaction: ["transaction id", "espp id", "purchase id", "vest id"]
};

// Token counters for consistent anonymization
const TOKEN_COUNTERS = {
  EMP: 0,    // Employee names
  EID: 0,    // Employee IDs
  GRT: 0,    // Grant/Award IDs
  EML: 0,    // Email addresses
  ADR: 0,    // Addresses
  CTY: 0,    // Cities
  ST: 0,     // States
  SAL: 0,    // Salaries
  DEP: 0,    // Departments
  MGR: 0,    // Managers
  BANK: 0,   // Bank accounts
  TAX: 0,    // Tax IDs
  VISA: 0,   // Visas
  DEMO: 0,   // Demographics
  TRANS: 0   // Transactions
};

// Add regex matchers for rogue PII
const REGEX_PATTERNS = {
  email: /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i,
  phone: /\b(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/,
  ssn: /\b\d{3}-\d{2}-\d{4}\b/,
  creditCard: /\b\d{4}[-\s]?(\d{4}[-\s]?){2}\d{4}\b/,
  bank: /\b\d{8,17}\b/ // crude: 8–17 digits
};

// Global state
let currentFile = null;
let fileName = null;

// DOM elements
const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => document.querySelectorAll(selector);

// Utility functions
function normalizeHeader(header) {
  return (header || "").toString().trim().toLowerCase()
    .replace(/[_\-\/]+/g, " ")
    .replace(/\s+/g, " ");
}

function isPIIField(header, piiType) {
  const normalized = normalizeHeader(header);
  return PII_PATTERNS[piiType].some(pattern => 
    normalized.includes(pattern) || pattern.includes(normalized)
  );
}

function extractDigits(str) {
  return (str || "").toString().replace(/\D+/g, "");
}

function generateToken(prefix) {
  TOKEN_COUNTERS[prefix] = (TOKEN_COUNTERS[prefix] || 0) + 1;
  return `${prefix}${String(TOKEN_COUNTERS[prefix]).padStart(4, "0")}`;
}

// Date shifting utility
function shiftDate(value, days = 90) {
  const d = new Date(value);
  if (isNaN(d)) return "1900-01-01";
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}

function maskSSN(value) {
  const digits = extractDigits(value);
  const last4 = digits.slice(-4) || "0000";
  return `***-**-${last4}`;
}

function maskPhone(value) {
  const digits = extractDigits(value);
  return digits.length >= 4 ? `***-***-${digits.slice(-4)}` : "***-***-****";
}

function maskSalary(value) {
  // Convert to number and mask with range
  const num = parseFloat(value.toString().replace(/[,$]/g, ""));
  if (isNaN(num)) return "***,***";
  
  const ranges = [
    { min: 0, max: 50000, label: "$30,000 - $50,000" },
    { min: 50000, max: 75000, label: "$50,000 - $75,000" },
    { min: 75000, max: 100000, label: "$75,000 - $100,000" },
    { min: 100000, max: 150000, label: "$100,000 - $150,000" },
    { min: 150000, max: 200000, label: "$150,000 - $200,000" },
    { min: 200000, max: Infinity, label: "$200,000+" }
  ];
  
  const range = ranges.find(r => num >= r.min && num < r.max);
  return range ? range.label : "$***,***";
}

function csvEscape(value) {
  const str = (value == null) ? "" : String(value);
  return /[",\n\r]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
}

function log(message, type = "info") {
  const logElement = $("#log");
  const div = document.createElement("div");
  div.className = type;
  div.innerHTML = message;
  logElement.appendChild(div);
  logElement.scrollTop = logElement.scrollHeight;
}

function downloadFile(filename, blob) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function readFileAsArrayBuffer(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}

// File handling
function handleFileSelect(file) {
  if (!file) return;
  
  const validTypes = [
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
    'text/csv', // .csv
    'application/csv' // .csv alternative
  ];
  
  const validExtensions = ['.xlsx', '.csv'];
  const hasValidExtension = validExtensions.some(ext => 
    file.name.toLowerCase().endsWith(ext)
  );
  
  if (!validTypes.includes(file.type) && !hasValidExtension) {
    log("❌ Please select a valid Excel (.xlsx) or CSV file", "error");
    return;
  }
  
  currentFile = file;
  fileName = file.name;
  
  $("#anonymize-btn").disabled = false;
  $("#log").innerHTML = "";
  
  // Show the options section
  $("#optionsSection").style.display = "block";
  
  log(`📁 Selected: <strong>${fileName}</strong>`, "success");
  log(`📊 File size: ${(file.size / 1024).toFixed(1)} KB`, "info");
}

// Drag and drop handlers
function setupDragAndDrop() {
  const dropzone = $("#dropzone");
  
  ["dragenter", "dragover"].forEach(eventName => {
    dropzone.addEventListener(eventName, (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropzone.classList.add("hover");
    });
  });
  
  ["dragleave", "drop"].forEach(eventName => {
    dropzone.addEventListener(eventName, (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropzone.classList.remove("hover");
    });
  });
  
  dropzone.addEventListener("drop", (e) => {
    const file = e.dataTransfer.files[0];
    handleFileSelect(file);
  });
  
  dropzone.addEventListener("click", () => {
    $("#file-input").click();
  });
}

// Main anonymization function
async function anonymizeData() {
  if (!currentFile) return;
  
  const anonymizeBtn = $("#anonymize-btn");
  anonymizeBtn.disabled = true;
  
  try {
    log("🔄 Reading file...", "info");
    
    const arrayBuffer = await readFileAsArrayBuffer(currentFile);
    const workbook = XLSX.read(arrayBuffer, { type: "array" });
    
    if (!workbook.SheetNames.length) {
      throw new Error("No sheets found in the file");
    }
    
    // Process first sheet for MVP
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet, { 
      header: 1, 
      defval: "",
      raw: false 
    });
    
    if (!data.length) {
      throw new Error("No data found in the spreadsheet");
    }
    
    const headerRow = data[0];
    const mapRows = [["SheetName", "Row", "ColumnHeader", "ColumnIndex", "OriginalValue", "AnonymizedValue", "DetectionMethod"]];
    
    // Get anonymization options
    const options = {
      maskSSN: $("#maskSSN").checked,
      maskPhone: $("#maskPhone").checked,
      keepState2Letter: $("#keepState2Letter").checked,
      mode: document.querySelector("input[name='mode']:checked").id
    };
    
    // Column-level dictionaries for consistent tokenization
    const columnDictionaries = headerRow.map(() => new Map());
    
    log(`📋 Processing ${data.length - 1} rows with ${headerRow.length} columns...`, "info");
    log("🔒 Anonymizing sensitive data...", "info");

    let headerDetections = 0;
    let regexDetections = 0;

    // Process each row
    for (let rowIndex = 1; rowIndex < data.length; rowIndex++) {
      const row = data[rowIndex];
      
      for (let colIndex = 0; colIndex < headerRow.length; colIndex++) {
        const originalValue = row[colIndex];
        if (originalValue === "" || originalValue == null) continue;
        
        const header = headerRow[colIndex];
        const dict = columnDictionaries[colIndex];
        
        const addToMap = (original, anonymized, method = "header") => {
          if (method === "regex") {
            regexDetections++;
          } else {
            headerDetections++;
          }
          mapRows.push([
            sheetName,
            rowIndex + 1,
            header,
            colIndex + 1,
            String(original),
            String(anonymized),
            method
          ]);
        };
        
        const getOrCreateToken = (prefix, value) => {
          const key = String(value).toLowerCase();
          if (dict.has(key)) return dict.get(key);
          const token = generateToken(prefix);
          dict.set(key, token);
          return token;
        };
        
        // Apply anonymization based on header patterns
        if (isPIIField(header, "name")) {
          const token = getOrCreateToken("EMP", originalValue);
          row[colIndex] = token;
          addToMap(originalValue, token);
        }
        else if (isPIIField(header, "empId")) {
          const token = getOrCreateToken("EID", originalValue);
          row[colIndex] = token;
          addToMap(originalValue, token);
        }
        else if (isPIIField(header, "grantId")) {
          const token = getOrCreateToken("GRT", originalValue);
          row[colIndex] = token;
          addToMap(originalValue, token);
        }
        else if (isPIIField(header, "email")) {
          const key = String(originalValue).toLowerCase();
          if (dict.has(key)) {
            row[colIndex] = dict.get(key);
          } else {
            const token = `user${String(++TOKEN_COUNTERS.EML).padStart(4, "0")}@example.invalid`;
            dict.set(key, token);
            row[colIndex] = token;
          }
          addToMap(originalValue, row[colIndex]);
        }
        else if (isPIIField(header, "ssn")) {
          const masked = options.maskSSN ? maskSSN(originalValue) : getOrCreateToken("EID", originalValue);
          row[colIndex] = masked;
          addToMap(originalValue, masked);
        }
        else if (isPIIField(header, "address")) {
          if (options.mode === "strictMode") {
            const token = getOrCreateToken("ADR", originalValue);
            row[colIndex] = token;
            addToMap(originalValue, token);
          } else {
            row[colIndex] = "Address"; // generic label
            addToMap(originalValue, "Address");
          }
        }
        else if (isPIIField(header, "city")) {
          const token = getOrCreateToken("CTY", originalValue);
          row[colIndex] = token;
          addToMap(originalValue, token);
        }
        else if (isPIIField(header, "state")) {
          const value = String(originalValue).trim().toUpperCase();
          if (options.keepState2Letter && /^[A-Z]{2}$/.test(value)) {
            addToMap(originalValue, value); // preserve
          } else {
            if (options.mode === "strictMode") {
              const token = getOrCreateToken("ST", originalValue);
              row[colIndex] = token;
              addToMap(originalValue, token);
            } else {
              // Contextual: keep visible but anonymize long-form
              row[colIndex] = value.length > 2 ? "State" : value;
              addToMap(originalValue, row[colIndex]);
            }
          }
        }
        else if (isPIIField(header, "zip")) {
          row[colIndex] = "00000";
          addToMap(originalValue, "00000");
        }
        else if (isPIIField(header, "phone")) {
          const masked = options.maskPhone ? maskPhone(originalValue) : getOrCreateToken("EMP", originalValue);
          row[colIndex] = masked;
          addToMap(originalValue, masked);
        }
        else if (isPIIField(header, "dob")) {
          if (options.mode === "strictMode") {
            row[colIndex] = "1900-01-01"; // wipe
            addToMap(originalValue, "1900-01-01");
          } else {
            const shifted = shiftDate(originalValue, 90); // keep relative age
            row[colIndex] = shifted;
            addToMap(originalValue, shifted);
          }
        }
        else if (isPIIField(header, "salary")) {
          if (options.mode === "strictMode") {
            row[colIndex] = "***,***"; // nuke exact comp
            addToMap(originalValue, "***,***");
          } else {
            const masked = maskSalary(originalValue); // bucket/range
            row[colIndex] = masked;
            addToMap(originalValue, masked);
          }
        }
        else if (isPIIField(header, "department")) {
          const token = getOrCreateToken("DEP", originalValue);
          row[colIndex] = token;
          addToMap(originalValue, token);
        }
        else if (isPIIField(header, "manager")) {
          const token = getOrCreateToken("MGR", originalValue);
          row[colIndex] = token;
          addToMap(originalValue, token);
        }
        else if (isPIIField(header, "bank")) {
          const token = getOrCreateToken("BANK", originalValue);
          row[colIndex] = token;
          addToMap(originalValue, token);
        }
        else if (isPIIField(header, "tax")) {
          const token = getOrCreateToken("TAX", originalValue);
          row[colIndex] = token;
          addToMap(originalValue, token);
        }
        else if (isPIIField(header, "visa")) {
          const token = getOrCreateToken("VISA", originalValue);
          row[colIndex] = token;
          addToMap(originalValue, token);
        }
        else if (isPIIField(header, "demographics")) {
          const token = getOrCreateToken("DEMO", originalValue);
          row[colIndex] = token;
          addToMap(originalValue, token);
        }
        else if (isPIIField(header, "transaction")) {
          const token = getOrCreateToken("TRANS", originalValue);
          row[colIndex] = token;
          addToMap(originalValue, token);
        }
        else if (typeof originalValue === "string") {
          if (REGEX_PATTERNS.email.test(originalValue)) {
            const masked = `user${String(++TOKEN_COUNTERS.EML).padStart(4, "0")}@example.invalid`;
            row[colIndex] = masked;
            addToMap(originalValue, masked, "regex");
          } else if (REGEX_PATTERNS.phone.test(originalValue)) {
            const masked = maskPhone(originalValue);
            row[colIndex] = masked;
            addToMap(originalValue, masked, "regex");
          } else if (REGEX_PATTERNS.ssn.test(originalValue)) {
            const masked = maskSSN(originalValue);
            row[colIndex] = masked;
            addToMap(originalValue, masked, "regex");
          } else if (REGEX_PATTERNS.creditCard.test(originalValue)) {
            row[colIndex] = "****-****-****-1234";
            addToMap(originalValue, row[colIndex], "regex");
          } else if (REGEX_PATTERNS.bank.test(originalValue)) {
            const normalizedHeader = normalizeHeader(header);
            if (
              normalizedHeader.includes("bank") ||
              normalizedHeader.includes("account") ||
              normalizedHeader.includes("routing") ||
              normalizedHeader.includes("iban")
            ) {
              const token = getOrCreateToken("BANK", originalValue);
              row[colIndex] = token;
              addToMap(originalValue, token, "regex");
            }
          }          
        }
      }
      
      data[rowIndex] = row;
      
      if (rowIndex % 100 === 0) {
        const percent = Math.round((rowIndex / data.length) * 100);
        $("#progressSection").style.display = "block";
        $("#progressFill").style.width = percent + "%";
        $("#progressText").textContent = `Processing... ${percent}%`;
      }      
    }

    log(`📊 ${headerDetections} header`, "info");
    log(`🔎 ${regexDetections} regex`, "info");
    log(`📈 Total ${headerDetections + regexDetections} fields scrubbed`, "info");    
    log("📝 Generating anonymized file...", "info");
    
    // Update results summary in UI
    const summaryText = `📊 ${headerDetections} header, 🔎 ${regexDetections} regex → Total ${headerDetections + regexDetections} fields scrubbed`;
    $("#resultSummary").textContent = summaryText;

    // Show results section
    $("#resultsSection").style.display = "block";

    // Create anonymized workbook
    const anonymizedWorksheet = XLSX.utils.aoa_to_sheet(data);
    const anonymizedWorkbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(anonymizedWorkbook, anonymizedWorksheet, sheetName);
    const anonymizedXlsx = XLSX.write(anonymizedWorkbook, { 
      type: "array", 
      bookType: "xlsx" 
    });
    
    // Create mapping CSV
    const mappingCsv = mapRows.map(row => 
      row.map(csvEscape).join(",")
    ).join("\n");
    
    // Generate filenames
    const baseName = fileName.replace(/(\.xlsx|\.csv)?$/i, "");
    const anonymizedFileName = `${baseName}_anonymized.xlsx`;
    const mappingFileName = `${baseName}_anonymization_map.csv`;
    
    // Download files
    downloadFile(anonymizedFileName, new Blob([anonymizedXlsx], { 
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" 
    }));
    
    downloadFile(mappingFileName, new Blob([mappingCsv], { 
      type: "text/csv;charset=utf-8" 
    }));
    
    log("🎉 File anonymized successfully — results ready below!", "success");
    log(`📥 Downloaded: <strong>${anonymizedFileName}</strong>`, "success");
    log(`📥 Downloaded: <strong>${mappingFileName}</strong>`, "success");
    log(`📊 Processed ${mapRows.length - 1} anonymized values`, "info");
    
  } catch (error) {
    log(`❌ Error: ${error.message}`, "error");
    console.error("Anonymization error:", error);
  } finally {
    anonymizeBtn.disabled = false;
  }
}

// Initialize the extension
function init() {
  // File input handler
  $("#file-input").addEventListener("change", (e) => {
    handleFileSelect(e.target.files[0]);
  });
  
  // Anonymize button handler
  $("#anonymize-btn").addEventListener("click", anonymizeData);
  
  // Setup drag and drop
  setupDragAndDrop();
  
  // Initial log message
  log("🛡️ Anon-Izzie ready - Drop your Excel/CSV file to begin", "info");

  // Reset button handler
  $("#resetBtn").addEventListener("click", () => {
    currentFile = null;
    fileName = null;
    $("#file-input").value = "";
    $("#optionsSection").style.display = "none";
    $("#resultsSection").style.display = "none";
    $("#log").innerHTML = "";
    log("🛡️ Ready for a new file — drop Excel/CSV to begin", "info");
  });
}

// Start the extension when DOM is loaded
document.addEventListener("DOMContentLoaded", init);

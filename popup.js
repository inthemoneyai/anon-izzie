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
  // Additional security: Remove any potential script injection
  const sanitized = str.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  return /[",\n\r]/.test(sanitized) ? `"${sanitized.replace(/"/g, '""')}"` : sanitized;
}

function log(message, type = "info") {
  try {
    const logElement = $("#log");
    if (!logElement) {
      console.log(`[${type.toUpperCase()}] ${message}`);
      return;
    }
    
    const div = document.createElement("div");
    div.className = type;
    // Sanitize message to prevent XSS
    div.textContent = message;
    logElement.appendChild(div);
    logElement.scrollTop = logElement.scrollHeight;
    
    // Limit log entries to prevent memory issues
    const entries = logElement.children;
    if (entries.length > 100) {
      logElement.removeChild(entries[0]);
    }
  } catch (error) {
    console.error("Log function error:", error);
    console.log(`[${type.toUpperCase()}] ${message}`);
  }
}

function downloadFile(filename, blob) {
  try {
    if (!filename || !blob) {
      throw new Error("Missing filename or blob data");
    }
    
    if (!(blob instanceof Blob)) {
      throw new Error("Invalid blob data");
    }
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.style.display = "none";
    
    document.body.appendChild(a);
    a.click();
    
    // Clean up immediately after download
    setTimeout(() => {
      try {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } catch (cleanupError) {
        console.warn("Cleanup error:", cleanupError);
      }
    }, 100);
    
  } catch (error) {
    throw new Error(`Download failed: ${error.message}`);
  }
}

function readFileAsArrayBuffer(file) {
  return new Promise((resolve, reject) => {
    if (!file) {
      reject(new Error("No file provided"));
      return;
    }
    
    const reader = new FileReader();
    
    // Set timeout for large files (30 seconds)
    const timeout = setTimeout(() => {
      reader.abort();
      reject(new Error("File reading timeout - file may be too large or corrupted"));
    }, 30000);
    
    reader.onload = () => {
      clearTimeout(timeout);
      resolve(reader.result);
    };
    
    reader.onerror = (error) => {
      clearTimeout(timeout);
      reject(new Error(`Failed to read file: ${error.message || 'Unknown error'}`));
    };
    
    reader.onabort = () => {
      clearTimeout(timeout);
      reject(new Error("File reading was aborted"));
    };
    
    try {
      reader.readAsArrayBuffer(file);
    } catch (error) {
      clearTimeout(timeout);
      reject(new Error(`Failed to start reading file: ${error.message}`));
    }
  });
}

// File handling with comprehensive error checking
function handleFileSelect(file) {
  if (!file) {
    log("❌ No file selected", "error");
    return;
  }
  
  // Check file size (limit to 50MB for performance)
  const maxSize = 50 * 1024 * 1024; // 50MB
  if (file.size > maxSize) {
    log(`❌ File too large: ${(file.size / 1024 / 1024).toFixed(1)}MB. Maximum size is 50MB.`, "error");
    return;
  }
  
  // Additional security: Check for suspicious file names
  const suspiciousPatterns = /[<>:"|?*\x00-\x1f]/;
  if (suspiciousPatterns.test(file.name)) {
    log("❌ Invalid file name - contains suspicious characters", "error");
    return;
  }
  
  if (file.size === 0) {
    log("❌ File is empty", "error");
    return;
  }
  
  // Check file name
  if (!file.name || file.name.trim() === "") {
    log("❌ Invalid file name", "error");
    return;
  }
  
  const validTypes = [
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
    'application/vnd.ms-excel', // .xls
    'text/csv', // .csv
    'application/csv', // .csv alternative
    'text/plain' // sometimes CSV files have this MIME type
  ];
  
  const validExtensions = ['.xlsx', '.xls', '.csv'];
  const hasValidExtension = validExtensions.some(ext => 
    file.name.toLowerCase().endsWith(ext)
  );
  
  if (!validTypes.includes(file.type) && !hasValidExtension) {
    log("❌ Please select a valid Excel (.xlsx, .xls) or CSV file", "error");
    log("💡 Supported formats: .xlsx, .xls, .csv", "info");
    return;
  }
  
  currentFile = file;
  fileName = file.name;
  
  $("#anonymize-btn").disabled = false;
  $("#log").textContent = "";
  
  // Show the options section
  $("#optionsSection").style.display = "block";
  
  log(`📁 Selected: <strong>${fileName}</strong>`, "success");
  log(`📊 File size: ${(file.size / 1024).toFixed(1)} KB`, "info");
  
  // Check for potential issues
  if (file.size < 100) {
    log("⚠️ File is very small - may be empty or corrupted", "info");
  }
  
  if (file.name.includes(' ')) {
    log("💡 File name contains spaces - this is fine", "info");
  }
}

// Drag and drop handlers with error handling
function setupDragAndDrop() {
  const dropzone = $("#dropzone");
  
  if (!dropzone) {
    console.error("Dropzone element not found");
    return;
  }
  
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
    try {
      if (!e.dataTransfer || !e.dataTransfer.files) {
        log("❌ No files detected in drop", "error");
        return;
      }
      
      if (e.dataTransfer.files.length === 0) {
        log("❌ No files dropped", "error");
        return;
      }
      
      if (e.dataTransfer.files.length > 1) {
        log("❌ Please drop only one file at a time", "error");
        return;
      }
      
      const file = e.dataTransfer.files[0];
      handleFileSelect(file);
    } catch (error) {
      log(`❌ Error handling dropped file: ${error.message}`, "error");
      console.error("Drop error:", error);
    }
  });
  
  dropzone.addEventListener("click", () => {
    try {
      $("#file-input").click();
    } catch (error) {
      log(`❌ Error opening file dialog: ${error.message}`, "error");
      console.error("File dialog error:", error);
    }
  });
}

// Main anonymization function with comprehensive error handling
async function anonymizeData() {
  if (!currentFile) {
    log("❌ No file selected", "error");
    return;
  }
  
  const anonymizeBtn = $("#anonymize-btn");
  if (!anonymizeBtn) {
    log("❌ Anonymize button not found", "error");
    return;
  }
  
  anonymizeBtn.disabled = true;
  
  try {
    log("🔄 Reading file...", "info");
    
    // Check if XLSX library is loaded
    if (typeof XLSX === 'undefined') {
      throw new Error("Excel processing library not loaded. Please refresh the extension.");
    }
    
    const arrayBuffer = await readFileAsArrayBuffer(currentFile);
    
    if (!arrayBuffer || arrayBuffer.byteLength === 0) {
      throw new Error("File appears to be empty or corrupted");
    }
    
    log("📖 Parsing Excel/CSV data...", "info");
    
    let workbook;
    try {
      workbook = XLSX.read(arrayBuffer, { 
        type: "array",
        cellDates: true,
        cellNF: false,
        cellText: false
      });
    } catch (parseError) {
      throw new Error(`Failed to parse file: ${parseError.message}. The file may be corrupted or in an unsupported format.`);
    }
    
    if (!workbook || !workbook.SheetNames) {
      throw new Error("Invalid file format - could not read workbook structure");
    }
    
    if (!workbook.SheetNames.length) {
      throw new Error("No sheets found in the file");
    }
    
    // Process first sheet for MVP
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    if (!worksheet) {
      throw new Error(`Sheet "${sheetName}" could not be accessed`);
    }
    
    log(`📋 Processing sheet: "${sheetName}"`, "info");
    
    let data;
    try {
      data = XLSX.utils.sheet_to_json(worksheet, { 
        header: 1, 
        defval: "",
        raw: false,
        dateNF: 'yyyy-mm-dd'
      });
    } catch (dataError) {
      throw new Error(`Failed to extract data from sheet: ${dataError.message}`);
    }
    
    if (!data || !Array.isArray(data)) {
      throw new Error("No data found in the spreadsheet");
    }
    
    if (data.length === 0) {
      throw new Error("Spreadsheet is empty");
    }
    
    if (data.length === 1) {
      log("⚠️ Only header row found - no data to anonymize", "info");
    }
    
    const headerRow = data[0];
    
    // Validate header row
    if (!headerRow || !Array.isArray(headerRow)) {
      throw new Error("Invalid header row - file may be corrupted");
    }
    
    if (headerRow.length === 0) {
      throw new Error("No columns found in the spreadsheet");
    }
    
    if (headerRow.length > 100) {
      log(`⚠️ Large number of columns (${headerRow.length}) - processing may take longer`, "info");
    }
    
    const mapRows = [["SheetName", "Row", "ColumnHeader", "ColumnIndex", "OriginalValue", "AnonymizedValue", "DetectionMethod"]];
    
    // Get anonymization options with error handling
    let options;
    try {
      const modeElement = document.querySelector("input[name='mode']:checked");
      if (!modeElement) {
        throw new Error("No anonymization mode selected");
      }
      
      options = {
        maskSSN: $("#maskSSN") ? $("#maskSSN").checked : true,
        maskPhone: $("#maskPhone") ? $("#maskPhone").checked : true,
        keepState2Letter: $("#keepState2Letter") ? $("#keepState2Letter").checked : true,
        mode: modeElement.id
      };
    } catch (optionError) {
      throw new Error(`Configuration error: ${optionError.message}`);
    }
    
    // Column-level dictionaries for consistent tokenization
    const columnDictionaries = headerRow.map(() => new Map());
    
    log(`📋 Processing ${data.length - 1} rows with ${headerRow.length} columns...`, "info");
    log("🔒 Anonymizing sensitive data...", "info");

    let headerDetections = 0;
    let regexDetections = 0;

    // Process each row with error handling
    for (let rowIndex = 1; rowIndex < data.length; rowIndex++) {
      try {
        const row = data[rowIndex];
        
        if (!row || !Array.isArray(row)) {
          log(`⚠️ Skipping invalid row ${rowIndex + 1}`, "info");
          continue;
        }
        
        for (let colIndex = 0; colIndex < headerRow.length; colIndex++) {
          try {
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
              try {
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
              } catch (cellError) {
                log(`⚠️ Error processing cell ${rowIndex + 1},${colIndex + 1}: ${cellError.message}`, "info");
                continue;
              }
            }
        
            data[rowIndex] = row;
            
            if (rowIndex % 100 === 0) {
              const percent = Math.round((rowIndex / data.length) * 100);
              $("#progressSection").style.display = "block";
              $("#progressFill").style.width = percent + "%";
              $("#progressText").textContent = `Processing... ${percent}%`;
            }

          } catch (rowError) {
            log(`⚠️ Error processing row ${rowIndex + 1}: ${rowError.message}`, "info");
            continue;
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

    // Create anonymized workbook with error handling
    let anonymizedXlsx;
    try {
      const anonymizedWorksheet = XLSX.utils.aoa_to_sheet(data);
      const anonymizedWorkbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(anonymizedWorkbook, anonymizedWorksheet, sheetName);
      anonymizedXlsx = XLSX.write(anonymizedWorkbook, { 
        type: "array", 
        bookType: "xlsx" 
      });
    } catch (workbookError) {
      throw new Error(`Failed to create anonymized workbook: ${workbookError.message}`);
    }
    
    // Create mapping CSV with error handling
    let mappingCsv;
    try {
      mappingCsv = mapRows.map(row => 
        row.map(csvEscape).join(",")
      ).join("\n");
    } catch (csvError) {
      throw new Error(`Failed to create mapping CSV: ${csvError.message}`);
    }
    
    // Generate filenames with error handling
    let baseName, anonymizedFileName, mappingFileName;
    try {
      baseName = fileName.replace(/(\.xlsx|\.xls|\.csv)?$/i, "");
      if (!baseName || baseName.trim() === "") {
        baseName = "anonymized_data";
      }
      anonymizedFileName = `${baseName}_anonymized.xlsx`;
      mappingFileName = `${baseName}_anonymization_map.csv`;
    } catch (filenameError) {
      anonymizedFileName = "anonymized_data.xlsx";
      mappingFileName = "anonymization_map.csv";
      log("⚠️ Using default filenames due to filename error", "info");
    }
    
    // Download files with error handling
    try {
      downloadFile(anonymizedFileName, new Blob([anonymizedXlsx], { 
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" 
      }));
      log(`📥 Downloaded: <strong>${anonymizedFileName}</strong>`, "success");
    } catch (downloadError) {
      throw new Error(`Failed to download anonymized file: ${downloadError.message}`);
    }
    
    try {
      downloadFile(mappingFileName, new Blob([mappingCsv], { 
        type: "text/csv;charset=utf-8" 
      }));
      log(`📥 Downloaded: <strong>${mappingFileName}</strong>`, "success");
    } catch (downloadError) {
      log(`⚠️ Failed to download mapping file: ${downloadError.message}`, "error");
      // Don't throw here - main file was successful
    }
    
    log("🎉 File anonymized successfully — results ready below!", "success");
    log(`📥 Downloaded: <strong>${anonymizedFileName}</strong>`, "success");
    log(`📥 Downloaded: <strong>${mappingFileName}</strong>`, "success");
    log(`📊 Processed ${mapRows.length - 1} anonymized values`, "info");
    
      } catch (error) {
        log(`❌ Error: ${error.message}`, "error");
        console.error("Anonymization error:", error);
      }}
  } finally {
    anonymizeBtn.disabled = false;
  }
}

// Initialize the extension with error handling
function init() {
  try {
    // Check if required elements exist
    const fileInput = $("#file-input");
    const anonymizeBtn = $("#anonymize-btn");
    const logElement = $("#log");
    
    if (!fileInput) {
      throw new Error("File input element not found");
    }
    
    if (!anonymizeBtn) {
      throw new Error("Anonymize button not found");
    }
    
    if (!logElement) {
      throw new Error("Log element not found");
    }
    
    // File input handler
    fileInput.addEventListener("change", (e) => {
      try {
        handleFileSelect(e.target.files[0]);
      } catch (error) {
        log(`❌ Error handling file selection: ${error.message}`, "error");
        console.error("File selection error:", error);
      }
    });
    
    // Anonymize button handler
    anonymizeBtn.addEventListener("click", (e) => {
      try {
        anonymizeData();
      } catch (error) {
        log(`❌ Error starting anonymization: ${error.message}`, "error");
        console.error("Anonymization start error:", error);
      }
    });
    
    // Setup drag and drop
    setupDragAndDrop();
    
    // Initial log message
    log("🛡️ Anon-Izzie ready - Drop your Excel/CSV file to begin", "info");
    
    // Reset button handler with error handling
    const resetBtn = $("#resetBtn");
    if (resetBtn) {
      resetBtn.addEventListener("click", () => {
        try {
          currentFile = null;
          fileName = null;
          $("#file-input").value = "";
          $("#optionsSection").style.display = "none";
          $("#resultsSection").style.display = "none";
          $("#log").textContent = "";
          log("🛡️ Ready for a new file — drop Excel/CSV to begin", "info");
        } catch (error) {
          log(`❌ Error resetting: ${error.message}`, "error");
          console.error("Reset error:", error);
        }
      });
    }

    // Mode help text toggle with error handling
    const strictMode = $("#strictMode");
    const contextualMode = $("#contextualMode");
    
    if (strictMode) {
      strictMode.addEventListener("change", () => {
        try {
          if (strictMode.checked) {
            const strictHelp = $("#strictModeHelp");
            const contextualHelp = $("#contextualModeHelp");
            if (strictHelp) strictHelp.style.display = "block";
            if (contextualHelp) contextualHelp.style.display = "none";
          }
        } catch (error) {
          console.error("Strict mode toggle error:", error);
        }
      });
    }

    if (contextualMode) {
      contextualMode.addEventListener("change", () => {
        try {
          if (contextualMode.checked) {
            const strictHelp = $("#strictModeHelp");
            const contextualHelp = $("#contextualModeHelp");
            if (strictHelp) strictHelp.style.display = "none";
            if (contextualHelp) contextualHelp.style.display = "block";
          }
        } catch (error) {
          console.error("Contextual mode toggle error:", error);
        }
      });
    }

    // Show help for initially selected mode
    const strictModeHelp = $("#strictModeHelp");
    if (strictModeHelp) {
      strictModeHelp.style.display = "block";
    }
    
  } catch (error) {
    console.error("Initialization error:", error);
    // Try to show error in UI if possible
    const logElement = $("#log");
    if (logElement) {
      // Clear existing content
      logElement.textContent = "";
      
      // Create error div element safely
      const errorDiv = document.createElement("div");
      errorDiv.className = "error";
      errorDiv.textContent = `❌ Extension initialization failed: ${error.message}`;
      
      // Append to log element
      logElement.appendChild(errorDiv);
    }
  }
}

// Global error handler with security considerations
window.addEventListener("error", (event) => {
  console.error("Global error:", event.error);
  const logElement = $("#log");
  if (logElement) {
    // Sanitize error messages to prevent information leakage
    const safeMessage = event.error?.message ? 
      event.error.message.replace(/[<>]/g, '') : 'Unknown error';
    log(`❌ Unexpected error: ${safeMessage}`, "error");
  }
  
  // Prevent error propagation that could expose sensitive data
  event.preventDefault();
  return false;
});

window.addEventListener("unhandledrejection", (event) => {
  console.error("Unhandled promise rejection:", event.reason);
  const logElement = $("#log");
  if (logElement) {
    log(`❌ Promise error: ${event.reason?.message || 'Unknown error'}`, "error");
  }
});

// Start the extension when DOM is loaded
document.addEventListener("DOMContentLoaded", init);
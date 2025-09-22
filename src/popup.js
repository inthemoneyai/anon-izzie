// Anon-Izzie — Your Excel/CSV Privacy Shield
// 100% client-side PII protection for HR/Finance data

// PII detection patterns for equity/HR data
const PII_PATTERNS = {
  name: [
    "employee name", "ee name", "worker name", "associate name", "full name",
    "name", "first name", "last name", "employee", "worker", "associate",
    "surname", "legal name"
  ],
  empId: [
    "employee id", "person number", "emp id", "empid", "empl id", "ee id",
    "eeid", "worker id", "associate id", "person id", "employee number",
    "staff id", "worker number", "person key"
  ],
  grantId: [
    "grant id", "grant #", "grant number", "award id", "award number",
    "award #", "option id", "option number", "lot id", "transaction #"
  ],
  email: [
    "email", "e-mail", "email address", "work email", "corporate email",
    "login", "username"
  ],
  ssn: [
    "ssn", "social security number", "ss#", "ss #", "ssn/tin"
  ],
  address: [
    "address", "address line 1", "address1", "address line1",
    "street address", "home address", "address line 2"
  ],
  city: ["city", "municipality"],
  state: ["state", "province", "region"],
  zip: ["zip", "zip code", "postal", "postal code", "zipcode"],
  phone: [
    "phone", "phone number", "telephone", "cell", "mobile", "work phone",
    "home phone", "telephone number", "mobile number"
  ],
  dob: [
    "dob", "date of birth", "birthdate", "birth date"
  ],
  compensation: [
    "salary", "compensation", "pay", "wage", "annual salary", "base salary",
    "total value", "total_value", "value", "amount", "dollar", "dollars",
    "bonus", "stipend"
  ],
  department: ["department", "dept", "division", "team", "unit"],
  manager: [
    "manager", "supervisor", "reporting manager", "direct manager"
  ],
  bank: [
    "bank account", "account number", "routing", "iban", "swift",
    "account #", "acct number"
  ],
  taxId: [
    "itin", "ein", "tax id", "taxid", "tin", "federal tax id", "state tax id",
    "national id"
  ],
  taxValue: [
    "withholding", "allowances", "fica", "ss", "medicare", "federal",
    "state withholding", "local withholding", "local tax", "state tax",
    "social security", "tax value", "taxable wages", "deductions",
    "state deductions", "federal income tax", "state income tax"
  ],
  visa: ["visa", "work permit", "passport"],
  demographics: [
    "gender", "ethnicity", "marital status", "marital_status"
  ],
  transaction: [
    "transaction id", "espp id", "purchase id", "vest id"
  ],
  grantDate: [
    "grant date", "grant_date", "award date", "award_date",
    "option grant date", "granting date", "issue date", "board approval date"
  ],
  vestDate: [
    "vest date", "vest_date", "vesting date", "vesting_date", "exercise date",
    "exercise_date", "release date"
  ],
  exercisePrice: [
    "exercise price", "exercise_price", "strike price", "strike_price",
    "option price"
  ],
  fmv: [
    "fmv", "fair market value", "fair_market_value", "market value", "market_value"
  ],
  shares: [
    "shares", "number of shares", "shares granted", "shares_vested",
    "shares_exercised", "shares outstanding", "shares released",
    "quantity", "qty", "granted", "vested", "exercised", "outstanding",
    "approved shares", "available shares", "unavailable shares"
  ]
};

// Friendly names for detected field types
const FRIENDLY_NAMES = {
  name: "Employee Name",
  empId: "Employee ID",
  grantId: "Grant/Award ID",
  email: "Email Address",
  ssn: "Social Security Number",
  address: "Home Address",
  city: "City",
  state: "State/Province",
  zip: "ZIP/Postal Code",
  phone: "Phone Number",
  dob: "Date of Birth",
  compensation: "Compensation",
  department: "Department",
  manager: "Manager/Supervisor",
  bank: "Bank Account",
  taxId: "Tax ID (EIN/ITIN/etc.)",
  taxValue: "Tax Amount / Withholding",
  visa: "Visa/Work Permit",
  demographics: "Demographics",
  transaction: "Transaction ID",
  grantDate: "Grant Date",
  vestDate: "Vesting Date",
  exercisePrice: "Exercise Price",
  fmv: "Fair Market Value",
  shares: "Shares",
};

// Order matters for display (IDs first, then amounts, etc.)
const DISPLAY_PRIORITY = [
  "ssn", "taxId", "empId", "grantId",
  "name", "compensation", "taxValue",
  "email", "phone", "dob",
  "address", "city", "state", "zip",
  "bank", "visa", "demographics",
  "transaction", "grantDate", "vestDate",
  "exercisePrice", "fmv", "shares",
  "department", "manager"
];

// Escape regex safely
function escapeRegExp(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Duplicate function removed - using the more robust version below

// Duplicate function removed - using the improved version below

function getFriendlyLabelsSorted(typeKeys) {
  const unique = [...new Set(typeKeys)];
  const byPriority = (a, b) =>
    DISPLAY_PRIORITY.indexOf(a) - DISPLAY_PRIORITY.indexOf(b);
  const sortedKeys = unique.sort(byPriority);
  return sortedKeys.map(k => FRIENDLY_NAMES[k] || k);
}

// Remove noisy overlaps so one field doesn't get tagged as 3+ things
function suppressNoisyOverlaps(detectedTypes) {
  const set = new Set(detectedTypes);

  // If SSN is detected, don't also show taxValue
  if (set.has("ssn")) set.delete("taxValue");

  // If Employee ID is detected, don't also show Name
  if (set.has("empId")) set.delete("name");

  // Add more suppression rules here as you see odd combos

  return [...set];
}

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
  TRANS: 0,  // Transactions
  GRANT: 0,  // Grant dates
  VEST: 0,   // Vesting dates
  PRICE: 0,  // Exercise prices
  FMV: 0,    // Fair market values
  SHARES: 0, // Share counts
  GEN: 0     // Generic fields
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
let detectedFields = [];
let fieldSelections = {};

// Session-only state management (no persistent storage)
function clearSession() {
  currentFile = null;
  fileName = null;
  detectedFields = [];
  fieldSelections = {};
}

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
  return PII_PATTERNS[piiType].some(pattern =>
    headerMatchesPattern(header, pattern)
  );
}

function extractDigits(str) {
  return (str || "").toString().replace(/\D+/g, "");
}

function generateToken(prefix) {
  TOKEN_COUNTERS[prefix] = (TOKEN_COUNTERS[prefix] || 0) + 1;
  return `${prefix}${String(TOKEN_COUNTERS[prefix]).padStart(4, "0")}`;
}

// Unused function removed - only getFriendlyLabelsSorted() is used

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

function analyzeFields(headerRow) {
  detectedFields = [];
  fieldSelections = {};
  
  headerRow.forEach((header, index) => {
    if (!header || header.trim() === "") return;
    
    const field = {
      index: index,
      name: header,
      detectedTypes: [],
      suggestedAction: "keep"
    };
    
    // Check each PII type with priority order
    const priorityOrder = [
      'name', 'empId', 'grantId',
      'ssn', 'taxId', 'taxValue', 'compensation', 'email', 'phone', 'address', 'bank',
      'dob', 'visa', 'demographics', 'transaction', 'grantDate',
      'vestDate', 'exercisePrice', 'fmv', 'shares', 'department',
      'manager', 'city', 'state', 'zip'
    ];    
    
    priorityOrder.forEach(piiType => {
      if (PII_PATTERNS[piiType] && isPIIField(header, piiType)) {
        field.detectedTypes.push(piiType);
        // Debug logging for "State Withholding" issue
        if (header.toLowerCase().includes("state") && header.toLowerCase().includes("withholding")) {
          console.log(`Field "${header}" detected as ${piiType}`);
        }
      }
    });
    
    // Determine suggested action
    if (field.detectedTypes.length > 0) {
      field.suggestedAction = "anonymize";
      fieldSelections[`field_${index}`] = true; // Default to selected for PII fields
    } else {
      field.suggestedAction = "keep";
      fieldSelections[`field_${index}`] = false; // Default to not selected for non-PII fields
    }
    
    detectedFields.push(field);
  });
  
  return detectedFields;
}

async function analyzeFileFields() {
  try {
    if (!currentFile) return;
    
    const arrayBuffer = await readFileAsArrayBuffer(currentFile);
    const workbook = XLSX.read(arrayBuffer, { 
      type: "array",
      cellDates: true,
      cellNF: false,
      cellText: false
    });
    
    if (!workbook || !workbook.SheetNames || !workbook.SheetNames.length) {
      log("❌ Could not read file structure", "error");
      return;
    }
    
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet, { 
      header: 1, 
      defval: "",
      raw: false,
      dateNF: 'yyyy-mm-dd'
    });
    
    if (!data || !Array.isArray(data) || data.length === 0) {
      log("❌ No data found in file", "error");
      return;
    }
    
    const headerRow = data[0];
    analyzeFields(headerRow);
    createFieldSelectionUI();
    
    // Show field selection interface
    $("#fieldSelectionSection").classList.remove("hidden");
    $("#optionsSection").classList.remove("hidden");
    
    log(`✅ Found ${detectedFields.length} fields - select what to anonymize`, "success");
    
  } catch (error) {
    log(`❌ Error analyzing file: ${error.message}`, "error");
    console.error("Field analysis error:", error);
  }
}

function updateMasterCheckbox() {
  const selectAllMaster = $("#selectAllMaster");
  if (!selectAllMaster) return;
  
  const totalFields = detectedFields.length;
  const selectedFields = Object.values(fieldSelections).filter(Boolean).length;
  
  if (selectedFields === 0) {
    selectAllMaster.checked = false;
    selectAllMaster.indeterminate = false;
  } else if (selectedFields === totalFields) {
    selectAllMaster.checked = true;
    selectAllMaster.indeterminate = false;
  } else {
    selectAllMaster.checked = false;
    selectAllMaster.indeterminate = true;
  }
}

function headerMatchesPattern(header, pattern) {
  const h = normalizeHeader(header);
  const p = normalizeHeader(pattern);

  // For very short patterns (<=2 chars), require exact match
  if (p.length <= 2) return h === p;

  // Special case: "state" should only match geographic state, not tax-related
  if (p === "state") {
    // Don't match if it's clearly tax-related
    if (h.includes("withholding") || h.includes("tax") || h.includes("deduction")) {
      return false;
    }
  }

  // Word boundary match (whole word/phrase)
  const rx = new RegExp(`\\b${p.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i");
  if (rx.test(h)) return true;

  // Fallback: allow phrase contains, but only if multi-word
  return h.includes(p) && p.split(" ").length > 1;
}

function createFieldSelectionUI() {
  const fieldList = $("#fieldList");
  if (!fieldList) return;
  
  fieldList.innerHTML = "";
  
  detectedFields.forEach(field => {
    const hasPII = field.detectedTypes.length > 0;
    const div = document.createElement("div");
    div.className = `flex items-center justify-between p-2 rounded text-xs ${hasPII ? 'bg-gray-50' : 'bg-gray-100 opacity-60'}`;
    
    const fieldInfo = document.createElement("div");
    fieldInfo.className = "flex-1";
    
    const fieldName = document.createElement("div");
    fieldName.className = `font-medium ${hasPII ? 'text-gray-800' : 'text-gray-500'}`;
    fieldName.textContent = field.name;
    
    const fieldTypes = document.createElement("div");
    fieldTypes.className = `text-xs ${hasPII ? 'text-gray-500' : 'text-gray-400'}`;
    if (field.detectedTypes.length > 0) {
      const suppressed = suppressNoisyOverlaps(field.detectedTypes);
      const labels = getFriendlyLabelsSorted(suppressed);
      fieldTypes.innerHTML = `Detected: ${labels
        .map(l => `<span class="chip">${l}</span>`)
        .join(" ")}`;
    } else {
      fieldTypes.textContent = "No PII detected";
    }    
    
    fieldInfo.appendChild(fieldName);
    fieldInfo.appendChild(fieldTypes);
    
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.id = `field_${field.index}`;
    checkbox.className = `w-3 h-3 accent-blue-600 ${hasPII ? '' : 'opacity-50'}`;
    checkbox.checked = fieldSelections[`field_${field.index}`];
    
    checkbox.addEventListener("change", (e) => {
      fieldSelections[`field_${field.index}`] = e.target.checked;
      updateMasterCheckbox();
    });
    
    div.appendChild(fieldInfo);
    div.appendChild(checkbox);
    fieldList.appendChild(div);
  });
  
  // Update master checkbox after creating all fields
  updateMasterCheckbox();
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
    // Sanitize message to prevent XSS - use textContent for security per Chrome extension security documentation
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
  
  // Hide dropzone and show file info card
  $("#dropzone").classList.add("hidden");
  $("#fileInfoCard").classList.remove("hidden");
  $("#selectedFileName").textContent = fileName;
  $("#selectedFileSize").textContent = `(${(file.size / 1024).toFixed(1)} KB)`;
  
  // Show logs section immediately
  $("#logSection").classList.remove("hidden");
  
  // Analyze fields and show selection interface immediately
  log("🔍 Analyzing fields...", "info");
  
  // We need to read the file to analyze fields
  analyzeFileFields();
  
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
  
  console.log("Setting up drag and drop for element:", dropzone);
  
  ["dragenter", "dragover"].forEach(eventName => {
    dropzone.addEventListener(eventName, (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropzone.classList.add("dragover");
    });
  });
  
  ["dragleave", "drop"].forEach(eventName => {
    dropzone.addEventListener(eventName, (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropzone.classList.remove("dragover");
    });
  });
  
  dropzone.addEventListener("drop", (e) => {
    console.log("Drop event triggered", e);
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
    log("🔄 Processing file...", "info");
    
    // Check if XLSX library is loaded
    if (typeof XLSX === 'undefined') {
      throw new Error("Excel processing library not loaded. Please refresh the extension.");
    }
    
    const arrayBuffer = await readFileAsArrayBuffer(currentFile);
    
    if (!arrayBuffer || arrayBuffer.byteLength === 0) {
      throw new Error("File appears to be empty or corrupted");
    }
    
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
    
    // No need to log sheet name - not important to user
    
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
        mode: modeElement.id
      };
    } catch (optionError) {
      throw new Error(`Configuration error: ${optionError.message}`);
    }
    
    // Column-level dictionaries for consistent tokenization
    const columnDictionaries = headerRow.map(() => new Map());
    
    log(`📊 Processing ${data.length - 1} rows, ${headerRow.length} columns...`, "info");

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
            
            // Check if this field should be anonymized based on user selection
            const shouldAnonymize = fieldSelections[`field_${colIndex}`];
            if (!shouldAnonymize) continue;
            
            // Check if this is a non-PII field that user selected
            const field = detectedFields.find(f => f.index === colIndex);
            const isNonPIIField = field && field.detectedTypes.length === 0;
            
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
              const masked = maskSSN(originalValue);
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
              if (options.mode === "contextualMode" && /^[A-Z]{2}$/.test(value)) {
                row[colIndex] = value;
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
              const masked = maskPhone(originalValue);
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
            else if (isPIIField(header, "compensation")) {
              if (options.mode === "strictMode") {
                row[colIndex] = "***,***"; // nuke exact comp
                addToMap(originalValue, "***,***");
              } else if (options.mode === "rangeMode") {
                const masked = maskSalary(originalValue); // bucket/range
                row[colIndex] = masked;
                addToMap(originalValue, masked);
              } else {
                // Contextual mode: use consistent fake values like taxValue
                const num = parseFloat(originalValue.toString().replace(/[,$]/g, ""));
                if (!isNaN(num)) {
                  const rounded = Math.round(num / 100) * 100;
                  row[colIndex] = rounded.toString();
                  addToMap(originalValue, rounded.toString());
                } else {
                  row[colIndex] = "***,***";
                  addToMap(originalValue, "***,***");
                }
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
            // Tax IDs (EIN, ITIN, Tax ID)
            else if (isPIIField(header, "taxId")) {
              const token = getOrCreateToken("TAX", originalValue);
              row[colIndex] = token;
              addToMap(originalValue, token);
            }
            // Tax values (withholding %, FICA, etc.)
            else if (isPIIField(header, "taxValue")) {
              if (options.mode === "strictMode") {
                row[colIndex] = "***"; 
                addToMap(originalValue, "***");
              } else {
                const num = parseFloat(originalValue.toString().replace(/[,$%]/g, ""));
                if (!isNaN(num)) {
                  // bucket to keep shape but hide exact
                  const rounded = Math.round(num / 100) * 100;
                  row[colIndex] = rounded.toString();
                  addToMap(originalValue, rounded.toString());
                } else {
                  row[colIndex] = "***";
                  addToMap(originalValue, "***");
                }
              }
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
            else if (isPIIField(header, "grantDate")) {
              if (options.mode === "strictMode") {
                row[colIndex] = "1900-01-01"; // wipe
                addToMap(originalValue, "1900-01-01");
              } else {
                const shifted = shiftDate(originalValue, 30); // shift by 30 days
                row[colIndex] = shifted;
                addToMap(originalValue, shifted);
              }
            }
            else if (isPIIField(header, "vestDate")) {
              if (options.mode === "strictMode") {
                row[colIndex] = "1900-01-01"; // wipe
                addToMap(originalValue, "1900-01-01");
              } else {
                const shifted = shiftDate(originalValue, 30); // shift by 30 days
                row[colIndex] = shifted;
                addToMap(originalValue, shifted);
              }
            }
            else if (isPIIField(header, "exercisePrice")) {
              if (options.mode === "strictMode") {
                row[colIndex] = "***.**"; // wipe
                addToMap(originalValue, "***.**");
              } else {
                // Round to nearest dollar for analysis
                const num = parseFloat(originalValue.toString().replace(/[,$]/g, ""));
                if (!isNaN(num)) {
                  const rounded = Math.round(num);
                  row[colIndex] = rounded.toFixed(2);
                  addToMap(originalValue, rounded.toFixed(2));
                } else {
                  row[colIndex] = "***.**";
                  addToMap(originalValue, "***.**");
                }
              }
            }
            else if (isPIIField(header, "fmv")) {
              if (options.mode === "strictMode") {
                row[colIndex] = "***.**"; // wipe
                addToMap(originalValue, "***.**");
              } else {
                // Round to nearest dollar for analysis
                const num = parseFloat(originalValue.toString().replace(/[,$]/g, ""));
                if (!isNaN(num)) {
                  const rounded = Math.round(num);
                  row[colIndex] = rounded.toFixed(2);
                  addToMap(originalValue, rounded.toFixed(2));
                } else {
                  row[colIndex] = "***.**";
                  addToMap(originalValue, "***.**");
                }
              }
            }
            else if (isPIIField(header, "shares")) {
              if (options.mode === "strictMode") {
                row[colIndex] = "***"; // wipe
                addToMap(originalValue, "***");
              } else {
                // Round to nearest 100 for analysis
                const num = parseFloat(originalValue.toString().replace(/[,$]/g, ""));
                if (!isNaN(num)) {
                  const rounded = Math.round(num / 100) * 100;
                  row[colIndex] = rounded.toString();
                  addToMap(originalValue, rounded.toString());
                } else {
                  row[colIndex] = "***";
                  addToMap(originalValue, "***");
                }
              }
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
            
            // Handle non-PII fields that user selected for anonymization
            if (isNonPIIField) {
              try {
                const value = String(originalValue).trim();
                
                // Try to detect what type of data this might be
                if (!isNaN(value) && !isNaN(parseFloat(value))) {
                  // Numeric data - round or mask based on mode
                  if (options.mode === "strictMode") {
                    row[colIndex] = "***";
                    addToMap(originalValue, "***", "generic");
                  } else {
                    // Round to nearest 10 for analysis
                    const num = parseFloat(value);
                    const rounded = Math.round(num / 10) * 10;
                    row[colIndex] = rounded.toString();
                    addToMap(originalValue, rounded.toString(), "generic");
                  }
                } else if (value.includes("@") && value.includes(".")) {
                  // Looks like email - mask it
                  const masked = `user${String(++TOKEN_COUNTERS.EML).padStart(4, "0")}@example.invalid`;
                  row[colIndex] = masked;
                  addToMap(originalValue, masked, "generic");
                } else if (/^\d{4}-\d{2}-\d{2}/.test(value) || /^\d{2}\/\d{2}\/\d{4}/.test(value)) {
                  // Looks like date - shift it
                  if (options.mode === "strictMode") {
                    row[colIndex] = "1900-01-01";
                    addToMap(originalValue, "1900-01-01", "generic");
                  } else {
                    const shifted = shiftDate(originalValue, 30);
                    row[colIndex] = shifted;
                    addToMap(originalValue, shifted, "generic");
                  }
                } else {
                  // Text data - tokenize it
                  const token = getOrCreateToken("GEN", originalValue);
                  row[colIndex] = token;
                  addToMap(originalValue, token, "generic");
                }
              } catch (genericError) {
                // Fallback - just tokenize everything
                const token = getOrCreateToken("GEN", originalValue);
                row[colIndex] = token;
                addToMap(originalValue, token, "generic");
              }
            }
        
            data[rowIndex] = row;

          } catch (rowError) {
            log(`⚠️ Error processing row ${rowIndex + 1}: ${rowError.message}`, "info");
            continue;
          }
        }
      } catch (rowError) {
        log(`⚠️ Error processing row ${rowIndex + 1}: ${rowError.message}`, "info");
        continue;
      }
    }

    log(`🔒 Anonymized ${headerDetections + regexDetections} sensitive fields`, "success");
    
    // Update results summary in UI
    const summaryText = `📊 ${headerDetections} header, 🔎 ${regexDetections} regex → Total ${headerDetections + regexDetections} fields scrubbed`;
    $("#resultSummary").textContent = summaryText;

    // Hide field selection during processing to make room for logs
    $("#fieldSelectionSection").classList.add("hidden");
    $("#optionsSection").classList.add("hidden");
    
    // Show results section
    $("#resultsSection").classList.remove("hidden");

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
      log(`📥 Downloaded: ${anonymizedFileName}`, "success");
    } catch (downloadError) {
      throw new Error(`Failed to download anonymized file: ${downloadError.message}`);
    }
    
    try {
      downloadFile(mappingFileName, new Blob([mappingCsv], { 
        type: "text/csv;charset=utf-8" 
      }));
      log(`📥 Downloaded: ${mappingFileName}`, "success");
    } catch (downloadError) {
      log(`⚠️ Failed to download mapping file: ${downloadError.message}`, "error");
      // Don't throw here - main file was successful
    }
    
    log("🎉 Success! Files downloaded", "success");
    
  } catch (error) {
    log(`❌ Error: ${error.message}`, "error");
    console.error("Anonymization error:", error);
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
    log("🛡️ Ready - Drop file to begin", "info");
    log("💡 Chrome closes this if you click away — a browser limit that helps protect your privacy.", "info");
    
    // Reset button handler with error handling
    const resetBtn = $("#resetBtn");
    if (resetBtn) {
      resetBtn.addEventListener("click", () => {
        try {
          clearSession();
          $("#file-input").value = "";
          $("#dropzone").classList.remove("hidden");
          $("#fileInfoCard").classList.add("hidden");
          $("#optionsSection").classList.add("hidden");
          $("#fieldSelectionSection").classList.add("hidden");
          $("#resultsSection").classList.add("hidden");
          $("#logSection").classList.remove("hidden");
          $("#log").textContent = "";
          log("🛡️ Ready - Drop file to begin", "info");
        } catch (error) {
          log(`❌ Error resetting: ${error.message}`, "error");
          console.error("Reset error:", error);
        }
      });
    }

    // Change file button handler
    const changeFileBtn = $("#changeFileBtn");
    if (changeFileBtn) {
      changeFileBtn.addEventListener("click", () => {
        try {
          $("#file-input").click();
        } catch (error) {
          log(`❌ Error opening file dialog: ${error.message}`, "error");
          console.error("Change file error:", error);
        }
      });
    }

    // Mode help text toggle with error handling
    const strictMode = $("#strictMode");
    const contextualMode = $("#contextualMode");
    const rangeMode = $("#rangeMode");
    
    if (strictMode) {
      strictMode.addEventListener("change", () => {
        try {
          if (strictMode.checked) {
            // Hide other help text if it exists
            const contextualHelp = $("#contextualModeHelp");
            const rangeHelp = $("#rangeModeHelp");
            if (contextualHelp) contextualHelp.style.display = "none";
            if (rangeHelp) rangeHelp.style.display = "none";
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
            // Hide other help text if it exists
            const strictHelp = $("#strictModeHelp");
            const rangeHelp = $("#rangeModeHelp");
            if (strictHelp) strictHelp.style.display = "none";
            if (rangeHelp) rangeHelp.style.display = "none";
          }
        } catch (error) {
          console.error("Contextual mode toggle error:", error);
        }
      });
    }

    if (rangeMode) {
      rangeMode.addEventListener("change", () => {
        try {
          if (rangeMode.checked) {
            // Hide other help text if it exists
            const strictHelp = $("#strictModeHelp");
            const contextualHelp = $("#contextualModeHelp");
            if (strictHelp) strictHelp.style.display = "none";
            if (contextualHelp) contextualHelp.style.display = "none";
          }
        } catch (error) {
          console.error("Range mode toggle error:", error);
        }
      });
    }

    // Re-process button handler
    const reprocessBtn = $("#reprocessBtn");
    if (reprocessBtn) {
      reprocessBtn.addEventListener("click", () => {
        try {
          // Hide results, show field selection again
          $("#resultsSection").classList.add("hidden");
          $("#fieldSelectionSection").classList.remove("hidden");
          $("#optionsSection").classList.remove("hidden");
          $("#log").textContent = "";
          log("🔄 Adjust your selections and click Anonymize to re-process", "info");
        } catch (error) {
          log(`❌ Error preparing re-process: ${error.message}`, "error");
          console.error("Re-process error:", error);
        }
      });
    }

    // Process Another File button handler
    const newFileBtn = $("#newFileBtn");
    if (newFileBtn) {
      newFileBtn.addEventListener("click", () => {
        try {
          currentFile = null;
          fileName = null;
          $("#file-input").value = "";
          $("#dropzone").classList.remove("hidden");
          $("#fileInfoCard").classList.add("hidden");
          $("#optionsSection").classList.add("hidden");
          $("#fieldSelectionSection").classList.add("hidden");
          $("#resultsSection").classList.add("hidden");
          $("#logSection").classList.add("hidden");
          $("#log").textContent = "";
          log("🛡️ Ready - Drop file to begin", "info");
        } catch (error) {
          log(`❌ Error resetting: ${error.message}`, "error");
          console.error("New file error:", error);
        }
      });
    }

    // Master Select All checkbox
    const selectAllMaster = $("#selectAllMaster");
    if (selectAllMaster) {
      selectAllMaster.addEventListener("change", (e) => {
        const isChecked = e.target.checked;
        detectedFields.forEach(field => {
          fieldSelections[`field_${field.index}`] = isChecked;
          const checkbox = document.getElementById(`field_${field.index}`);
          if (checkbox) checkbox.checked = isChecked;
        });
      });
    }

    // Mode initialization complete - contextual mode is default
    
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
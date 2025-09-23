// Generate a CSV with one column per PII_PATTERNS synonym
// Each column gets realistic dummy values to test anonymizer logic
// Run in terminal with: node scripts/test-generator.js
//
// This creates pii_test.csv with:
// - Headers for every pattern variant (e.g., "ss#", "ssn", "social security number")
// - 4 rows of test data with realistic values
// - Edge cases in row 3 to test specific scenarios
//
// Use this to verify PII detection is working correctly!

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Get current directory (for ES modules)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Paste in your PII_PATTERNS object here
const PII_PATTERNS = {
  name: ["employee name", "ee name", "worker name", "associate name", "full name",
    "name", "first name", "last name", "employee", "worker", "associate",
    "surname", "legal name"
  ],
  empId: ["employee id", "person number", "emp id", "empid", "empl id", "ee id",
    "eeid", "worker id", "associate id", "person id", "employee number",
    "staff id", "worker number", "person key"
  ],
  grantId: ["grant id", "grant #", "grant number", "award id", "award number",
    "award #", "option id", "option number", "lot id", "transaction #"
  ],
  email: ["email", "e-mail", "email address", "work email", "corporate email",
    "login", "username"
  ],
  ssn: ["ssn", "social security number", "ss#", "ss #", "ssn/tin"
  ],
  address: ["address", "address line 1", "address1", "address line1",
    "street address", "home address", "address line 2"
  ],
  city: ["city", "municipality"],
  state: ["state", "province", "region"],
  zip: ["zip", "zip code", "postal", "postal code", "zipcode"],
  phone: ["phone", "phone number", "telephone", "cell", "mobile", "work phone",
    "home phone", "telephone number", "mobile number"
  ],
  dob: ["dob", "date of birth", "birthdate", "birth date"],
  compensation: ["salary", "compensation", "pay", "wage", "annual salary", "base salary",
    "total value", "total_value", "amount", "dollar", "dollars", "taxable wages",
    "bonus", "stipend", "exercise gain", "vesting gain", "taxable income"
  ],
  department: ["department", "dept", "division", "team", "unit"],
  manager: ["manager", "supervisor", "reporting manager", "direct manager"],
  bank: ["bank account", "account number", "routing", "iban", "swift",
    "account #", "acct number"
  ],
  taxId: ["itin", "ein", "tax id", "taxid", "tin", "federal tax id", "state tax id",
    "national id"
  ],
  taxValue: ["withholding", "allowances", "fica", "ss", "medicare", "federal",
    "state withholding", "local withholding", "local tax", "local tax amount", "state tax", "state tax amount",
    "social security", "social security tax", "social security tax amount", "tax value", "tax amount", "deductions",
    "state deductions", "local deductions", "federal income tax", "state income tax", "local income tax",
    "withholding amount", "federal withholding amount", "state withholding amount", "tax withholding amount",
    "withholding tax", "federal withholding tax", "state withholding tax", "withholding tax amount"
  ],
  visa: ["visa", "work permit", "passport"],
  demographics: ["gender", "ethnicity", "marital status", "marital_status"],
  transaction: ["transaction id", "espp id", "purchase id", "vest id"],
  grantDate: ["grant date", "grant_date", "award date", "award_date",
    "option grant date", "granting date", "issue date", "board approval date"
  ],
  vestDate: ["vest date", "vest_date", "vesting date", "vesting_date", "exercise date",
    "exercise_date", "release date"
  ],
  exercisePrice: ["exercise price", "exercise_price", "strike price", "strike_price",
    "option price"
  ],
  fmv: ["fmv", "fair market value", "fair_market_value", "market value", "market_value"],
  shares: ["shares", "number of shares", "shares granted", "shares_vested",
    "shares_exercised", "shares outstanding", "shares released",
    "quantity", "qty", "granted", "vested", "exercised", "outstanding",
    "approved shares", "available shares", "unavailable shares"
  ]
};

// Sample dummy values per category - mix of round and non-round numbers for better testing
const categorySamples = {
  name: ["Jane Doe", "John Smith", "Alice Johnson", "Bob Williams"],
  empId: ["12345", "67890", "54321", "98765"],
  grantId: ["G123", "G456", "G789", "G012"],
  email: ["user1@example.com", "user2@example.com", "user3@example.com", "user4@example.com"],
  ssn: ["123-45-6789", "987-65-4321", "456-78-9012", "321-54-8765"],
  address: ["123 Main St", "456 Elm St", "789 Oak Ave", "321 Pine Rd"],
  city: ["New York", "Los Angeles", "Chicago", "Houston"],
  state: ["NY", "CA", "IL", "TX"],
  zip: ["10001", "90001", "60601", "77001"],
  phone: ["555-123-4567", "555-987-6543", "555-456-7890", "555-321-0987"],
  dob: ["01/01/1980", "12/31/1999", "06/15/1985", "03/22/1990"],
  compensation: ["100000", "87543", "250000", "156789"], // Mix of round and non-round
  department: ["Finance", "HR", "Engineering", "Sales"],
  manager: ["Alice Boss", "Bob Supervisor", "Carol Director", "Dave Manager"],
  bank: ["123456789", "987654321", "456789123", "789123456"],
  taxId: ["12-3456789", "98-7654321", "45-6789012", "78-9012345"],
  taxValue: ["5000", "4321", "10000", "7654"], // Mix of round and non-round
  visa: ["H1B", "L1", "O1", "TN"],
  demographics: ["Female", "Male", "Non-binary", "Prefer not to say"],
  transaction: ["T123", "T456", "T789", "T012"],
  grantDate: ["01/15/2020", "02/20/2021", "06/30/2022", "09/15/2023"],
  vestDate: ["01/15/2022", "02/20/2023", "06/30/2024", "09/15/2025"],
  exercisePrice: ["10.00", "12.34", "20.00", "18.75"], // Mix of round and non-round
  fmv: ["15.00", "17.89", "25.00", "22.43"], // Mix of round and non-round
  shares: ["1000", "1234", "5000", "3456"] // Mix of round and non-round
};

// Flatten all synonyms into headers
const headers = Object.entries(PII_PATTERNS).flatMap(([cat, arr]) =>
  arr.map(h => ({ category: cat, header: h }))
);

// Generate rows of realistic dummy values
const rows = [0, 1, 2, 3].map(i =>
  headers.map(({ category, header }) => {
    const samples = categorySamples[category];
    if (samples) {
      // Add some variations for testing edge cases
      if (category === 'ssn' && i === 2) {
        return "SSN: 456-78-9012"; // Test SSN with prefix
      }
      if (category === 'compensation' && header === 'amount' && i === 2) {
        return "150000"; // Generic amount
      }
      if (category === 'taxValue' && header.includes('amount') && i === 2) {
        return "12500"; // Tax amount
      }
      if (category === 'fmv' && i === 2) {
        return "25.50"; // Market value
      }
      return samples[i % samples.length];
    }
    return `TEST_${header.replace(/\s+/g, "_").toUpperCase()}`;
  })
);

// Build CSV string
let csv = headers.map(h => h.header).join(",") + "\n";
csv += rows.map(r => r.join(",")).join("\n");

// Write to sample_data folder
const outputPath = path.join(__dirname, "..", "sample_data", "pii_test.csv");
fs.writeFileSync(outputPath, csv, "utf8");

console.log(`✅ Test file generated: sample_data/pii_test.csv`);
console.log(`📁 Location: ${path.relative(process.cwd(), outputPath)}`);
// Generate a CSV with one column per PII_PATTERNS synonym
// Each column gets realistic dummy values to test anonymizer logic
// Run in terminal with: node scripts/test-generator.js

import fs from "fs";

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
    "total value", "total_value", "value", "amount", "dollar", "dollars",
    "bonus", "stipend"
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
    "state withholding", "local withholding", "local tax", "state tax",
    "social security", "tax value", "taxable wages", "deductions",
    "state deductions", "federal income tax", "state income tax"
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

// Sample dummy values per category
const categorySamples = {
  name: ["Jane Doe", "John Smith"],
  empId: ["12345", "67890"],
  grantId: ["G123", "G456"],
  email: ["user1@example.com", "user2@example.com"],
  ssn: ["123-45-6789", "987-65-4321"],
  address: ["123 Main St", "456 Elm St"],
  city: ["New York", "Los Angeles"],
  state: ["NY", "CA"],
  zip: ["10001", "90001"],
  phone: ["555-123-4567", "555-987-6543"],
  dob: ["01/01/1980", "12/31/1999"],
  compensation: ["100000", "250000"],
  department: ["Finance", "HR"],
  manager: ["Alice Boss", "Bob Supervisor"],
  bank: ["123456789", "987654321"],
  taxId: ["12-3456789", "98-7654321"],
  taxValue: ["5000", "10000"],
  visa: ["H1B", "L1"],
  demographics: ["Female", "Male"],
  transaction: ["T123", "T456"],
  grantDate: ["01/15/2020", "02/20/2021"],
  vestDate: ["01/15/2022", "02/20/2023"],
  exercisePrice: ["10.00", "20.00"],
  fmv: ["15.50", "22.75"],
  shares: ["500", "2000"]
};

// Flatten all synonyms into headers
const headers = Object.entries(PII_PATTERNS).flatMap(([cat, arr]) =>
  arr.map(h => ({ category: cat, header: h }))
);

// Generate rows of realistic dummy values
const rows = [0, 1].map(i =>
  headers.map(({ category, header }) => {
    const samples = categorySamples[category];
    if (samples) return samples[i % samples.length];
    return `TEST_${header.replace(/\s+/g, "_").toUpperCase()}`;
  })
);

// Build CSV string
let csv = headers.map(h => h.header).join(",") + "\n";
csv += rows.map(r => r.join(",")).join("\n");

// Write to file
fs.writeFileSync("pii_test.csv", csv, "utf8");

console.log("✅ Test file generated: pii_test.csv");
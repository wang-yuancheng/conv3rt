// import cors from 'cors';
// import * as dotenv from 'dotenv';
// import express from 'express';
// import fs from 'fs';
// import OpenAI from "openai";
// import { vision } from '@jigsawstack/vision';
// import path from 'path';

// const sample_response = `Revenue/Income, Revenue, Sales of trading goods, Wholesale Trade - Others  
// Revenue/Income, Other Income, Other Income  
// Cost/Expense, Cost of Sales, Cost of Sales for Merchandise Trade, Purchases For Merchandise Trade - Wholesale Merchandise - Others  
// Cost/Expense, Other Expenses, Other Expenses  
// Liability, Trade and Other Payables, Trade and Other Payables, Bank Charges and Fees  
// Cost/Expense, Administration and Other Expenses, Professional Service Charges, Company Incorporation Expenses  
// Cost/Expense, Administration and Other Expenses, Directors' Remuneration and CPF Contributions, Directors' Remuneration - Full-time/part-time Staff (Net CPF)  
// Cost/Expense, Administration and Other Expenses, Directors' Remuneration and CPF Contributions, Directors' Remuneration - Employer CPF Expense  
// Cost/Expense, Administration and Other Expenses, Directors' Benefits in Kind, Directors' Remuneration - Benefits in Kind (Net CPF)  
// Cost/Expense, Administration and Other Expenses, Professional Service Charges, Accounting, Audit, Tax and Secretarial Expenses  
// Cost/Expense, Administration and Other Expenses, Depreciation Expense, Depreciation of Other Assets  
// Cost/Expense, Administration and Other Expenses, Directors' Remuneration and CPF Contributions, Directors' Remuneration - Employer CPF Expense  
// Cost/Expense, Administration and Other Expenses, Office Administration Expenses, Expensed Assets  
// Cost/Expense, Marketing and Distribution Expenses, Meal and Entertainment Expenses, Meal and Entertainment Expenses  
// Cost/Expense, Marketing and Distribution Expenses, Transportation Expenses, Freight Out Expenses  
// Cost/Expense, Administration and Other Expenses, IT And Communication , Other IT and Communication Expenses  
// Cost/Expense, Administration and Other Expenses, Professional Service Charges, Legal Expenses  
// Cost/Expense, Administration and Other Expenses, Other Staff Costs, Other Employee Benefits - Medical expenses and insurance (non-regulatory)  
// Cost/Expense, Administration and Other Expenses, Professional Service Charges, Other Professional Service Expenses  
// Cost/Expense, Administration and Other Expenses, Office Administration Expenses, Other Office Administration Expenses   
// Cost/Expense, Administration and Other Expenses, Office Administration Expenses, Printing Expenses  
// Cost/Expense, Administration and Other Expenses, Other Staff Costs, Administration Office Staff Cost - Skill Development Fund  
// Cost/Expense, Administration and Other Expenses, Other Staff Costs, Other Employee Benefits - Expenses associated gambling and game of chances  
// Cost/Expense, Administration and Other Expenses, Employee Benefit Expenses, Staff Remuneration and CPF Contributions  
// Cost/Expense, Marketing and Distribution Expenses, Transportation Expenses, Public Transport Expenses  
// Cost/Expense, Marketing and Distribution Expenses, Overseas Travels, Other Travel Expenses  
// Revenue/Income, Other Income, Foreign exchange Gain, Unrealised Foreign Exchange Gain  
// Revenue/Income, Other Income, Foreign exchange Gain, Unrealised Foreign Exchange Gain  
// Revenue/Income, Other Income, Foreign exchange Gain, Unrealised Foreign Exchange Gain  
// Revenue/Income, Other Income, Foreign exchange Gain, Realised Foreign Exchange Gain  
// Cost/Expense, Income Tax Expense, Corporate Income Taxes, Income Tax Expense  
// Asset, Cash and Cash Equivalents, Bank Balances, Bank Balances  
// Asset, Cash and Cash Equivalents, Bank Balances, Bank Balances  
// Asset, Cash and Cash Equivalents, Bank Balances, Bank Balances  
// Asset, Cash and Cash Equivalents, Bank Balances, Bank Balances  
// Asset, Cash and Cash Equivalents, Bank Balances, Bank Balances  
// Asset, Trade and Other Receivables, Trade Receivables, Trade Receivables  
// Asset, Other Current Assets, Accrued Assets, Deferred Expenses  
// Asset, Property, plant and equipment, Office Machine and Equipment, Office Equipment  
// Asset, Property, plant and equipment, Office Machine and Equipment, Office Equipment  
// Asset, Property, plant and equipment, Office Machine and Equipment, Computers and Applications  
// Asset, Property, plant and equipment, Office Machine and Equipment, Computers and Applications  
// Liability, Trade and Other Payables, Trade and Other Payables, Trade Payables  
// Liability, Loans and Borrowings, Other Loans Payable, Other Loan Payable  
// Liability, Other Current Liabilities, Tax Related Payables, Goods and Services Tax Payable  
// Liability, Contract Liabilities, Contract Liabilities, Contract Liabilities  
// Liability, Other Current Liabilities, Accrued Liabilities, Accrued Expenses  
// Liability, Income Tax Payable, Income Tax Payable, Corporate Tax Payable  
// Equity, Retained Profit or Loss, Retained Earnings, Profit and Loss For The Period  
// Equity, Issued Capital, Paid Up Capital, Paid Up Capital - Ordinary Shares`;
// // Load environment variables from the server .env file
// dotenv.config();

// // Read classifications from JSON file
// const classificationsPath = path.join(process.cwd(), 'server', 'classifications.json');


// // Initialize OpenAI client
// const openai = new OpenAI({
//   apiKey: process.env.OPENAI_API_KEY
// });

// // Initialize JigsawStack Vision client
// const visionClient = vision(process.env.VITE_JIGSAWSTACK_API_KEY);

// const app = express();
// const port = process.env.PORT || 3000;

// // Configure CORS
// app.use(cors({
//   origin: ['http://localhost:5173', 'https://localhost:5173'],
//   methods: ['POST'],
//   allowedHeaders: ['Content-Type']
// }));

// app.use(express.json({ limit: '50mb' }));

// // Store extracted data
// let extractedData = [];

// function convertToJson(input) {
//   // Split the input into rows
//   const rows = input.split("\n");

//   // Convert each row into an array of values
//   const result = rows.map((row) => row.split(",").map((cell) => cell.trim()));

//   return result;
// }

// // Process Excel data
// app.post('/api/process', async (req, res) => {
//   res.json(convertToJson(sample_response));
//   return;
// });

// // Process PDF endpoint
// app.post('/api/process-pdf', async (req, res) => {
//   try {
//     const { pdfUrl } = req.body;
    
//     if (!pdfUrl) {
//       throw new Error('PDF URL is required');
//     }

//     // Extract text from PDF using JigsawStack VOCR
//     const result = await visionClient.extractText({
//       url: pdfUrl,
//       output: 'text'
//     });

//     if (!result.success) {
//       throw new Error('Failed to extract text from PDF');
//     }

//     // Process the extracted text into rows
//     const rows = result.data
//       .split('\n')
//       .filter(line => line.trim())
//       .map(line => line.split(',').map(cell => cell.trim()));

//     res.json(rows);
//   } catch (error) {
//     console.error('Error processing PDF:', error);
//     res.status(500).json({ error: error.message });
//   }
// });

// // Start server
// app.listen(port, () => {
//   console.log(`Server running at http://localhost:${port}\nAccepting requests from http://localhost:5173`);
// });
import cors from 'cors';
import * as dotenv from 'dotenv';
import express from 'express';
import fs from 'fs';
import OpenAI from "openai";
import path from 'path';
import ExcelJS from 'exceljs';
import { JigsawStack } from 'jigsawstack';

const sample_response = `Revenue/Income, Revenue, Sales of trading goods, Wholesale Trade - Others  
Revenue/Income, Other Income, Other Income  
Cost/Expense, Cost of Sales, Cost of Sales for Merchandise Trade, Purchases For Merchandise Trade - Wholesale Merchandise - Others  
Cost/Expense, Other Expenses, Other Expenses  
Liability, Trade and Other Payables, Trade and Other Payables, Bank Charges and Fees  
Cost/Expense, Administration and Other Expenses, Professional Service Charges, Company Incorporation Expenses  
Cost/Expense, Administration and Other Expenses, Directors' Remuneration and CPF Contributions, Directors' Remuneration - Full-time/part-time Staff (Net CPF)  
Cost/Expense, Administration and Other Expenses, Directors' Remuneration and CPF Contributions, Directors' Remuneration - Employer CPF Expense  
Cost/Expense, Administration and Other Expenses, Directors' Benefits in Kind, Directors' Remuneration - Benefits in Kind (Net CPF)  
Cost/Expense, Administration and Other Expenses, Professional Service Charges, Accounting, Audit, Tax and Secretarial Expenses  
Cost/Expense, Administration and Other Expenses, Depreciation Expense, Depreciation of Other Assets  
Cost/Expense, Administration and Other Expenses, Directors' Remuneration and CPF Contributions, Directors' Remuneration - Employer CPF Expense  
Cost/Expense, Administration and Other Expenses, Office Administration Expenses, Expensed Assets  
Cost/Expense, Marketing and Distribution Expenses, Meal and Entertainment Expenses, Meal and Entertainment Expenses  
Cost/Expense, Marketing and Distribution Expenses, Transportation Expenses, Freight Out Expenses  
Cost/Expense, Administration and Other Expenses, IT And Communication , Other IT and Communication Expenses  
Cost/Expense, Administration and Other Expenses, Professional Service Charges, Legal Expenses  
Cost/Expense, Administration and Other Expenses, Other Staff Costs, Other Employee Benefits - Medical expenses and insurance (non-regulatory)  
Cost/Expense, Administration and Other Expenses, Professional Service Charges, Other Professional Service Expenses  
Cost/Expense, Administration and Other Expenses, Office Administration Expenses, Other Office Administration Expenses   
Cost/Expense, Administration and Other Expenses, Office Administration Expenses, Printing Expenses  
Cost/Expense, Administration and Other Expenses, Other Staff Costs, Administration Office Staff Cost - Skill Development Fund  
Cost/Expense, Administration and Other Expenses, Other Staff Costs, Other Employee Benefits - Expenses associated gambling and game of chances  
Cost/Expense, Administration and Other Expenses, Employee Benefit Expenses, Staff Remuneration and CPF Contributions  
Cost/Expense, Marketing and Distribution Expenses, Transportation Expenses, Public Transport Expenses  
Cost/Expense, Marketing and Distribution Expenses, Overseas Travels, Other Travel Expenses  
Revenue/Income, Other Income, Foreign exchange Gain, Unrealised Foreign Exchange Gain  
Revenue/Income, Other Income, Foreign exchange Gain, Unrealised Foreign Exchange Gain  
Revenue/Income, Other Income, Foreign exchange Gain, Unrealised Foreign Exchange Gain  
Revenue/Income, Other Income, Foreign exchange Gain, Realised Foreign Exchange Gain  
Cost/Expense, Income Tax Expense, Corporate Income Taxes, Income Tax Expense  
Asset, Cash and Cash Equivalents, Bank Balances, Bank Balances  
Asset, Cash and Cash Equivalents, Bank Balances, Bank Balances  
Asset, Cash and Cash Equivalents, Bank Balances, Bank Balances  
Asset, Cash and Cash Equivalents, Bank Balances, Bank Balances  
Asset, Cash and Cash Equivalents, Bank Balances, Bank Balances  
Asset, Trade and Other Receivables, Trade Receivables, Trade Receivables  
Asset, Other Current Assets, Accrued Assets, Deferred Expenses  
Asset, Property, plant and equipment, Office Machine and Equipment, Office Equipment  
Asset, Property, plant and equipment, Office Machine and Equipment, Office Equipment  
Asset, Property, plant and equipment, Office Machine and Equipment, Computers and Applications  
Asset, Property, plant and equipment, Office Machine and Equipment, Computers and Applications  
Liability, Trade and Other Payables, Trade and Other Payables, Trade Payables  
Liability, Loans and Borrowings, Other Loans Payable, Other Loan Payable  
Liability, Other Current Liabilities, Tax Related Payables, Goods and Services Tax Payable  
Liability, Contract Liabilities, Contract Liabilities, Contract Liabilities  
Liability, Other Current Liabilities, Accrued Liabilities, Accrued Expenses  
Liability, Income Tax Payable, Income Tax Payable, Corporate Tax Payable  
Equity, Retained Profit or Loss, Retained Earnings, Profit and Loss For The Period  
Equity, Issued Capital, Paid Up Capital, Paid Up Capital - Ordinary Shares`;
// Load environment variables from the server .env file
dotenv.config();

// Read classifications from JSON file
const classificationsPath = path.join(process.cwd(), 'server', 'classifications.json');


// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});
const jigsawstack = JigsawStack({
  apiKey: process.env.VITE_JIGSAWSTACK_API_KEY
});

const app = express();
const port = process.env.PORT || 3000;

// Configure CORS
app.use(cors({
  origin: ['http://localhost:5173', 'https://localhost:5173'],
  methods: ['POST'],
  allowedHeaders: ['Content-Type']
}));

app.use(express.json({ limit: '50mb' }));

// Store extracted data
let extractedData = [];

function convertToJson(input) {
  // Split the input into rows
  const rows = input.split("\n");

  // Convert each row into an array of values
  const result = rows.map((row) => row.split(",").map((cell) => cell.trim()));

  return result;
}

// Process Excel data
app.post('/api/process', async (req, res) => {
  res.json(convertToJson(sample_response));
  return;
  try {
    // Extract values from first and fourth columns
    extractedData = [];
    const { data } = req.body;

    if (!Array.isArray(data)) {
      throw new Error('Invalid data format');
    }

    data.forEach((sheet) => {
      if (!Array.isArray(sheet.data)) {
        return;
      }

      // Skip the first row (headers) and process remaining rows
      for (let i = 1; i < sheet.data.length; i++) {
        const row = sheet.data[i];
        if (row && row.length >= 4) {
          const fourthValue = row[0]?.value || '';
          extractedData.push(`${fourthValue}`.trim());
        }
      }
    });

    console.log("Extracted Data:", extractedData)
    const classificationJSON = JSON.parse(
      fs.readFileSync(classificationsPath, "utf8")
    );
    const response = await openai.chat.completions.create({
      model: "gpt-4-turbo",
      messages: [
        {
          role: "system",
          content: "You are a professional accountant with expertise in financial statement classification. You have access to a comprehensive classification structure for trial balance entries. The structure is organized hierarchically as: {<account type>: {<primary classification>: {<secondary classification>: [<tertiary classification>]}}}.\n\nClassification Structure:\n" + JSON.stringify(classificationJSON, null, 2)
        },
        {
          role: "user",
          content: `Using the provided classification structure , classify each entry into its account type, primary, secondary, and tertiary classification. Return a response of ONLY valid comma-separated (CSV) list of classifications (in the format <account type>, <primary classification>, <secondary classification>, <tertiary classification>), maintaining the exact order of the input. \n\nEntries to classify:\n${extractedData.join(",")}`
        }
      ],
      temperature: 0.1,
      max_tokens: 1500
    });

    const classifications = response.choices[0].message.content.trim();
    console.log("OpenAI Response:", classifications);
    res.json(convertToJson(classifications));
  } catch (error) {
    console.error('Error processing data:', error);
    res.status(500).json({ error: 'Failed to process data' });
  }
});

// // Process PDF endpoint
// app.post('/api/process-pdf', async (req, res) => {
//   try {
//     const { pdfUrl } = req.body;
//     if (!pdfUrl) {
//       throw new Error('PDF URL is required');
//     }

//     const result = await jigsawstack.vision.vocr({
//       url: pdfUrl,
//       prompt: "Extract all text content"
//     });
    
//     if (!result || !result.context) {
//       throw new Error('Failed to extract text from PDF');
//     }

//     // Process the extracted text into rows
//     const rows = result.context
//       .split('\n')
//       .filter(line => line.trim())
//       .map(line => line.split(/[,|]/).map(cell => cell.trim()));


//     console.log("rows:"+rows)
//     // Create Excel workbook
//     const workbook = new ExcelJS.Workbook();
//     const worksheet = workbook.addWorksheet('Extracted Data');

//     // Add the data to the worksheet
//     rows.forEach(row => {
//       worksheet.addRow(row);
//     });

//     // Generate Excel file buffer
//     const buffer = await workbook.xlsx.writeBuffer();

//     console.log(buffer)
//     // Send the Excel file data
//     res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
//     res.send(buffer);
//   } catch (error) {
//     console.error('Error processing PDF:', error);
//     res.status(500).json({ error: error.message });
//   }
// });
// app.post('/api/process-pdf', async (req, res) => {
//   try {
//     const { pdfUrl } = req.body;
    
//     if (!pdfUrl) {
//       throw new Error('PDF URL is required');
//     }

//     const result = await jigsawstack.vision.vocr({
//       url: pdfUrl,
//       prompt: "Extract all text content "
//     });
//     console.log(result)
//     if (!result || !result.context) {
//       throw new Error('Failed to extract text from PDF');
//     }

//     // Step 1: Split the text by lines
//     const lines = result.context.split('\n');

//     // Step 2: Filter out empty lines
//     const filteredLines = lines.filter(line => line.trim());

//     // Step 3: Process each line, split by '|' and clean the data
//     const rows = filteredLines.map(line => {
//       const columns = line.split('|').map(cell => cell.trim());  // Split by '|' and remove extra spaces
//       return columns;
//     });

//     // Optional: Remove any rows that are not meaningful (e.g., "Total" row or empty rows)
//     const cleanedRows = rows.filter(row => row.length > 0 && row.some(cell => cell.trim()));

//     // Step 4: Send the cleaned rows as response
//     res.json(cleanedRows);
//   } catch (error) {
//     console.error('Error processing PDF:', error);
//     res.status(500).json({ error: error.message });
//   }
// });
app.post('/api/process-pdf', async (req, res) => {
  try {
    const { pdfUrl } = req.body;
    
    if (!pdfUrl) {
      throw new Error('PDF URL is required');
    }

    const result = await jigsawstack.vision.vocr({
      url: pdfUrl,
      prompt: "Extract all text content"
    });

    if (!result || !result.context) {
      throw new Error('Failed to extract text from PDF');
    }

    // Step 1: Split the text by lines
    const lines = result.context.split('\n');

    // Step 2: Filter out empty lines and dashed separator lines (lines that contain only dashes or "-----")
    const filteredLines = lines.filter(line => 
      line.trim() && !/^[-| ]+$/.test(line) // Remove lines with only dashes or spaces
    );

    // Step 3: Process each line, split by '|' and clean the data
    const rows = filteredLines.map(line => {
      const columns = line.split('|').map(cell => cell.trim());  // Split by '|' and remove extra spaces
      return columns;
    });

    // Optional: Remove any rows that are not meaningful (e.g., "Total" row or empty rows)
    const cleanedRows = rows.filter(row => row.length > 0 && row.some(cell => cell.trim()));

    // Step 4: Send the cleaned rows as response
    res.json(cleanedRows);
  } catch (error) {
    console.error('Error processing PDF:', error);
    res.status(500).json({ error: error.message });
  }
});

// Start server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}\nAccepting requests from http://localhost:5173`);
});
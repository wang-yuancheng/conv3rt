import cors from 'cors';
import * as dotenv from 'dotenv';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import OpenAI from "openai";
import ExcelJS from 'exceljs';
import { JigsawStack } from 'jigsawstack';
import fs from 'fs';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 3000;
const CLIENT_URL = process.env.NODE_ENV === 'production' 
  ? 'https://conv3rt.netlify.app'
  : ['http://localhost:5173', 'http://localhost:3000'];

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

const app = express();
const port = process.env.PORT || 3000;

// Configure CORS
app.use(cors({
  origin: Array.isArray(CLIENT_URL) ? CLIENT_URL : [CLIENT_URL],
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
  // res.json(convertToJson(sample_response));
  // return;
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
      
       for (let i = 0; i < sheet.data.length; i++) {
        const row = sheet.data[i];
       
        const fourthValue = row[0]?.value || '';
        extractedData.push(`${fourthValue}`.trim());
        
      }
    });

    console.log("Extracted Data:", extractedData.join(","))
    // console.log("Extracted Data:" + ${extractedData.join(",")})
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
          content: `Using the provided classification structure , classify each entry into its account type, primary, secondary, and tertiary classification. Return a response of ONLY valid comma-separated (CSV) list of classifications (in the format <entry name>, <account type>, <primary classification>, <secondary classification>, <tertiary classification>), maintaining the exact order of the input. \n\nEntries to classify: \n${extractedData.join(",")}`
        }
      ],
      temperature: 0.1,
      max_tokens: 1500
    });

    const classifications = response.choices[0].message.content.trim();
    console.log("OpenAI Response:", convertToJson(classifications));
    res.json(convertToJson(classifications));
  } catch (error) {
    console.error('Error processing data:', error);
    res.status(500).json({ error: 'Failed to process data' });
  }
});

app.post('/api/process-pdf', async (req, res) => {
  try {
    const { pdfUrl } = req.body;
    console.log('Processing PDF URL:', pdfUrl);

    if (!pdfUrl) {
      throw new Error('PDF URL is required');
    }

    // Initialize JigsawStack client
    const jigsawstack = JigsawStack({
      apiKey: process.env.VITE_JIGSAWSTACK_API_KEY
    });

    console.log('Extracting text from PDF...');
    const result = await jigsawstack.vision.vocr({
      url: pdfUrl,
      prompt: "Extract all text without any AI note by each row seperated by '\n' and each column seperated by |  "
    });

    console.log('VOCR Result:', result);
    
    if (!result || !result.context) {
      throw new Error('Failed to extract text from PDF');
    }

      // Step 1: 拆分成行
    const lines = result.context.split('\n');

    // Step 2: 初步处理每一行，按表格行或普通文本行分类
    const rawRows = lines
    .map(line => line.trim())
    .filter(line => {
      // 忽略空行 && 过滤仅由 -, |, 空格 组成的分割行
      return line !== '' && !/^[\-\|\s]+$/.test(line);
    })
    .map(line => {
      if (line.startsWith('|') && line.endsWith('|')) {
        const content = line.slice(1, -1);
        return content.split('|').map(cell => cell.trim());
      }
      return [line];
    });
    // Step 3: 找出最大列数
    const maxColumns = rawRows.reduce((max, row) => Math.max(max, row.length), 0);

    // Step 4: 补齐每一行，右侧填充 undefined（或空字符串）
    const normalizedRows = rawRows.map(row => {
      const filled = [...row];
      while (filled.length < maxColumns) {
        filled.push("");
      }
      return filled;
    });

    // Step 5: 输出结果
    console.log('Normalized Rows:', normalizedRows);
    res.json(normalizedRows);
    
  } catch (err) {
    console.error('Error processing PDF:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}\nAccepting requests from ${CLIENT_URL}`);
});    
import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';
import ExcelJS from 'exceljs';
import { JigsawStack } from "jigsawstack";

const app = express();
const PORT = process.env.PORT || 3000;
const jigsawstack = JigsawStack({
apiKey: "sk_f259a67a8f9a9abb344528d4c30045ba205954ea667ca68f72bfcb44ceb75d67feb45343a10acc8f4bb56c897ee27b1eeeee8d91ac26c7628a2815c680701cfb024A9aIy4oghSLBVF8mZf",
});

// Middleware
app.use(cors());
app.use(express.json());

// Process Excel file endpoint
app.post('/api/process', async (req, res) => {
  try {
    const { title, data } = req.body;

    // Extract and process Excel data
    const excelData = data.map(sheet => {
      const sheetData = {
        name: sheet.name,
        content: [],
        headers: []
      };

      // Extract headers from first row if it exists
      if (sheet.data.length > 0) {
        sheetData.headers = sheet.data[0].map(cell => cell.value?.toString() || '');
      }

      // Extract content from remaining rows
      for (let i = 1; i < sheet.data.length; i++) {
        const row = {};
        sheet.data[i].forEach((cell, index) => {
          const header = sheetData.headers[index] || `Column${index + 1}`;
          row[header] = cell.value;
        });
        sheetData.content.push(row);
      }

      return sheetData;
    });

    console.log('Processed Excel Data:', JSON.stringify(excelData, null, 2));
    
    const result = await jigsawstack.prompt_engine.create({
    prompt: "Tell me a story about {about}",
    inputs: [
    {
    key: "about",
    optional: false,
    initial_value: "Leaning Tower of Pisa",
    },
    ],
    return_prompt: "Return the result in a markdown format",
    prompt_guard: ["sexual_content", "defamation"],
    });

    res.json(result);
  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ error: 'Failed to process file' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
import express from 'express';
import cors from 'cors';
import { JigsawStack } from "jigsawstack";

const jigsawstack = JigsawStack({
apiKey: "sk_f259a67a8f9a9abb344528d4c30045ba205954ea667ca68f72bfcb44ceb75d67feb45343a10acc8f4bb56c897ee27b1eeeee8d91ac26c7628a2815c680701cfb024A9aIy4oghSLBVF8mZf",
});

const app = express();
const port = 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Store extracted data
let extractedData = [];

// Process Excel data
app.post('/api/process', async (req, res) => {
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
          extractedData.push({
            firstColumn: row[0]?.value || '',
            fourthColumn: row[3]?.value || ''
          });
        }
      }
    });

    console.log(JSON.stringify(extractedData, null, 2))
    
    let result = await jigsawstack.prompt_engine.create({
      prompt: "{context} You are given the following data:" + extractedData + "For each object in this array, deduce whether it is 1. 'Asset' 2. 'Liability' 3. 'Equity' 4. 'Revenue/Income' or 5. 'Cost/Expense'.",
      inputs: [
        {
           key: "context",
           optional: false,
           initial_value: "You are a professional accountant.",
        },
      ],
      return_prompt: "In your response, you must only return a raw, unformatted JSON string, without new lines or whitespaces, where it is also an array of JSON objects, and each JSON object must have a key called ‘Account Type’, and a value based on the most relevant classification choice.",
      prompt_guard: ["sexual_content", "defamation"],
    });
 
    result = await jigsawstack.prompt_engine.run({
      id: result.prompt_engine_id,
      input_values: {
        context: "You are a professional accountant.",
      },
    });

    res.json(result.result);
  } catch (error) {
    console.error('Error processing data:', error);
    res.status(500).json({ error: 'Failed to process data' });
  }
});

// Start server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
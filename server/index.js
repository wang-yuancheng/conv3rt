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

// Process Excel data
app.post('/api/process', async (req, res) => {
  try {
    let result = await jigsawstack.prompt_engine.create({
      prompt: "{question}" + "ABC company",
      inputs: [
        {
           key: "question",
           optional: false,
           initial_value: "Identify the name of the company that this data is from.",
        },
      ],
      return_prompt: "Return the result in a JSON format",
      prompt_guard: ["sexual_content", "defamation"],
    });
 
    result = await jigsawstack.prompt_engine.run({
      id: result.prompt_engine_id,
      input_values: {
        question: "Identify the name of the company that this data is from.",
      },
    });
 
    res.json(result);
  } catch (error) {
    console.error('Error processing data:', error);
    res.status(500).json({ error: 'Failed to process data' });
  }
});

// Start server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
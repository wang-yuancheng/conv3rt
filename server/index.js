import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';
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
    
    let result = await jigsawstack.prompt_engine.create({
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

    result = await jigsawstack.prompt_engine.run({
    id: result.prompt_engine_id,
    input_values: {
    about: "Leaning Tower of Pisa",
    },
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
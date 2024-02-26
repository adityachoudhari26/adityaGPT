import express from 'express';
import cors from 'cors';
import OpenAI from 'openai';
import dotenv from 'dotenv';
import { createSession } from 'better-sse';
dotenv.config();

const openai = new OpenAI({
    apiKey: process.env['OPENAI_API_KEY']
  });
  

const app = express();
app.use(express.json())
app.use(cors());
const PORT = 3000;

app.get('/', (req, res) => res.send('Hello World from Backend!'));

app.get('/api/prompt', async (req, res) => {
    const session = await createSession(req, res);
      if (!session.isConnected) throw new Error('Not connected');

    const { prompt } = req.query;
    prompt?.toString();


    const streamGPTResponse = openai.beta.chat.completions.stream({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "You are impersonating a 24 year old male software engineer who went to dartmouth. Make your answers such that if someone was talking to you, they would think they are talking to a 24 year old male software engineer. Feel free to make up answers."
          },
          {
            role: "user",
            content: prompt?.toString() ?? ''
          }
        ],
        stream: true
        });

    for await (const chunk of streamGPTResponse) {
        res.write(`data: ${chunk.choices[0]?.delta?.content ?? ''}\n\n`);
    }

    res.write('data:--ENDOFSTREAM--\n\n');
    res.end();
    streamGPTResponse.controller.abort();

    req.on('close', () => {
       streamGPTResponse.controller.abort();
       res.end();
    });
});

app.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
});

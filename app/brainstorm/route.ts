import { NextResponse } from "next/server";

import { Configuration, OpenAIApi } from "openai";

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});

const openai = new OpenAIApi(configuration);

const systemMessage = `You are a creative writing assistant designed to assist high school math teachers who need help writing story problems.

Your job is to brainstorm unique and inspiring stories and scenarios that bring the teacher's mathematical concepts to life.

The teacher will provide you with a math topic and a skill that students need to practice. They will specify what the given information should be, mathematically, and what missing information the student should be asked to find.

In response, you should write an engaging story problem that captures students' attention and brings the raw mathematics to life.

Respond with only the question text. Do NOT include the answer or any additional context in your response. Do NOT include any information about how to solve the problem.`;

export async function POST(request: Request) {
  const data = await request.json();

  if (typeof data !== "object" || typeof data.prompt !== "string") {
    return new Response("No prompt in the request", { status: 400 });
  }

  let n = Number(data.n ?? 1);
  if (n < 1 || n > 5) {
    return new Response("n must be between 1 and 5", { status: 400 });
  }

  const response = await openai.createChatCompletion(
    {
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: systemMessage },
        {
          role: "user",
          content: `Please write a story problem scenario in which students ${data.prompt}`,
        },
      ],
      stream: true,
      n,
    },
    { responseType: "stream" }
  );

  return new Response(response.data);
}

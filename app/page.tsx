"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import TextareaAutosize from "react-textarea-autosize";

interface Problem {
  id: string;
  index: number;
  content: string;
}

export default function Page() {
  const [prompt, setPrompt] = useState(
    "are provided with two side lengths and must find the third, missing side length using the Pythagorean Theorem."
  );

  const [loading, setLoading] = useState(false);

  const [problems, setProblems] = useState<Problem[]>([]);

  const setProblemContent = useCallback(
    (id: string, index: number, content: string) => {
      setProblems((problems) => {
        return problems.map((problem) => {
          if (problem.id === id && problem.index === index) {
            return { ...problem, content };
          }
          return problem;
        });
      });
    },
    []
  );

  const brainstorm = useCallback(async (n = 1) => {
    console.log("Loading...");
    setLoading(true);

    const response = await fetch("/brainstorm", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt: document.querySelector("textarea").value,
        n,
      }),
    });

    if (!response.ok) {
      setLoading(false);
      alert("There was an error completing your request.");
      throw new Error(response.statusText);
    }

    const data = response.body;
    console.log(data);
    if (!data) return;

    const reader = data.getReader();
    const decoder = new TextDecoder();

    let done = false;
    while (!done) {
      const { value, done: doneReading } = await reader.read();
      done = doneReading;
      const chunkValue = decoder.decode(value);

      console.log("Chunk:", chunkValue);

      const jsonChunks = chunkValue
        .split("\n")
        .filter(Boolean)
        .map((line) => line.slice(6))
        .filter((str) => str !== "[DONE]")
        .map((str) => JSON.parse(str));

      console.log("JSON chunks:", jsonChunks);

      setProblems((problems) => {
        const newProblems = problems.map((p) => ({ ...p }));

        for (const chunk of jsonChunks) {
          let problem = newProblems.find(
            (p) => p.id === chunk.id && p.index === chunk.choices[0].index
          );

          if (!problem) {
            problem = {
              id: chunk.id,
              index: chunk.choices[0].index,
              content: "",
            };
            newProblems.push(problem);
          }

          const content = chunk.choices[0].delta?.content;
          if (content) {
            problem.content += content;
          }
        }

        return newProblems;
      });
    }
    setLoading(false);
  }, []);

  return (
    <div className="font-serif w-screen h-screen overflow-hidden grid grid-rows-[auto,1fr]">
      <nav className="p-6 flex justify-between items-center border-b border-stone-300">
        <Link href="/">
          <h1 className="text-2xl font-bold">Story Problem Scribe</h1>
        </Link>
        <div>
          Made by{" "}
          <Link href="https://www.joshuapullen.com/" className="underline">
            Josh Pullen
          </Link>
        </div>
      </nav>
      <div className="grid grid-cols-2 grid-rows-1 overflow-hidden divide-x divide-stone-300">
        <div className="p-16 overflow-y-auto">
          <h2 className="text-3xl font-bold mb-4">Topic</h2>
          <p className="text-xl mb-2">
            Brainstorm story problems in which students...
          </p>
          <TextareaAutosize
            className="block italic bg-white text-xl rounded shadow w-full px-6 py-4 resize-none"
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
          />
          <div className="flex items-center space-x-4 my-8">
            <div className="flex-grow border-b border-stone-300" />
            <div className="divide-x divide-stone-700">
              <button
                className="bg-stone-800 hover:bg-stone-900 active:bg-stone-950 text-stone-100 text-lg px-6 py-2 rounded-l disabled:opacity-50"
                disabled={loading}
                onClick={() => brainstorm()}
              >
                {loading ? "Brainstorming..." : "Brainstorm"}
              </button>
              <button
                className="bg-stone-800 hover:bg-stone-900 active:bg-stone-950 text-stone-100 text-lg px-3 py-2 rounded-r disabled:opacity-50"
                disabled={loading}
                onClick={() => brainstorm(3)}
              >
                &times;3
              </button>
            </div>
            <div className="flex-grow border-b border-stone-300" />
          </div>
        </div>
        <div className="p-16 overflow-y-auto">
          <h2 className="text-3xl font-bold mb-4">Problems</h2>
          <div className="space-y-4">
            {problems.length === 0 && (
              <div className="text-stone-600 italic text-lg">
                Your story problems will appear here.
              </div>
            )}
            {problems.map((problem) => (
              <TextareaAutosize
                key={`${problem.id}___${problem.index}`}
                className="w-full bg-stone-300 text-stone-900 px-4 py-2 text-lg resize-none"
                value={problem.content}
                onChange={(event) => {
                  setProblemContent(
                    problem.id,
                    problem.index,
                    event.target.value
                  );
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

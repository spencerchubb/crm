// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

import process from "node:process";

// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts"

import { HumanMessage } from "npm:@langchain/core/messages";
import { ChatOpenAI, OpenAIEmbeddings } from "npm:@langchain/openai";

import { createClient } from "npm:@supabase/supabase-js";

const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // This is needed if you're planning to invoke your function from a browser.
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const input = await req.json();

  let output = {};

  console.log(req.url);
  if (req.url.includes("/hello")) {
    output = { message: "Hello from Functions!" };
  } else if (req.url.includes("/create-issue")) {
    output = await createIssue(input);
  } else if (req.url.includes("/embeddings")) {
    console.log("generating embeddings");
    try {
      output = await fetch("https://api.openai.com/v1/embeddings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${Deno.env.get("OPENAI_API_KEY")}`,
        },
        body: JSON.stringify({
          input: input.input,
          model: "text-embedding-3-large",
        }),
      }).then(res => res.json());
    } catch (error) {
      console.error(error);
    }
  }

  return new Response(
    JSON.stringify(output),
    {
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      }
    },
  )
});

async function createIssue(input: any): Promise<any> {
  const { title, description } = input;

  const embeddings = new OpenAIEmbeddings({
    apiKey: process.env.OPENAI_API_KEY,
    model: "text-embedding-3-large",
  });

  const embedding = await embeddings.embedQuery(`${title}\n\n${description}`);
  console.log(embedding);

  // Call get_similar_issues RPC
  const similarIssues = await supabase.rpc("get_similar_issues", {
    query_embedding: embedding,
    match_threshold: 0.5,
    match_count: 5,
  });
  console.log(similarIssues);

  if (similarIssues.data.length === 0) {
    return {
      similarIssues: [],
    };
  }

  const llm = new ChatOpenAI({
    apiKey: Deno.env.get("OPENAI_API_KEY"),
    model: "gpt-4o-mini",
  });
  const humanMessageContent = `You are a helpful issue summarizer. I am considering opening the following issue:
    
<new_issue>
${title}
${description}
</new_issue>

The following issues are similar to the one I am considering:

<similar_issues>
${similarIssues.data.map((issue: any, i: number) => `${i + 1}. ${issue.title}`).join("\n")}
</similar_issues>

Please provide a summary of the similar issues to help me determine if I should open the new issue or not. Be brief and to the point.
`;
  const humanMessage = new HumanMessage(humanMessageContent);
  const response = await llm.invoke([humanMessage]);
  console.log(response);

  return {
    response: response.content,
    similarIssues: similarIssues.data,
  };
}

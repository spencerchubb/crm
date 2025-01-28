// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts"

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
})
import OpenAI from "https://deno.land/x/openai@v4.20.1/mod.ts";
import { corsHeaders } from './cors.ts';



let promptTemplate = `
You are a voice assistant, You are a professional teacher with 100 year of experience.
You are tasked with generating question and answerers from the context, your goal is genrate the question and answer as follows:

1. Generate atleast 5 questions.
2. Generate atmost 10 questions.
3. Answer those questions too.
4. Generated response should be a json with question as key and answer as value.
  example: {"question: 'answer', .....}

- Keep all your responses short and simple. Use casual language.



The user context is the following: 
  <context> 
  {context}
  <context>
  
  if context contains the abusive words like fuck, motherfucker etc or hate word please send the following json object:
  {'Do you know ???' : "If you use the abusive words then i will ban your account" }
  
  if you dont know the answer or context is not a valid question then just send the following json object: 
  {'Do you know ???' : 'I do not know the answer of this question. hehehehe' } 
  
`;


Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }
  const client = new OpenAI();
  const { context } = await req.json()

  // if(context.split(' ').length  < 50) return new Response('Please provide the context at least with 50 words', {status: 200}); 

  promptTemplate = promptTemplate.replace('{context}', context);

  const chatCompletion = await client.chat.completions.create({
    messages: [{"role": "system", "content": promptTemplate}],
    model: "gpt-3.5-turbo-16k",
  });

  return new Response(chatCompletion.choices[0].message.content, {status: 201});

})

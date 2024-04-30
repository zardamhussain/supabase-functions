import { MongoClient } from "npm:mongodb@6";
import { corsHeaders } from './cors.ts';

const client = new MongoClient(Deno.env.get('MONGO_URL')!);
const dbName = "sample_mflix";


const generateEmbeddings = async (text: string) => {
  const res = await fetch(Deno.env.get('API_URL')!, {
      method: 'POST',
      headers: {
          'Authorization': `Bearer ${Deno.env.get('HF_TOKEN')!}`,
          'Content-Type': 'application/json'
      },
      body: JSON.stringify({ inputs: text })
  });

  if (res.ok) {
      return await res.json();
  }
  return [];

};


Deno.serve(async (req) => {

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  await client.connect();
  console.log("Connected successfully to server");

  try{
    const { query, number } = await req.json();
    
    const db = client.db(dbName);
    const collection = db.collection('movies');

    const res = await collection.aggregate([
      {'$vectorSearch' : {
          "queryVector" : await generateEmbeddings(query),
          'path' : 'plot_embedding',
          'numCandidates' : 100,
          'limit' : number,
          'index' : 'plot_search'

        }}
      ]).toArray()

      return new Response(
        JSON.stringify(res),{
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    status: 200,
        }
      );
  }
  catch(_err) {
    return new Response("Error",{
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
    
})
  
import { MongoClient } from "npm:mongodb@6";


const client = new MongoClient(Deno.env.get('MONGO_URL')!);
const dbName = "sample_mflix";
const db = client.db(dbName);


const generate_embeddings = async (text: string) => {
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



Deno.serve(async (_req) => {

  try{
    await client.connect();
    console.log("Connected successfully to server");
    
    const collection = db.collection("movies");
    
    const pipeline = [
        {
            '$match' : { '$and' : [
                { 'plot_embedding' : {  '$exists' : false }}, 
                {'plot' : {'$exists' : true}}
            ] }
        },
        
        { '$limit' : 20 }
    ];

    const res = await collection.aggregate(pipeline).toArray();

    let countOfEmbeddingDone = 0;

    for (const data of res) {
      const embeddings = await generate_embeddings(data['plot']);
      if(embeddings.length > 0) {
        data['plot_embedding'] = embeddings;
        await collection.replaceOne({_id : data['_id']}, data);
        countOfEmbeddingDone++;
      }     
    }


    client.close();

    return new Response(
      JSON.stringify(countOfEmbeddingDone),
      { headers: { "Content-Type": "application/json" } },
    )
  }
  catch(_err) {
    return new Response(
      JSON.stringify('Some error occured'),
      { headers: { "Content-Type": "application/json" } , status: 500}
    )
  }

})

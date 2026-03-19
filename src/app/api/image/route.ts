import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: process.env.OPENAI_BASE_URL,
});

export async function POST(req: Request) {
  try {
    const { prompt, model = "dall-e-3" } = await req.json();

    if (!prompt) {
      return new Response(JSON.stringify({ error: 'Prompt is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const response = await openai.images.generate({
      model: model,
      prompt: prompt,
      n: 1,
      size: "1024x1024",
    });

    const imageUrl = response.data?.[0]?.url;

    if (!imageUrl) {
      throw new Error('No image URL returned');
    }

    return new Response(JSON.stringify({ url: imageUrl }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Image Generation API Error:', error);
    return new Response(JSON.stringify({ error: error?.message || 'Failed to generate image' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

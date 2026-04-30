import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

export async function POST(req: NextRequest) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'OPENAI_API_KEY not set on server' }, { status: 500 });
  }

  let food: string;
  try {
    const body = await req.json();
    food = String(body.food ?? '').trim();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  if (!food) {
    return NextResponse.json({ error: 'No food description provided' }, { status: 400 });
  }

  const openai = new OpenAI({ apiKey });

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: 0.2,
      max_tokens: 280,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: `You are a precise nutrition expert. Given a food description, return ONLY valid JSON:
{"calories": <integer kcal best estimate>, "caloriesMin": <integer lower bound>, "caloriesMax": <integer upper bound>, "protein": <integer grams best estimate>, "proteinMin": <integer lower bound>, "proteinMax": <integer upper bound>, "description": "<short label under 60 chars>", "blurb": "<1-2 sentence insight about this meal's nutrition — macros, energy, what it's good for>"}
Sum all items if multiple foods are listed. Be accurate and realistic. Ranges should reflect realistic variation in portion size and preparation. Keep the blurb conversational and under 120 chars.`,
        },
        { role: 'user', content: food },
      ],
    });

    const raw = completion.choices[0].message.content ?? '{}';
    const parsed = JSON.parse(raw);

    const calories = Math.max(0, Math.round(Number(parsed.calories) || 0));
    const protein = Math.max(0, Math.round(Number(parsed.protein) || 0));
    return NextResponse.json({
      calories,
      caloriesMin: Math.max(0, Math.round(Number(parsed.caloriesMin) || calories)),
      caloriesMax: Math.max(0, Math.round(Number(parsed.caloriesMax) || calories)),
      protein,
      proteinMin: Math.max(0, Math.round(Number(parsed.proteinMin) || protein)),
      proteinMax: Math.max(0, Math.round(Number(parsed.proteinMax) || protein)),
      description: String(parsed.description || food).slice(0, 80),
      blurb: String(parsed.blurb || '').slice(0, 160),
    });
  } catch (err) {
    console.error('OpenAI error:', err);
    return NextResponse.json({ error: 'AI analysis failed' }, { status: 500 });
  }
}

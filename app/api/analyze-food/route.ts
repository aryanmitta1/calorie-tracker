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
      max_tokens: 120,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: `You are a precise nutrition expert. Given a food description, return ONLY valid JSON:
{"calories": <integer kcal>, "protein": <integer grams>, "description": "<short label under 60 chars>"}
Sum all items if multiple foods are listed. Be accurate and realistic.`,
        },
        { role: 'user', content: food },
      ],
    });

    const raw = completion.choices[0].message.content ?? '{}';
    const parsed = JSON.parse(raw);

    return NextResponse.json({
      calories: Math.max(0, Math.round(Number(parsed.calories) || 0)),
      protein: Math.max(0, Math.round(Number(parsed.protein) || 0)),
      description: String(parsed.description || food).slice(0, 80),
    });
  } catch (err) {
    console.error('OpenAI error:', err);
    return NextResponse.json({ error: 'AI analysis failed' }, { status: 500 });
  }
}

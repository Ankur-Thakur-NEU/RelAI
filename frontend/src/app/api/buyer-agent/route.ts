import { NextRequest, NextResponse } from "next/server";
import { getBuyerAgent } from "../../../../agents/singleton";

export async function POST(req: NextRequest) {
  const { input } = await req.json();

  if (!input) {
    return NextResponse.json({ error: "No input provided." }, { status: 400 });
  }

  const agent = await getBuyerAgent();
  const result = await agent.invoke({ input });

  return NextResponse.json({ result });
}

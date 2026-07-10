import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { code, instructions, language } = await req.json();

    if (!code || !instructions) {
      return Response.json({ error: 'Both code and instructions are required' }, { status: 400 });
    }

    const prompt = `You are an expert software engineer. Rewrite the following ${language || 'code'} according to these instructions:

INSTRUCTIONS:
${instructions}

ORIGINAL CODE:
\`\`\`
${code}
\`\`\`

Requirements:
1. Preserve all existing functionality unless instructed otherwise.
2. Follow best practices and clean code principles.
3. Keep the code production-ready and well-structured.
4. Do NOT add unnecessary dependencies.
5. If the code is React/JSX, ensure all imports resolve and hooks are used correctly.
6. Return ONLY the rewritten code — no explanations, no markdown fences, no commentary.

OUTPUT FORMAT:
Return a JSON object with:
- "rewritten_code": the full rewritten code as a string
- "summary": a brief 1-2 sentence summary of what changed`;

    const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: 'object',
        properties: {
          rewritten_code: { type: 'string' },
          summary: { type: 'string' }
        },
        required: ['rewritten_code', 'summary']
      },
      model: 'claude_sonnet_4_6'
    });

    const data = result.response || result.result || result;
    const rewritten_code = data.rewritten_code || (typeof data === 'string' ? data : '');
    const summary = data.summary || '';
    return Response.json({ rewritten_code, summary });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
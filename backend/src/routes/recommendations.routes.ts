import { Router } from 'express';
import { prisma } from '../config/prisma.js';
import { requireAuth, type AuthedRequest } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { getLLMProvider } from '../services/llm.provider.js';

const router = Router();
router.use(requireAuth);

// Build a behavior summary used by the heuristic and the LLM prompt.
async function buildSummary(userId: string) {
  const sevenDaysAgo = new Date(Date.now() - 7 * 86_400_000);
  const logs = await prisma.taskLog.findMany({
    where: { userId, date: { gte: sevenDaysAgo } },
    include: { task: true },
  });

  const byHour: Record<number, number> = {};
  for (const l of logs) {
    const h = new Date(l.date).getHours();
    byHour[h] = (byHour[h] ?? 0) + 1;
  }
  const bestHours = Object.entries(byHour)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([h]) => Number(h));

  const taskStats: Record<string, { task: typeof logs[0]['task']; hits: number }> = {};
  for (const l of logs) {
    const k = l.taskId;
    taskStats[k] = taskStats[k] ?? { task: l.task, hits: 0 };
    taskStats[k].hits += 1;
  }
  const struggling = Object.values(taskStats)
    .filter((s) => s.hits < 3)
    .map((s) => ({ taskId: s.task.id, title: s.task.title, hits: s.hits }));

  return { totalLogs: logs.length, bestHours, struggling };
}

function buildHeuristic(summary: Awaited<ReturnType<typeof buildSummary>>) {
  return {
    bestHours: summary.bestHours,
    struggling: summary.struggling.map((s) => ({
      taskId: s.taskId,
      title: s.title,
      suggestion: 'Try scheduling it earlier in the day with a 5-minute commitment.',
    })),
    weeklySummary: `You completed ${summary.totalLogs} task checks this week. Your peak hours are ${summary.bestHours.join(', ') || 'n/a'}.`,
    source: 'heuristic' as const,
  };
}

router.get(
  '/',
  asyncHandler(async (req: AuthedRequest, res) => {
    const summary = await buildSummary(req.userId!);

    // If the env has no LLM key, skip the call entirely.
    if (!process.env.LLM_API_KEY || process.env.LLM_PROVIDER === 'mock') {
      res.json(buildHeuristic(summary));
      return;
    }

    try {
      const llm = getLLMProvider();
      const prompt = `User activity over the last 7 days:
- Total task completions: ${summary.totalLogs}
- Best hours: ${summary.bestHours.join(', ') || 'unknown'}
- Tasks with low engagement (<3 checks): ${summary.struggling.map((s) => s.title).join(', ') || 'none'}

Return a JSON object with:
{
  "bestHours": number[],
  "struggling": [{"taskId": string, "title": string, "suggestion": string}],
  "weeklySummary": string  // one-sentence motivational summary
}`;

      const completion = await llm.complete({
        system:
          'You are Focus Friends’ coach. Be encouraging, specific, and concise. Respond with valid JSON only — no prose, no markdown.',
        user: prompt,
        maxTokens: 500,
        temperature: 0.5,
      });

      // Try to parse; if model added prose, attempt a tolerant extraction.
      const json = extractJson(completion.text);
      const parsed = JSON.parse(json);

      res.json({
        bestHours: parsed.bestHours ?? summary.bestHours,
        struggling: parsed.struggling ?? [],
        weeklySummary: parsed.weeklySummary ?? buildHeuristic(summary).weeklySummary,
        source: 'llm',
        model: completion.model,
      });
    } catch (err) {
      // LLM failed — degrade gracefully
      console.warn('⚠️ LLM recommender failed, falling back to heuristic:', err);
      res.json(buildHeuristic(summary));
    }
  }),
);

function extractJson(text: string): string {
  const first = text.indexOf('{');
  const last = text.lastIndexOf('}');
  if (first === -1 || last === -1) return '{}';
  return text.slice(first, last + 1);
}

export default router;

type RankedResult = { id: string; score: number; reason: string };

export async function semanticRank(
  jobDescription: string,
  entries: { id: string; kind: "experience" | "project"; text: string; techStack: string[] }[]
): Promise<RankedResult[]> {
  const res = await fetch(`${process.env.AGENT_URL}/rank`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      job_description: jobDescription,
      entries: entries.map((e) => ({ id: e.id, kind: e.kind, text: e.text, tech_stack: e.techStack })),
    }),
  });
  if (!res.ok) throw new Error(`agent rank failed: ${res.status}`);
  const data = await res.json();
  return data.rankings;
}

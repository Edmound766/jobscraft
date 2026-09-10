// src/lib/rank.ts
interface Experience {
  id: string;
  techStack: string[];
  bullets: string[];
}

interface Project {
  id: string;
  techStack: string[];
  description: string;
}

export function rankEntries(jobDescription: string, experiences: Experience[], projects: Project[]) {
  const jobWords = new Set(jobDescription.toLowerCase().match(/[a-z0-9+#.]+/g) ?? []);

  const score = (techStack: string[], text: string) => {
    const words = new Set([...techStack, ...text.toLowerCase().split(/\s+/)].map((w) => w.toLowerCase()));
    return [...words].filter((w) => jobWords.has(w)).length;
  };

  const rankedExperiences = [...experiences]
    .map((e) => ({ ...e, score: score(e.techStack, e.bullets.join(" ")) }))
    .sort((a, b) => b.score - a.score);

  const rankedProjects = [...projects]
    .map((p) => ({ ...p, score: score(p.techStack, p.description) }))
    .sort((a, b) => b.score - a.score);

  return { rankedExperiences, rankedProjects };
}

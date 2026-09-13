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

const STOPWORDS = new Set(["with", "and", "the", "for", "you", "your", "our", "work", "using"]);

export function rankEntries(jobDescription: string, experiences: Experience[], projects: Project[]) {
  const jobWords = new Set(
    (jobDescription.toLowerCase().match(/[a-z0-9+#.]+/g) ?? []).filter((w) => w.length > 3 && !STOPWORDS.has(w))
  );

  const score = (techStack: string[], text: string) => {
    const techMatches = techStack.filter((t) => jobWords.has(t.toLowerCase())).length;
    const proseWords = new Set(text.toLowerCase().split(/\s+/).filter((w) => w.length > 4 && !STOPWORDS.has(w)));
    const proseMatches = [...proseWords].filter((w) => jobWords.has(w)).length;

    // tech stack matches are the real signal — weight them far higher than incidental prose overlap
    return techMatches * 10 + proseMatches;
  };

  const rankedExperiences = [...experiences]
    .map((e) => ({ ...e, score: score(e.techStack, e.bullets.join(" ")) }))
    .sort((a, b) => b.score - a.score);

  const rankedProjects = [...projects]
    .map((p) => ({ ...p, score: score(p.techStack, p.description) }))
    .sort((a, b) => b.score - a.score);

  return { rankedExperiences, rankedProjects };
}

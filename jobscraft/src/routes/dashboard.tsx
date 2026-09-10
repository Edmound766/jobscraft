import { createFileRoute, redirect } from "@tanstack/solid-router";
import { createServerFn } from "@tanstack/solid-start";
import { createSignal, For, Show } from "solid-js";
import { createForm } from "@tanstack/solid-form";
import { useQuery, useQueryClient } from "@tanstack/solid-query";
import { createExperience, deleteExperience, listExperiences } from "~/lib/experience";
import { createProject, deleteProject, listProjects } from "~/lib/project";
import { createSkill, deleteSkill, listSkills } from "~/lib/skill";
import { requireUser } from "~/lib/session";

const ensureAuthenticated = createServerFn({ method: "GET" }).handler(async () => {
  await requireUser();
});

export const Route = createFileRoute("/dashboard")({
  beforeLoad: async () => {
    try {
      await ensureAuthenticated();
    } catch {
      throw redirect({ to: "/" });
    }
  },
  component: Dashboard,
});

function Dashboard() {
  return (
    <main style={{ "max-width": "760px", margin: "0 auto", padding: "48px 40px 96px" }}>
      <h1 style={{ "font-size": "30px", margin: "0 0 8px" }}>Dashboard</h1>
      <p style={{ color: "var(--graphite-soft)", "font-size": "15px", margin: "0 0 48px" }}>
        Your career repository — add it once, we'll match it to any role later.
      </p>
      <ExperiencesSection />
      <ProjectsSection />
      <SkillsSection />
    </main>
  );
}

function ExperiencesSection() {
  const queryClient = useQueryClient();
  const [isAdding, setIsAdding] = createSignal(false);
  const experiencesQuery = useQuery(() => ({
    queryKey: ["experiences"],
    queryFn: () => listExperiences(),
  }));

  const form = createForm(() => ({
    defaultValues: {
      title: "", company: "", startDate: "", endDate: "",
      bulletsRaw: "", techStackRaw: "",
    },
    onSubmit: async ({ value }) => {
      await createExperience({
        data: {
          title: value.title,
          company: value.company,
          startDate: value.startDate,
          endDate: value.endDate || undefined,
          bullets: value.bulletsRaw.split("\n").map((s) => s.trim()).filter(Boolean),
          techStack: value.techStackRaw.split(",").map((s) => s.trim()).filter(Boolean),
        },
      });
      queryClient.invalidateQueries({ queryKey: ["experiences"] });
      form.reset();
      setIsAdding(false);
    },
  }));

  const handleDelete = async (id: string) => {
    await deleteExperience({ data: id });
    queryClient.invalidateQueries({ queryKey: ["experiences"] });
  };

  return (
    <section class="ledger-section" style={{ "--section-accent": "var(--signal)" }}>
      <h2>Experience</h2>
      <div class="ledger-rule" />

      <Show
        when={(experiencesQuery.data ?? []).length > 0}
        fallback={<p class="ledger-empty">No experience yet — add your first role below.</p>}
      >
        <For each={experiencesQuery.data ?? []}>
          {(exp) => (
            <div class="ledger-row">
              <div class="ledger-row-main">
                <div class="ledger-row-title">{exp.title} — {exp.company}</div>
                <div class="ledger-row-meta">{exp.startDate} — {exp.endDate || "Present"}</div>
                <Show when={exp.bullets.length > 0}>
                  <ul class="ledger-row-bullets">
                    <For each={exp.bullets}>{(bullet) => <li>{bullet}</li>}</For>
                  </ul>
                </Show>
                <Show when={exp.techStack.length > 0}>
                  <div class="tag-row" style={{ "--tag-bg": "var(--signal-soft)" }}>
                    <For each={exp.techStack}>{(tech) => <span class="tag">{tech}</span>}</For>
                  </div>
                </Show>
              </div>
              <button class="remove-btn" onClick={() => handleDelete(exp.id)}>Remove</button>
            </div>
          )}
        </For>
      </Show>

      <Show
        when={isAdding()}
        fallback={
          <button class="add-toggle" onClick={() => setIsAdding(true)}>+ Add experience</button>
        }
      >
        <form class="add-form" onSubmit={(e) => { e.preventDefault(); form.handleSubmit(); }}>
          <div class="add-form-row">
            <form.Field name="title">
              {(field) => <input placeholder="Title" value={field().state.value} onInput={(e) => field().handleChange(e.currentTarget.value)} />}
            </form.Field>
            <form.Field name="company">
              {(field) => <input placeholder="Company" value={field().state.value} onInput={(e) => field().handleChange(e.currentTarget.value)} />}
            </form.Field>
          </div>
          <div class="add-form-row">
            <form.Field name="startDate">
              {(field) => <input placeholder="Start date" value={field().state.value} onInput={(e) => field().handleChange(e.currentTarget.value)} />}
            </form.Field>
            <form.Field name="endDate">
              {(field) => <input placeholder="End date (blank if current)" value={field().state.value} onInput={(e) => field().handleChange(e.currentTarget.value)} />}
            </form.Field>
          </div>
          <form.Field name="bulletsRaw">
            {(field) => <textarea placeholder="One bullet per line" value={field().state.value} onInput={(e) => field().handleChange(e.currentTarget.value)} />}
          </form.Field>
          <form.Field name="techStackRaw">
            {(field) => <input placeholder="Tech stack, comma separated" value={field().state.value} onInput={(e) => field().handleChange(e.currentTarget.value)} />}
          </form.Field>
          <div class="add-form-actions">
            <button type="submit" class="btn-primary">Add experience</button>
            <button type="button" class="add-toggle" style={{ padding: "0" }} onClick={() => setIsAdding(false)}>Cancel</button>
          </div>
        </form>
      </Show>
    </section>
  );
}

function ProjectsSection() {
  const queryClient = useQueryClient();
  const [isAdding, setIsAdding] = createSignal(false);
  const projectsQuery = useQuery(() => ({
    queryKey: ["projects"],
    queryFn: () => listProjects(),
  }));

  const form = createForm(() => ({
    defaultValues: {
      name: "", description: "", liveUrl: "", repoUrl: "",
      techStackRaw: "", metrics: "",
    },
    onSubmit: async ({ value }) => {
      await createProject({
        data: {
          name: value.name,
          description: value.description,
          liveUrl: value.liveUrl || undefined,
          repoUrl: value.repoUrl || undefined,
          techStack: value.techStackRaw.split(",").map((s) => s.trim()).filter(Boolean),
          metrics: value.metrics || undefined,
        },
      });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      form.reset();
      setIsAdding(false);
    },
  }));

  const handleDelete = async (id: string) => {
    await deleteProject({ data: id });
    queryClient.invalidateQueries({ queryKey: ["projects"] });
  };

  return (
    <section class="ledger-section" style={{ "--section-accent": "var(--ember)" }}>
      <h2>Projects</h2>
      <div class="ledger-rule" />

      <Show
        when={(projectsQuery.data ?? []).length > 0}
        fallback={<p class="ledger-empty">No projects yet — add your first one below.</p>}
      >
        <For each={projectsQuery.data ?? []}>
          {(proj) => (
            <div class="ledger-row">
              <div class="ledger-row-main">
                <div class="ledger-row-title">{proj.name}</div>
                <div class="ledger-row-meta">{proj.description}</div>
                <Show when={proj.techStack.length > 0}>
                  <div class="tag-row" style={{ "--tag-bg": "var(--ember-soft)" }}>
                    <For each={proj.techStack}>{(tech) => <span class="tag">{tech}</span>}</For>
                  </div>
                </Show>
                <Show when={proj.metrics}>
                  <div class="ledger-row-metric">{proj.metrics}</div>
                </Show>
                <Show when={proj.liveUrl || proj.repoUrl}>
                  <div class="ledger-row-links">
                    <Show when={proj.liveUrl}>
                      <a href={proj.liveUrl!} target="_blank" rel="noreferrer">Live</a>
                    </Show>
                    <Show when={proj.repoUrl}>
                      <a href={proj.repoUrl!} target="_blank" rel="noreferrer">Code</a>
                    </Show>
                  </div>
                </Show>
              </div>
              <button class="remove-btn" onClick={() => handleDelete(proj.id)}>Remove</button>
            </div>
          )}
        </For>
      </Show>

      <Show
        when={isAdding()}
        fallback={
          <button class="add-toggle" onClick={() => setIsAdding(true)}>+ Add project</button>
        }
      >
        <form class="add-form" onSubmit={(e) => { e.preventDefault(); form.handleSubmit(); }}>
          <form.Field name="name">
            {(field) => <input placeholder="Name" value={field().state.value} onInput={(e) => field().handleChange(e.currentTarget.value)} />}
          </form.Field>
          <form.Field name="description">
            {(field) => <textarea placeholder="Description" value={field().state.value} onInput={(e) => field().handleChange(e.currentTarget.value)} />}
          </form.Field>
          <div class="add-form-row">
            <form.Field name="liveUrl">
              {(field) => <input placeholder="Live URL" value={field().state.value} onInput={(e) => field().handleChange(e.currentTarget.value)} />}
            </form.Field>
            <form.Field name="repoUrl">
              {(field) => <input placeholder="Repo URL" value={field().state.value} onInput={(e) => field().handleChange(e.currentTarget.value)} />}
            </form.Field>
          </div>
          <div class="add-form-row">
            <form.Field name="techStackRaw">
              {(field) => <input placeholder="Tech stack, comma separated" value={field().state.value} onInput={(e) => field().handleChange(e.currentTarget.value)} />}
            </form.Field>
            <form.Field name="metrics">
              {(field) => <input placeholder="Metrics" value={field().state.value} onInput={(e) => field().handleChange(e.currentTarget.value)} />}
            </form.Field>
          </div>
          <div class="add-form-actions">
            <button type="submit" class="btn-primary">Add project</button>
            <button type="button" class="add-toggle" style={{ padding: "0" }} onClick={() => setIsAdding(false)}>Cancel</button>
          </div>
        </form>
      </Show>
    </section>
  );
}

function SkillsSection() {
  const queryClient = useQueryClient();
  const [isAdding, setIsAdding] = createSignal(false);
  const skillsQuery = useQuery(() => ({
    queryKey: ["skills"],
    queryFn: () => listSkills(),
  }));

  const form = createForm(() => ({
    defaultValues: { name: "" },
    onSubmit: async ({ value }) => {
      await createSkill({ data: { name: value.name } });
      queryClient.invalidateQueries({ queryKey: ["skills"] });
      form.reset();
      setIsAdding(false);
    },
  }));

  const handleDelete = async (id: string) => {
    await deleteSkill({ data: id });
    queryClient.invalidateQueries({ queryKey: ["skills"] });
  };

  return (
    <section class="ledger-section" style={{ "--section-accent": "var(--highlighter)" }}>
      <h2>Skills</h2>
      <div class="ledger-rule" />

      <Show
        when={(skillsQuery.data ?? []).length > 0}
        fallback={<p class="ledger-empty">No skills yet — add your first one below.</p>}
      >
        <div class="tag-row" style={{ "--tag-bg": "var(--highlighter-soft)", "margin-top": "0" }}>
          <For each={skillsQuery.data ?? []}>
            {(skill) => (
              <span class="tag tag-removable">
                {skill.name}
                <button
                  class="tag-remove"
                  aria-label={`Remove ${skill.name}`}
                  onClick={() => handleDelete(skill.id)}
                >
                  ×
                </button>
              </span>
            )}
          </For>
        </div>
      </Show>

      <Show
        when={isAdding()}
        fallback={
          <button class="add-toggle" onClick={() => setIsAdding(true)}>+ Add skill</button>
        }
      >
        <form class="add-form" onSubmit={(e) => { e.preventDefault(); form.handleSubmit(); }}>
          <form.Field name="name">
            {(field) => <input placeholder="Skill name" value={field().state.value} onInput={(e) => field().handleChange(e.currentTarget.value)} />}
          </form.Field>
          <div class="add-form-actions">
            <button type="submit" class="btn-primary">Add skill</button>
            <button type="button" class="add-toggle" style={{ padding: "0" }} onClick={() => setIsAdding(false)}>Cancel</button>
          </div>
        </form>
      </Show>
    </section>
  );
}

import { createFileRoute, Link, redirect } from "@tanstack/solid-router";
import { createServerFn } from "@tanstack/solid-start";
import { createSignal, For, Show } from "solid-js";
import { createForm } from "@tanstack/solid-form";
import { useQuery, useQueryClient } from "@tanstack/solid-query";
import { createExperience, deleteExperience, listExperiences, updateExperience } from "~/lib/experience";
import { createProject, deleteProject, listProjects, updateProject } from "~/lib/project";
import { createSkill, deleteSkill, listSkills, updateSkill } from "~/lib/skill";
import { requireUser } from "~/lib/session";

const ensureAuthenticated = createServerFn({ method: "GET" }).handler(async () => {
  await requireUser();
});

export const Route = createFileRoute("/dashboard")({
  beforeLoad: async () => {
    try {
      await ensureAuthenticated();
    } catch {
      throw redirect({ to: "/login" });
    }
  },
  head: () => ({ meta: [{ title: "Dashboard · jobscraft" }] }),
  component: Dashboard,
});

function Dashboard() {
  return (
    <main class="max-w-[760px] mx-auto pt-12 px-5 sm:px-10 pb-24">
      <h1 class="text-[28px] mb-2">Dashboard</h1>
      <p class="text-graphite-soft text-[15px] mb-6">
        Your career repository — add it once, we'll match it to any role later.
      </p>
      <div class="flex flex-wrap gap-3 mb-12">
        <Link to="/roles/new" class="btn-primary no-underline">
          Tailor for a role
        </Link>
        <Link to="/roles" class="btn-secondary no-underline">
          My roles
        </Link>
      </div>
      <ExperiencesSection />
      <ProjectsSection />
      <SkillsSection />
    </main>
  );
}

function ExperienceRow(props: {
  exp: Awaited<ReturnType<typeof listExperiences>>[number];
  onDelete: (id: string) => void;
}) {
  const queryClient = useQueryClient();
  const [editing, setEditing] = createSignal(false);
  const [isDeleting, setIsDeleting] = createSignal(false);

  const form = createForm(() => ({
    defaultValues: {
      title: props.exp.title,
      company: props.exp.company,
      startDate: props.exp.startDate,
      endDate: props.exp.endDate ?? "",
      bulletsRaw: props.exp.bullets.join("\n"),
      techStackRaw: props.exp.techStack.join(", "),
    },
    onSubmit: async ({ value }) => {
      await updateExperience({
        data: {
          id: props.exp.id,
          title: value.title,
          company: value.company,
          startDate: value.startDate,
          endDate: value.endDate || undefined,
          bullets: value.bulletsRaw.split("\n").map((s) => s.trim()).filter(Boolean),
          techStack: value.techStackRaw.split(",").map((s) => s.trim()).filter(Boolean),
        },
      });
      queryClient.invalidateQueries({ queryKey: ["experiences"] });
      setEditing(false);
    },
  }));
  const isSubmitting = form.useSelector((state) => state.isSubmitting);

  return (
    <Show
      when={!editing()}
      fallback={
        <form class="add-form" onSubmit={(e) => { e.preventDefault(); form.handleSubmit(); }}>
          <div class="add-form-row">
            <form.Field name="title">
              {(field) => <input class="input" placeholder="Title" value={field().state.value} onInput={(e) => field().handleChange(e.currentTarget.value)} />}
            </form.Field>
            <form.Field name="company">
              {(field) => <input class="input" placeholder="Company" value={field().state.value} onInput={(e) => field().handleChange(e.currentTarget.value)} />}
            </form.Field>
          </div>
          <div class="add-form-row">
            <form.Field name="startDate">
              {(field) => <input class="input" placeholder="Start date" type="date" value={field().state.value} onInput={(e) => field().handleChange(e.currentTarget.value)} />}
            </form.Field>
            <form.Field name="endDate">
              {(field) => <input class="input" placeholder="End date (blank if current)" type="date" value={field().state.value} onInput={(e) => field().handleChange(e.currentTarget.value)} />}
            </form.Field>
          </div>
          <form.Field name="bulletsRaw">
            {(field) => <textarea class="input" placeholder="One bullet per line" value={field().state.value} onInput={(e) => field().handleChange(e.currentTarget.value)} />}
          </form.Field>
          <form.Field name="techStackRaw">
            {(field) => <input class="input" placeholder="Tech stack, comma separated" value={field().state.value} onInput={(e) => field().handleChange(e.currentTarget.value)} />}
          </form.Field>
          <div class="add-form-actions">
            <button type="submit" class="btn-primary" disabled={isSubmitting()}>
              {isSubmitting() ? "Saving…" : "Save"}
            </button>
            <button type="button" class="btn-secondary" disabled={isSubmitting()} onClick={() => setEditing(false)}>Cancel</button>
          </div>
        </form>
      }
    >
      <div class="ledger-row">
        <div class="ledger-row-main">
          <div class="ledger-row-title">{props.exp.title} — {props.exp.company}</div>
          <div class="ledger-row-meta">{props.exp.startDate} — {props.exp.endDate || "Present"}</div>
          <Show when={props.exp.bullets.length > 0}>
            <ul class="ledger-row-bullets">
              <For each={props.exp.bullets}>{(bullet) => <li>{bullet}</li>}</For>
            </ul>
          </Show>
          <Show when={props.exp.techStack.length > 0}>
            <div class="tag-row" style={{ "--tag-bg": "var(--signal-soft)" }}>
              <For each={props.exp.techStack}>{(tech) => <span class="tag">{tech}</span>}</For>
            </div>
          </Show>
        </div>
        <div class="flex gap-2 shrink-0">
          <button class="btn-secondary" disabled={isDeleting()} onClick={() => setEditing(true)}>Edit</button>
          <button
            class="remove-btn"
            disabled={isDeleting()}
            onClick={async () => { setIsDeleting(true); await props.onDelete(props.exp.id); }}
          >
            {isDeleting() ? "Removing…" : "Remove"}
          </button>
        </div>
      </div>
    </Show>
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
  const isSubmitting = form.useSelector((state) => state.isSubmitting);

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
          {(exp) => <ExperienceRow exp={exp} onDelete={handleDelete} />}
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
              {(field) => <input placeholder="Start date" type="date" value={field().state.value} onInput={(e) => field().handleChange(e.currentTarget.value)} />}
            </form.Field>
            <form.Field name="endDate">
              {(field) => <input placeholder="End date (blank if current)" type="date" value={field().state.value} onInput={(e) => field().handleChange(e.currentTarget.value)} />}
            </form.Field>
          </div>
          <form.Field name="bulletsRaw">
            {(field) => <textarea placeholder="One bullet per line" value={field().state.value} onInput={(e) => field().handleChange(e.currentTarget.value)} />}
          </form.Field>
          <form.Field name="techStackRaw">
            {(field) => <input placeholder="Tech stack, comma separated" value={field().state.value} onInput={(e) => field().handleChange(e.currentTarget.value)} />}
          </form.Field>
          <div class="add-form-actions">
            <button type="submit" class="btn-primary" disabled={isSubmitting()}>
              {isSubmitting() ? "Adding…" : "Add experience"}
            </button>
            <button type="button" class="add-toggle p-0" disabled={isSubmitting()} onClick={() => setIsAdding(false)}>Cancel</button>
          </div>
        </form>
      </Show>
    </section>
  );
}

function ProjectRow(props: {
  proj: Awaited<ReturnType<typeof listProjects>>[number];
  onDelete: (id: string) => void;
}) {
  const queryClient = useQueryClient();
  const [editing, setEditing] = createSignal(false);
  const [isDeleting, setIsDeleting] = createSignal(false);

  const form = createForm(() => ({
    defaultValues: {
      name: props.proj.name,
      description: props.proj.description,
      liveUrl: props.proj.liveUrl ?? "",
      repoUrl: props.proj.repoUrl ?? "",
      techStackRaw: props.proj.techStack.join(", "),
      metrics: props.proj.metrics ?? "",
    },
    onSubmit: async ({ value }) => {
      await updateProject({
        data: {
          id: props.proj.id,
          name: value.name,
          description: value.description,
          liveUrl: value.liveUrl || undefined,
          repoUrl: value.repoUrl || undefined,
          techStack: value.techStackRaw.split(",").map((s) => s.trim()).filter(Boolean),
          metrics: value.metrics || undefined,
        },
      });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      setEditing(false);
    },
  }));
  const isSubmitting = form.useSelector((state) => state.isSubmitting);

  return (
    <Show
      when={!editing()}
      fallback={
        <form class="add-form" onSubmit={(e) => { e.preventDefault(); form.handleSubmit(); }}>
          <form.Field name="name">
            {(field) => <input class="input" placeholder="Name" value={field().state.value} onInput={(e) => field().handleChange(e.currentTarget.value)} />}
          </form.Field>
          <form.Field name="description">
            {(field) => <textarea class="input" placeholder="Description" value={field().state.value} onInput={(e) => field().handleChange(e.currentTarget.value)} />}
          </form.Field>
          <div class="add-form-row">
            <form.Field name="liveUrl">
              {(field) => <input class="input" placeholder="Live URL" value={field().state.value} onInput={(e) => field().handleChange(e.currentTarget.value)} />}
            </form.Field>
            <form.Field name="repoUrl">
              {(field) => <input class="input" placeholder="Repo URL" value={field().state.value} onInput={(e) => field().handleChange(e.currentTarget.value)} />}
            </form.Field>
          </div>
          <div class="add-form-row">
            <form.Field name="techStackRaw">
              {(field) => <input class="input" placeholder="Tech stack, comma separated" value={field().state.value} onInput={(e) => field().handleChange(e.currentTarget.value)} />}
            </form.Field>
            <form.Field name="metrics">
              {(field) => <input class="input" placeholder="Metrics" value={field().state.value} onInput={(e) => field().handleChange(e.currentTarget.value)} />}
            </form.Field>
          </div>
          <div class="add-form-actions">
            <button type="submit" class="btn-primary" disabled={isSubmitting()}>
              {isSubmitting() ? "Saving…" : "Save"}
            </button>
            <button type="button" class="btn-secondary" disabled={isSubmitting()} onClick={() => setEditing(false)}>Cancel</button>
          </div>
        </form>
      }
    >
      <div class="ledger-row">
        <div class="ledger-row-main">
          <div class="ledger-row-title">{props.proj.name}</div>
          <div class="ledger-row-meta">{props.proj.description}</div>
          <Show when={props.proj.techStack.length > 0}>
            <div class="tag-row" style={{ "--tag-bg": "var(--ember-soft)" }}>
              <For each={props.proj.techStack}>{(tech) => <span class="tag">{tech}</span>}</For>
            </div>
          </Show>
          <Show when={props.proj.metrics}>
            <div class="ledger-row-metric">{props.proj.metrics}</div>
          </Show>
          <Show when={props.proj.liveUrl || props.proj.repoUrl}>
            <div class="ledger-row-links">
              <Show when={props.proj.liveUrl}>
                <a href={props.proj.liveUrl!} target="_blank" rel="noreferrer">Live</a>
              </Show>
              <Show when={props.proj.repoUrl}>
                <a href={props.proj.repoUrl!} target="_blank" rel="noreferrer">Code</a>
              </Show>
            </div>
          </Show>
        </div>
        <div class="flex gap-2 shrink-0">
          <button class="btn-secondary" disabled={isDeleting()} onClick={() => setEditing(true)}>Edit</button>
          <button
            class="remove-btn"
            disabled={isDeleting()}
            onClick={async () => { setIsDeleting(true); await props.onDelete(props.proj.id); }}
          >
            {isDeleting() ? "Removing…" : "Remove"}
          </button>
        </div>
      </div>
    </Show>
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
  const isSubmitting = form.useSelector((state) => state.isSubmitting);

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
          {(proj) => <ProjectRow proj={proj} onDelete={handleDelete} />}
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
            <button type="submit" class="btn-primary" disabled={isSubmitting()}>
              {isSubmitting() ? "Adding…" : "Add project"}
            </button>
            <button type="button" class="add-toggle p-0" disabled={isSubmitting()} onClick={() => setIsAdding(false)}>Cancel</button>
          </div>
        </form>
      </Show>
    </section>
  );
}

function SkillRow(props: {
  skill: Awaited<ReturnType<typeof listSkills>>[number];
  onDelete: (id: string) => void;
}) {
  const queryClient = useQueryClient();
  const [editing, setEditing] = createSignal(false);
  const [isDeleting, setIsDeleting] = createSignal(false);

  const form = createForm(() => ({
    defaultValues: { name: props.skill.name },
    onSubmit: async ({ value }) => {
      await updateSkill({ data: { id: props.skill.id, name: value.name } });
      queryClient.invalidateQueries({ queryKey: ["skills"] });
      setEditing(false);
    },
  }));
  const isSubmitting = form.useSelector((state) => state.isSubmitting);

  return (
    <Show
      when={!editing()}
      fallback={
        <form
          onSubmit={(e) => { e.preventDefault(); form.handleSubmit(); }}
          class="inline-flex gap-1.5 items-center"
        >
          <form.Field name="name">
            {(field) => (
              <input
                class="input w-[140px]"
                value={field().state.value}
                onInput={(e) => field().handleChange(e.currentTarget.value)}
              />
            )}
          </form.Field>
          <button type="submit" class="btn-primary" disabled={isSubmitting()}>
            {isSubmitting() ? "Saving…" : "Save"}
          </button>
          <button type="button" class="btn-secondary" disabled={isSubmitting()} onClick={() => setEditing(false)}>Cancel</button>
        </form>
      }
    >
      <span class="tag tag-removable">
        {props.skill.name}
        <button
          class="tag-remove disabled:opacity-50"
          disabled={isDeleting()}
          aria-label={`Edit ${props.skill.name}`}
          onClick={() => setEditing(true)}
        >✎</button>
        <button
          class="tag-remove disabled:opacity-50"
          disabled={isDeleting()}
          aria-label={`Remove ${props.skill.name}`}
          onClick={async () => { setIsDeleting(true); await props.onDelete(props.skill.id); }}
        >×</button>
      </span>
    </Show>
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
  const isSubmitting = form.useSelector((state) => state.isSubmitting);

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
        <div class="tag-row mt-0" style={{ "--tag-bg": "var(--highlighter-soft)" }}>
          <For each={skillsQuery.data ?? []}>
            {(skill) => <SkillRow skill={skill} onDelete={handleDelete} />}
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
            <button type="submit" class="btn-primary" disabled={isSubmitting()}>
              {isSubmitting() ? "Adding…" : "Add skill"}
            </button>
            <button type="button" class="add-toggle p-0" disabled={isSubmitting()} onClick={() => setIsAdding(false)}>Cancel</button>
          </div>
        </form>
      </Show>
    </section>
  );
}

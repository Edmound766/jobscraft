import { createFileRoute, Link, redirect } from "@tanstack/solid-router";
import { createServerFn } from "@tanstack/solid-start";
import { createSignal, For, Show } from "solid-js";
import { createForm } from "@tanstack/solid-form";
import { useQuery, useQueryClient } from "@tanstack/solid-query";
import { createExperience, deleteExperience, listExperiences, updateExperience } from "~/lib/experience";
import { createProject, deleteProject, listProjects, updateProject } from "~/lib/project";
import { createSkill, deleteSkill, listSkills, updateSkill } from "~/lib/skill";
import { createEducation, deleteEducation, listEducation, updateEducation } from "~/lib/education";
import { createCertification, deleteCertification, listCertifications, updateCertification } from "~/lib/certification";
import { getProfile, updateProfile } from "~/lib/profile";
import { requireUser } from "~/lib/session";

const ensureAuthenticated = createServerFn({ method: "GET" }).handler(async () => {
  await requireUser();
});

export const Route = createFileRoute("/_app/dashboard")({
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
      <ProfileSection />
      <OnboardingChecklist />
      <ExperiencesSection />
      <ProjectsSection />
      <EducationSection />
      <CertificationsSection />
      <SkillsSection />
    </main>
  );
}

function ProfileSection() {
  const [editing, setEditing] = createSignal(false);
  const profileQuery = useQuery(() => ({
    queryKey: ["profile"],
    queryFn: () => getProfile(),
  }));

  return (
    <section class="ledger-section" style={{ "--section-accent": "var(--signal)" }}>
      <h2>Professional summary</h2>
      <div class="ledger-rule" />
      <Show
        when={!editing()}
        fallback={
          <ProfileSummaryForm
            initialSummary={profileQuery.data?.summary ?? ""}
            onDone={() => setEditing(false)}
          />
        }
      >
        <Show
          when={profileQuery.data?.summary}
          fallback={<button class="add-toggle" onClick={() => setEditing(true)}>+ Add a professional summary</button>}
        >
          <p class="text-[15px] leading-[1.6] mb-2 [overflow-wrap:anywhere]">{profileQuery.data?.summary}</p>
          <button class="add-toggle p-0" onClick={() => setEditing(true)}>Edit</button>
        </Show>
      </Show>
    </section>
  );
}

function ProfileSummaryForm(props: { initialSummary: string; onDone: () => void }) {
  const queryClient = useQueryClient();
  const form = createForm(() => ({
    defaultValues: { summary: props.initialSummary },
    onSubmit: async ({ value }) => {
      await updateProfile({ data: { summary: value.summary } });
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      props.onDone();
    },
  }));
  const isSubmitting = form.useSelector((state) => state.isSubmitting);

  return (
    <form class="add-form" onSubmit={(e) => { e.preventDefault(); form.handleSubmit(); }}>
      <form.Field name="summary">
        {(field) => (
          <textarea
            class="input"
            placeholder="A couple of sentences about who you are and what you do…"
            value={field().state.value}
            onInput={(e) => field().handleChange(e.currentTarget.value)}
          />
        )}
      </form.Field>
      <div class="add-form-actions">
        <button type="submit" class="btn-primary" disabled={isSubmitting()}>
          {isSubmitting() ? "Saving…" : "Save"}
        </button>
        <button type="button" class="add-toggle p-0" disabled={isSubmitting()} onClick={props.onDone}>Cancel</button>
      </div>
    </form>
  );
}

function OnboardingChecklist() {
  const experiencesQuery = useQuery(() => ({
    queryKey: ["experiences"],
    queryFn: () => listExperiences(),
  }));
  const projectsQuery = useQuery(() => ({
    queryKey: ["projects"],
    queryFn: () => listProjects(),
  }));
  const skillsQuery = useQuery(() => ({
    queryKey: ["skills"],
    queryFn: () => listSkills(),
  }));

  const stillLoading = () =>
    experiencesQuery.isPending || projectsQuery.isPending || skillsQuery.isPending;

  const hasAnyData = () =>
    (experiencesQuery.data?.length ?? 0) > 0 ||
    (projectsQuery.data?.length ?? 0) > 0 ||
    (skillsQuery.data?.length ?? 0) > 0;

  return (
    <Show when={!stillLoading() && !hasAnyData()}>
      <div class="bg-vellum-deep rounded-[3px] px-5 py-4 mb-10">
        <p class="text-[14px] font-semibold mb-2">Get started</p>
        <ol class="text-[14px] text-graphite-soft pl-5 flex flex-col gap-1">
          <li>Add your experience and projects below — this is what gets matched to roles.</li>
          <li>Add a few skills for quick keyword matching.</li>
          <li>
            Then <Link to="/roles/new" class="underline">tailor a role</Link> from a job description.
          </li>
        </ol>
      </div>
    </Show>
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

function EducationRow(props: {
  edu: Awaited<ReturnType<typeof listEducation>>[number];
  onDelete: (id: string) => void;
}) {
  const queryClient = useQueryClient();
  const [editing, setEditing] = createSignal(false);
  const [isDeleting, setIsDeleting] = createSignal(false);

  const form = createForm(() => ({
    defaultValues: {
      school: props.edu.school,
      degree: props.edu.degree,
      fieldOfStudy: props.edu.fieldOfStudy ?? "",
      startDate: props.edu.startDate,
      endDate: props.edu.endDate ?? "",
    },
    onSubmit: async ({ value }) => {
      await updateEducation({
        data: {
          id: props.edu.id,
          school: value.school,
          degree: value.degree,
          fieldOfStudy: value.fieldOfStudy || undefined,
          startDate: value.startDate,
          endDate: value.endDate || undefined,
        },
      });
      queryClient.invalidateQueries({ queryKey: ["education"] });
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
            <form.Field name="school">
              {(field) => <input class="input" placeholder="School" value={field().state.value} onInput={(e) => field().handleChange(e.currentTarget.value)} />}
            </form.Field>
            <form.Field name="degree">
              {(field) => <input class="input" placeholder="Degree" value={field().state.value} onInput={(e) => field().handleChange(e.currentTarget.value)} />}
            </form.Field>
          </div>
          <form.Field name="fieldOfStudy">
            {(field) => <input class="input" placeholder="Field of study (optional)" value={field().state.value} onInput={(e) => field().handleChange(e.currentTarget.value)} />}
          </form.Field>
          <div class="add-form-row">
            <form.Field name="startDate">
              {(field) => <input class="input" placeholder="Start date" type="date" value={field().state.value} onInput={(e) => field().handleChange(e.currentTarget.value)} />}
            </form.Field>
            <form.Field name="endDate">
              {(field) => <input class="input" placeholder="End date (blank if in progress)" type="date" value={field().state.value} onInput={(e) => field().handleChange(e.currentTarget.value)} />}
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
          <div class="ledger-row-title">{props.edu.degree} — {props.edu.school}</div>
          <div class="ledger-row-meta">
            {props.edu.fieldOfStudy ? `${props.edu.fieldOfStudy} · ` : ""}
            {props.edu.startDate} — {props.edu.endDate || "In progress"}
          </div>
        </div>
        <div class="flex gap-2 shrink-0">
          <button class="btn-secondary" disabled={isDeleting()} onClick={() => setEditing(true)}>Edit</button>
          <button
            class="remove-btn"
            disabled={isDeleting()}
            onClick={async () => { setIsDeleting(true); await props.onDelete(props.edu.id); }}
          >
            {isDeleting() ? "Removing…" : "Remove"}
          </button>
        </div>
      </div>
    </Show>
  );
}

function EducationSection() {
  const queryClient = useQueryClient();
  const [isAdding, setIsAdding] = createSignal(false);
  const educationQuery = useQuery(() => ({
    queryKey: ["education"],
    queryFn: () => listEducation(),
  }));

  const form = createForm(() => ({
    defaultValues: { school: "", degree: "", fieldOfStudy: "", startDate: "", endDate: "" },
    onSubmit: async ({ value }) => {
      await createEducation({
        data: {
          school: value.school,
          degree: value.degree,
          fieldOfStudy: value.fieldOfStudy || undefined,
          startDate: value.startDate,
          endDate: value.endDate || undefined,
        },
      });
      queryClient.invalidateQueries({ queryKey: ["education"] });
      form.reset();
      setIsAdding(false);
    },
  }));
  const isSubmitting = form.useSelector((state) => state.isSubmitting);

  const handleDelete = async (id: string) => {
    await deleteEducation({ data: id });
    queryClient.invalidateQueries({ queryKey: ["education"] });
  };

  return (
    <section class="ledger-section" style={{ "--section-accent": "var(--signal)" }}>
      <h2>Education</h2>
      <div class="ledger-rule" />

      <Show
        when={(educationQuery.data ?? []).length > 0}
        fallback={<p class="ledger-empty">No education yet — add your first one below.</p>}
      >
        <For each={educationQuery.data ?? []}>
          {(edu) => <EducationRow edu={edu} onDelete={handleDelete} />}
        </For>
      </Show>

      <Show
        when={isAdding()}
        fallback={
          <button class="add-toggle" onClick={() => setIsAdding(true)}>+ Add education</button>
        }
      >
        <form class="add-form" onSubmit={(e) => { e.preventDefault(); form.handleSubmit(); }}>
          <div class="add-form-row">
            <form.Field name="school">
              {(field) => <input placeholder="School" value={field().state.value} onInput={(e) => field().handleChange(e.currentTarget.value)} />}
            </form.Field>
            <form.Field name="degree">
              {(field) => <input placeholder="Degree" value={field().state.value} onInput={(e) => field().handleChange(e.currentTarget.value)} />}
            </form.Field>
          </div>
          <form.Field name="fieldOfStudy">
            {(field) => <input placeholder="Field of study (optional)" value={field().state.value} onInput={(e) => field().handleChange(e.currentTarget.value)} />}
          </form.Field>
          <div class="add-form-row">
            <form.Field name="startDate">
              {(field) => <input placeholder="Start date" type="date" value={field().state.value} onInput={(e) => field().handleChange(e.currentTarget.value)} />}
            </form.Field>
            <form.Field name="endDate">
              {(field) => <input placeholder="End date (blank if in progress)" type="date" value={field().state.value} onInput={(e) => field().handleChange(e.currentTarget.value)} />}
            </form.Field>
          </div>
          <div class="add-form-actions">
            <button type="submit" class="btn-primary" disabled={isSubmitting()}>
              {isSubmitting() ? "Adding…" : "Add education"}
            </button>
            <button type="button" class="add-toggle p-0" disabled={isSubmitting()} onClick={() => setIsAdding(false)}>Cancel</button>
          </div>
        </form>
      </Show>
    </section>
  );
}

function CertificationRow(props: {
  cert: Awaited<ReturnType<typeof listCertifications>>[number];
  onDelete: (id: string) => void;
}) {
  const queryClient = useQueryClient();
  const [editing, setEditing] = createSignal(false);
  const [isDeleting, setIsDeleting] = createSignal(false);

  const form = createForm(() => ({
    defaultValues: {
      name: props.cert.name,
      issuer: props.cert.issuer,
      issueDate: props.cert.issueDate ?? "",
      credentialUrl: props.cert.credentialUrl ?? "",
    },
    onSubmit: async ({ value }) => {
      await updateCertification({
        data: {
          id: props.cert.id,
          name: value.name,
          issuer: value.issuer,
          issueDate: value.issueDate || undefined,
          credentialUrl: value.credentialUrl || undefined,
        },
      });
      queryClient.invalidateQueries({ queryKey: ["certifications"] });
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
            <form.Field name="name">
              {(field) => <input class="input" placeholder="Certification name" value={field().state.value} onInput={(e) => field().handleChange(e.currentTarget.value)} />}
            </form.Field>
            <form.Field name="issuer">
              {(field) => <input class="input" placeholder="Issuer" value={field().state.value} onInput={(e) => field().handleChange(e.currentTarget.value)} />}
            </form.Field>
          </div>
          <div class="add-form-row">
            <form.Field name="issueDate">
              {(field) => <input class="input" placeholder="Issue date (optional)" type="date" value={field().state.value} onInput={(e) => field().handleChange(e.currentTarget.value)} />}
            </form.Field>
            <form.Field name="credentialUrl">
              {(field) => <input class="input" placeholder="Credential URL (optional)" value={field().state.value} onInput={(e) => field().handleChange(e.currentTarget.value)} />}
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
          <div class="ledger-row-title">{props.cert.name} — {props.cert.issuer}</div>
          <Show when={props.cert.issueDate}>
            <div class="ledger-row-meta">{props.cert.issueDate}</div>
          </Show>
          <Show when={props.cert.credentialUrl}>
            <div class="ledger-row-links">
              <a href={props.cert.credentialUrl!} target="_blank" rel="noreferrer">Credential</a>
            </div>
          </Show>
        </div>
        <div class="flex gap-2 shrink-0">
          <button class="btn-secondary" disabled={isDeleting()} onClick={() => setEditing(true)}>Edit</button>
          <button
            class="remove-btn"
            disabled={isDeleting()}
            onClick={async () => { setIsDeleting(true); await props.onDelete(props.cert.id); }}
          >
            {isDeleting() ? "Removing…" : "Remove"}
          </button>
        </div>
      </div>
    </Show>
  );
}

function CertificationsSection() {
  const queryClient = useQueryClient();
  const [isAdding, setIsAdding] = createSignal(false);
  const certificationsQuery = useQuery(() => ({
    queryKey: ["certifications"],
    queryFn: () => listCertifications(),
  }));

  const form = createForm(() => ({
    defaultValues: { name: "", issuer: "", issueDate: "", credentialUrl: "" },
    onSubmit: async ({ value }) => {
      await createCertification({
        data: {
          name: value.name,
          issuer: value.issuer,
          issueDate: value.issueDate || undefined,
          credentialUrl: value.credentialUrl || undefined,
        },
      });
      queryClient.invalidateQueries({ queryKey: ["certifications"] });
      form.reset();
      setIsAdding(false);
    },
  }));
  const isSubmitting = form.useSelector((state) => state.isSubmitting);

  const handleDelete = async (id: string) => {
    await deleteCertification({ data: id });
    queryClient.invalidateQueries({ queryKey: ["certifications"] });
  };

  return (
    <section class="ledger-section" style={{ "--section-accent": "var(--ember)" }}>
      <h2>Certifications</h2>
      <div class="ledger-rule" />

      <Show
        when={(certificationsQuery.data ?? []).length > 0}
        fallback={<p class="ledger-empty">No certifications yet — add your first one below.</p>}
      >
        <For each={certificationsQuery.data ?? []}>
          {(cert) => <CertificationRow cert={cert} onDelete={handleDelete} />}
        </For>
      </Show>

      <Show
        when={isAdding()}
        fallback={
          <button class="add-toggle" onClick={() => setIsAdding(true)}>+ Add certification</button>
        }
      >
        <form class="add-form" onSubmit={(e) => { e.preventDefault(); form.handleSubmit(); }}>
          <div class="add-form-row">
            <form.Field name="name">
              {(field) => <input placeholder="Certification name" value={field().state.value} onInput={(e) => field().handleChange(e.currentTarget.value)} />}
            </form.Field>
            <form.Field name="issuer">
              {(field) => <input placeholder="Issuer" value={field().state.value} onInput={(e) => field().handleChange(e.currentTarget.value)} />}
            </form.Field>
          </div>
          <div class="add-form-row">
            <form.Field name="issueDate">
              {(field) => <input placeholder="Issue date (optional)" type="date" value={field().state.value} onInput={(e) => field().handleChange(e.currentTarget.value)} />}
            </form.Field>
            <form.Field name="credentialUrl">
              {(field) => <input placeholder="Credential URL (optional)" value={field().state.value} onInput={(e) => field().handleChange(e.currentTarget.value)} />}
            </form.Field>
          </div>
          <div class="add-form-actions">
            <button type="submit" class="btn-primary" disabled={isSubmitting()}>
              {isSubmitting() ? "Adding…" : "Add certification"}
            </button>
            <button type="button" class="add-toggle p-0" disabled={isSubmitting()} onClick={() => setIsAdding(false)}>Cancel</button>
          </div>
        </form>
      </Show>
    </section>
  );
}

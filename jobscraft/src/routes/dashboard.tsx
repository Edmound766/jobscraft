import { createFileRoute, redirect } from "@tanstack/solid-router";
import { createServerFn } from "@tanstack/solid-start";
import { For } from "solid-js";
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
      throw redirect({ to: "/demo/better-auth" });
    }
  },
  component: Dashboard,
});

function Dashboard() {
  return (
    <div>
      <h1>Dashboard</h1>
      <ExperiencesSection />
      <ProjectsSection />
      <SkillsSection />
    </div>
  );
}

function ExperiencesSection() {
  const queryClient = useQueryClient();
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
          bullets: value.bulletsRaw.split("\n").filter(Boolean),
          techStack: value.techStackRaw.split(",").map((s) => s.trim()).filter(Boolean),
        },
      });
      queryClient.invalidateQueries({ queryKey: ["experiences"] });
      form.reset();
    },
  }));

  const handleDelete = async (id: string) => {
    await deleteExperience({ data: id });
    queryClient.invalidateQueries({ queryKey: ["experiences"] });
  };

  return (
    <div>
      <h2>Experience</h2>

      <For each={experiencesQuery.data ?? []}>
        {(exp) => (
          <div>
            <strong>{exp.title}</strong> — {exp.company}
            <button onClick={() => handleDelete(exp.id)}>Delete</button>
          </div>
        )}
      </For>

      <form onSubmit={(e) => { e.preventDefault(); form.handleSubmit(); }}>
        <form.Field name="title">
          {(field) => <input placeholder="Title" value={field().state.value} onInput={(e) => field().handleChange(e.currentTarget.value)} />}
        </form.Field>
        <form.Field name="company">
          {(field) => <input placeholder="Company" value={field().state.value} onInput={(e) => field().handleChange(e.currentTarget.value)} />}
        </form.Field>
        <form.Field name="startDate">
          {(field) => <input placeholder="Start date" value={field().state.value} onInput={(e) => field().handleChange(e.currentTarget.value)} />}
        </form.Field>
        <form.Field name="endDate">
          {(field) => <input placeholder="End date (blank if current)" value={field().state.value} onInput={(e) => field().handleChange(e.currentTarget.value)} />}
        </form.Field>
        <form.Field name="bulletsRaw">
          {(field) => <textarea placeholder="One bullet per line" value={field().state.value} onInput={(e) => field().handleChange(e.currentTarget.value)} />}
        </form.Field>
        <form.Field name="techStackRaw">
          {(field) => <input placeholder="Tech stack, comma separated" value={field().state.value} onInput={(e) => field().handleChange(e.currentTarget.value)} />}
        </form.Field>
        <button type="submit">Add experience</button>
      </form>
    </div>
  );
}

function ProjectsSection() {
  const queryClient = useQueryClient();
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
    },
  }));

  const handleDelete = async (id: string) => {
    await deleteProject({ data: id });
    queryClient.invalidateQueries({ queryKey: ["projects"] });
  };

  return (
    <div>
      <h2>Projects</h2>

      <For each={projectsQuery.data ?? []}>
        {(proj) => (
          <div>
            <strong>{proj.name}</strong> — {proj.description}
            <button onClick={() => handleDelete(proj.id)}>Delete</button>
          </div>
        )}
      </For>

      <form onSubmit={(e) => { e.preventDefault(); form.handleSubmit(); }}>
        <form.Field name="name">
          {(field) => <input placeholder="Name" value={field().state.value} onInput={(e) => field().handleChange(e.currentTarget.value)} />}
        </form.Field>
        <form.Field name="description">
          {(field) => <textarea placeholder="Description" value={field().state.value} onInput={(e) => field().handleChange(e.currentTarget.value)} />}
        </form.Field>
        <form.Field name="liveUrl">
          {(field) => <input placeholder="Live URL" value={field().state.value} onInput={(e) => field().handleChange(e.currentTarget.value)} />}
        </form.Field>
        <form.Field name="repoUrl">
          {(field) => <input placeholder="Repo URL" value={field().state.value} onInput={(e) => field().handleChange(e.currentTarget.value)} />}
        </form.Field>
        <form.Field name="techStackRaw">
          {(field) => <input placeholder="Tech stack, comma separated" value={field().state.value} onInput={(e) => field().handleChange(e.currentTarget.value)} />}
        </form.Field>
        <form.Field name="metrics">
          {(field) => <input placeholder="Metrics" value={field().state.value} onInput={(e) => field().handleChange(e.currentTarget.value)} />}
        </form.Field>
        <button type="submit">Add project</button>
      </form>
    </div>
  );
}

function SkillsSection() {
  const queryClient = useQueryClient();
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
    },
  }));

  const handleDelete = async (id: string) => {
    await deleteSkill({ data: id });
    queryClient.invalidateQueries({ queryKey: ["skills"] });
  };

  return (
    <div>
      <h2>Skills</h2>

      <For each={skillsQuery.data ?? []}>
        {(skill) => (
          <div>
            <strong>{skill.name}</strong>
            <button onClick={() => handleDelete(skill.id)}>Delete</button>
          </div>
        )}
      </For>

      <form onSubmit={(e) => { e.preventDefault(); form.handleSubmit(); }}>
        <form.Field name="name">
          {(field) => <input placeholder="Skill name" value={field().state.value} onInput={(e) => field().handleChange(e.currentTarget.value)} />}
        </form.Field>
        <button type="submit">Add skill</button>
      </form>
    </div>
  );
}

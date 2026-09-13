import { createFileRoute, Link, notFound, useRouter } from "@tanstack/solid-router";
import { createSignal, For, Show } from "solid-js";
import { useQuery } from "@tanstack/solid-query";
import { getRoleView, updateRoleViewSelection } from "~/lib/roles";
import { listExperiences } from "~/lib/experience";
import { listProjects } from "~/lib/project";
import { listEducation } from "~/lib/education";
import { listCertifications } from "~/lib/certification";

export const Route = createFileRoute("/u/$slug")({
  loader: async ({ params }) => {
    const data = await getRoleView({ data: params.slug });
    if (!data) throw notFound();
    return data;
  },
  head: ({ loaderData }) => ({
    meta: [{ title: loaderData ? `${loaderData.role.roleTitle} · jobscraft` : "jobscraft" }],
  }),
  component: PublicRoleView,
});

// Reusable owner-only curation list: shows every available item from the
// master list, checked/ordered items first (with up/down reorder), then
// unchecked items below so the owner can add things the algorithm didn't
// originally pick, not just remove what it did.
function CurationList<T extends { id: string }>(props: {
  items: T[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  renderLabel: (item: T) => string;
}) {
  const orderedSelected = () =>
    props.selectedIds
      .map((id) => props.items.find((i) => i.id === id))
      .filter((i): i is T => !!i);
  const unselected = () => props.items.filter((i) => !props.selectedIds.includes(i.id));

  const toggle = (id: string, include: boolean) => {
    if (include) props.onChange([...props.selectedIds, id]);
    else props.onChange(props.selectedIds.filter((x) => x !== id));
  };
  const move = (id: string, dir: -1 | 1) => {
    const ids = [...props.selectedIds];
    const idx = ids.indexOf(id);
    const newIdx = idx + dir;
    if (newIdx < 0 || newIdx >= ids.length) return;
    [ids[idx], ids[newIdx]] = [ids[newIdx], ids[idx]];
    props.onChange(ids);
  };

  return (
    <div class="flex flex-col gap-1.5 mb-4">
      <For each={orderedSelected()}>
        {(item, i) => (
          <div class="flex items-center gap-2 text-[14px]">
            <input type="checkbox" checked onChange={() => toggle(item.id, false)} />
            <span class="flex-1 [overflow-wrap:anywhere]">{props.renderLabel(item)}</span>
            <button
              type="button"
              class="text-[12px] text-graphite-soft disabled:opacity-30"
              disabled={i() === 0}
              onClick={() => move(item.id, -1)}
            >↑</button>
            <button
              type="button"
              class="text-[12px] text-graphite-soft disabled:opacity-30"
              disabled={i() === orderedSelected().length - 1}
              onClick={() => move(item.id, 1)}
            >↓</button>
          </div>
        )}
      </For>
      <For each={unselected()}>
        {(item) => (
          <div class="flex items-center gap-2 text-[14px] text-graphite-soft">
            <input type="checkbox" onChange={() => toggle(item.id, true)} />
            <span class="flex-1 [overflow-wrap:anywhere]">{props.renderLabel(item)}</span>
          </div>
        )}
      </For>
    </div>
  );
}

function PublicRoleView() {
  const data = Route.useLoaderData();
  const router = useRouter();
  const [view, setView] = createSignal<"interactive" | "minimal">(data().role.defaultView);
  const [editMode, setEditMode] = createSignal(false);
  const [saving, setSaving] = createSignal(false);

  const [roleTitleDraft, setRoleTitleDraft] = createSignal(data().role.roleTitle);
  const [expIds, setExpIds] = createSignal<string[]>(data().role.selectedExperienceIds);
  const [projIds, setProjIds] = createSignal<string[]>(data().role.selectedProjectIds);
  const [eduIds, setEduIds] = createSignal<string[]>(data().role.selectedEducationIds);
  const [certIds, setCertIds] = createSignal<string[]>(data().role.selectedCertificationIds);

  const startEditing = () => {
    setRoleTitleDraft(data().role.roleTitle);
    setExpIds(data().role.selectedExperienceIds);
    setProjIds(data().role.selectedProjectIds);
    setEduIds(data().role.selectedEducationIds);
    setCertIds(data().role.selectedCertificationIds);
    setEditMode(true);
  };

  const allExperiencesQuery = useQuery(() => ({ queryKey: ["experiences"], queryFn: () => listExperiences(), enabled: editMode() }));
  const allProjectsQuery = useQuery(() => ({ queryKey: ["projects"], queryFn: () => listProjects(), enabled: editMode() }));
  const allEducationQuery = useQuery(() => ({ queryKey: ["education"], queryFn: () => listEducation(), enabled: editMode() }));
  const allCertificationsQuery = useQuery(() => ({ queryKey: ["certifications"], queryFn: () => listCertifications(), enabled: editMode() }));

  const saveChanges = async () => {
    setSaving(true);
    await updateRoleViewSelection({
      data: {
        id: data().role.id,
        roleTitle: roleTitleDraft(),
        selectedExperienceIds: expIds(),
        selectedProjectIds: projIds(),
        selectedEducationIds: eduIds(),
        selectedCertificationIds: certIds(),
      },
    });
    await router.invalidate();
    setSaving(false);
    setEditMode(false);
  };

  return (
    <>
      <header class="flex items-center py-5 px-5 sm:px-10 border-b border-line">
        <Link to="/" class="flex items-center gap-2 serif text-[20px]">
          <img src="/favicon.svg" alt="" class="w-5 h-5 rounded-[3px]" />
          jobscraft
        </Link>
      </header>
      <main class="max-w-[720px] my-10 mx-auto px-5 sm:px-10">
      <Show when={!data().role.isPublished}>
        <div class="bg-highlighter-soft border border-line rounded-[3px] px-4 py-3 mb-6 text-[14px] text-graphite">
          This page isn't published yet — only you can see it.{" "}
          <Link to="/roles" class="underline">Publish it from My roles</Link>.
        </div>
      </Show>

      <div class="flex flex-wrap justify-between items-start gap-4 mb-6 pb-4 border-b border-line">
        <div class="flex-1 min-w-[200px]">
          <h1 class="serif text-[28px] mb-1 [overflow-wrap:anywhere]">{data().author.name}</h1>
          <Show
            when={!editMode()}
            fallback={
              <input
                class="input mb-1"
                value={roleTitleDraft()}
                onInput={(e) => setRoleTitleDraft(e.currentTarget.value)}
              />
            }
          >
            <p class="text-[16px] text-graphite-soft [overflow-wrap:anywhere]">{data().role.roleTitle}</p>
          </Show>
          <Show when={data().author.email}>
            <p class="text-graphite-soft text-[13px] mt-1">
              <a href={`mailto:${data().author.email}`} class="underline">{data().author.email}</a>
            </p>
          </Show>
          <Show when={data().author.summary}>
            <p class="text-[14px] leading-[1.6] mt-2 [overflow-wrap:anywhere]">{data().author.summary}</p>
          </Show>
          <Show when={data().isOwner}>
            <p
              class="text-graphite-soft text-[13px] mt-1"
              title="How closely this page's experience and projects match the job description this role was tailored for"
            >
              Match score: {data().role.matchScore}%
            </p>
          </Show>
        </div>
        <div class="flex flex-col items-end gap-2 shrink-0">
          <div class="flex gap-3 text-[13px]">
            <button
              class={view() === "interactive" ? "font-semibold underline" : "text-graphite-soft"}
              onClick={() => setView("interactive")}
            >Full detail</button>
            <button
              class={view() === "minimal" ? "font-semibold underline" : "text-graphite-soft"}
              onClick={() => setView("minimal")}
            >Quick view</button>
          </div>
          <Show when={data().isOwner}>
            <Show
              when={!editMode()}
              fallback={
                <div class="flex gap-2">
                  <button class="btn-primary" disabled={saving()} onClick={saveChanges}>
                    {saving() ? "Saving…" : "Save changes"}
                  </button>
                  <button class="btn-secondary" disabled={saving()} onClick={() => setEditMode(false)}>Cancel</button>
                </div>
              }
            >
              <button class="btn-secondary" onClick={startEditing}>Edit this page</button>
            </Show>
          </Show>
        </div>
      </div>

      <section class="mb-6">
        <h3 class="serif text-[21px] mb-2">Experience</h3>
        <Show
          when={!editMode()}
          fallback={
            <CurationList
              items={allExperiencesQuery.data ?? []}
              selectedIds={expIds()}
              onChange={setExpIds}
              renderLabel={(e) => `${e.title} — ${e.company}`}
            />
          }
        >
          <For each={data().experiences}>
            {(exp, i) => (
              <div classList={{ "pt-3 border-t border-line": i() > 0 }} class="pb-3">
                <div class="flex flex-wrap gap-2 justify-between">
                  <strong class="min-w-0 [overflow-wrap:anywhere]">{exp.title}</strong>
                  <span class="text-graphite-soft text-[13px] shrink-0">
                    {exp.startDate} — {exp.endDate ?? "present"}
                  </span>
                </div>
                <div class="text-graphite-soft text-[13px] mb-1.5 [overflow-wrap:anywhere]">{exp.company}</div>

                <Show when={view() === "interactive"}>
                  <ul class="mb-1.5 pl-[18px]">
                    <For each={exp.bullets}>{(b) => <li class="text-[14px] leading-[1.5]">{b}</li>}</For>
                  </ul>
                </Show>

                <div class="flex gap-1.5 flex-wrap">
                  <For each={exp.techStack}>
                    {(tech) => <span class="tag">{tech}</span>}
                  </For>
                </div>
              </div>
            )}
          </For>
        </Show>
      </section>

      <Show when={data().projects.length || editMode()}>
        <section class="mb-6">
          <h3 class="serif text-[21px] mb-2">Proof of work</h3>
          <Show
            when={!editMode()}
            fallback={
              <CurationList
                items={allProjectsQuery.data ?? []}
                selectedIds={projIds()}
                onChange={setProjIds}
                renderLabel={(p) => p.name}
              />
            }
          >
            <For each={data().projects}>
              {(proj, i) => (
                <div classList={{ "pt-3 border-t border-line": i() > 0 }} class="pb-3">
                  <strong class="[overflow-wrap:anywhere]">{proj.name}</strong>
                  <Show when={view() === "interactive"}>
                    <p class="text-[14px] leading-[1.5] text-graphite-soft mt-1">{proj.description}</p>
                    <Show when={proj.metrics}>
                      <p class="text-[13px] text-signal mt-1">{proj.metrics}</p>
                    </Show>
                  </Show>
                  <div class="flex gap-3.5 text-[13px] mt-2">
                    <Show when={proj.liveUrl}><a href={proj.liveUrl!} target="_blank">Live demo →</a></Show>
                    <Show when={proj.repoUrl}><a href={proj.repoUrl!} target="_blank">Repository →</a></Show>
                  </div>
                </div>
              )}
            </For>
          </Show>
        </section>
      </Show>

      <Show when={data().education.length || editMode()}>
        <section class="mb-6">
          <h3 class="serif text-[21px] mb-2">Education</h3>
          <Show
            when={!editMode()}
            fallback={
              <CurationList
                items={allEducationQuery.data ?? []}
                selectedIds={eduIds()}
                onChange={setEduIds}
                renderLabel={(e) => `${e.degree} — ${e.school}`}
              />
            }
          >
            <For each={data().education}>
              {(edu, i) => (
                <div classList={{ "pt-3 border-t border-line": i() > 0 }} class="pb-3 flex flex-wrap justify-between gap-2">
                  <div class="min-w-0">
                    <strong class="[overflow-wrap:anywhere]">{edu.degree} — {edu.school}</strong>
                    <Show when={edu.fieldOfStudy}>
                      <div class="text-graphite-soft text-[13px]">{edu.fieldOfStudy}</div>
                    </Show>
                  </div>
                  <span class="text-graphite-soft text-[13px] shrink-0">
                    {edu.startDate} — {edu.endDate || "Present"}
                  </span>
                </div>
              )}
            </For>
          </Show>
        </section>
      </Show>

      <Show when={data().certifications.length || editMode()}>
        <section class="mb-6">
          <h3 class="serif text-[21px] mb-2">Certifications</h3>
          <Show
            when={!editMode()}
            fallback={
              <CurationList
                items={allCertificationsQuery.data ?? []}
                selectedIds={certIds()}
                onChange={setCertIds}
                renderLabel={(c) => `${c.name} — ${c.issuer}`}
              />
            }
          >
            <For each={data().certifications}>
              {(cert, i) => (
                <div classList={{ "pt-3 border-t border-line": i() > 0 }} class="pb-3 flex flex-wrap justify-between gap-2">
                  <div class="min-w-0">
                    <strong class="[overflow-wrap:anywhere]">{cert.name} — {cert.issuer}</strong>
                    <Show when={cert.credentialUrl}>
                      <div class="text-[13px]"><a href={cert.credentialUrl!} target="_blank" rel="noreferrer">Credential →</a></div>
                    </Show>
                  </div>
                  <Show when={cert.issueDate}>
                    <span class="text-graphite-soft text-[13px] shrink-0">{cert.issueDate}</span>
                  </Show>
                </div>
              )}
            </For>
          </Show>
        </section>
      </Show>

      <Show when={data().skills.length}>
        <section class="mb-6">
          <h3 class="serif text-[21px] mb-2">Skills</h3>
          <div class="flex gap-1.5 flex-wrap">
            <For each={data().skills}>{(skill) => <span class="tag">{skill.name}</span>}</For>
          </div>
        </section>
      </Show>
      </main>
    </>
  );
}

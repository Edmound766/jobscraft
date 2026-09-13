import { createFileRoute, Link, notFound } from "@tanstack/solid-router";
import { createSignal, For, Show } from "solid-js";
import { getRoleView } from "~/lib/roles";

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

function PublicRoleView() {
  const data = Route.useLoaderData();
  const [view, setView] = createSignal<"interactive" | "minimal">(data().role.defaultView);

  return (
    <div class="max-w-[720px] my-15 mx-auto px-5 sm:px-10">
      <Show when={!data().role.isPublished}>
        <div class="bg-highlighter-soft border border-line rounded-[3px] px-4 py-3 mb-6 text-[13.5px] text-graphite">
          This page isn't published yet — only you can see it.{" "}
          <Link to="/roles" class="underline">Publish it from My roles</Link>.
        </div>
      </Show>
      <div class="flex flex-wrap justify-between items-center gap-4 mb-10">
        <div class="flex-1 min-w-[200px]">
          <h1 class="serif text-[28px] mb-1 [overflow-wrap:anywhere]">{data().role.roleTitle}</h1>
          <p class="text-graphite-soft text-[13px]">
            Match score: {data().role.matchScore}%
          </p>
        </div>
        <div class="flex gap-2 shrink-0">
          <button
            class={view() === "interactive" ? "btn-primary" : "btn-secondary"}
            onClick={() => setView("interactive")}
          >Interactive</button>
          <button
            class={view() === "minimal" ? "btn-primary" : "btn-secondary"}
            onClick={() => setView("minimal")}
          >Minimal</button>
        </div>
      </div>

      <section class="mb-9">
        <h3 class="serif text-[21px] mb-2">Experience</h3>
        <For each={data().experiences}>
          {(exp) => (
            <div class="bg-[#FBFAF6] border border-line rounded-[3px] px-[22px] py-5 mb-[14px]">
              <div class="flex flex-wrap gap-2 justify-between">
                <strong class="min-w-0 [overflow-wrap:anywhere]">{exp.title}</strong>
                <span class="text-graphite-soft text-[12.5px] shrink-0">
                  {exp.startDate} — {exp.endDate ?? "present"}
                </span>
              </div>
              <div class="text-graphite-soft text-[13px] mb-2.5 [overflow-wrap:anywhere]">{exp.company}</div>

              <Show when={view() === "interactive"}>
                <ul class="mb-2.5 pl-[18px]">
                  <For each={exp.bullets}>{(b) => <li class="text-[13.5px] leading-[1.7]">{b}</li>}</For>
                </ul>
              </Show>

              <div class="flex gap-1.5 flex-wrap">
                <For each={exp.techStack}>
                  {(tech) => (
                    <span class="bg-highlighter-soft text-[11.5px] px-2 py-[3px] rounded-[3px]">{tech}</span>
                  )}
                </For>
              </div>
            </div>
          )}
        </For>
      </section>

      <Show when={data().projects.length}>
        <section>
          <h3 class="serif text-[21px] mb-2">Proof of work</h3>
          <For each={data().projects}>
            {(proj) => (
              <div class="bg-[#FBFAF6] border border-line rounded-[3px] px-[22px] py-5 mb-[14px]">
                <strong class="[overflow-wrap:anywhere]">{proj.name}</strong>
                <Show when={view() === "interactive"}>
                  <p class="text-[13.5px] leading-[1.6] text-graphite-soft">{proj.description}</p>
                  <Show when={proj.metrics}>
                    <p class="text-[13px] text-signal">{proj.metrics}</p>
                  </Show>
                </Show>
                <div class="flex gap-3.5 text-[13px] mt-2">
                  <Show when={proj.liveUrl}><a href={proj.liveUrl!} target="_blank">Live demo →</a></Show>
                  <Show when={proj.repoUrl}><a href={proj.repoUrl!} target="_blank">Repository →</a></Show>
                </div>
              </div>
            )}
          </For>
        </section>
      </Show>
    </div>
  );
}

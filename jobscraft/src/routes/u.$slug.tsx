import { createFileRoute, Link, notFound } from "@tanstack/solid-router";
import { createSignal, For, Show } from "solid-js";
import { getRoleView } from "~/lib/roles";

export const Route = createFileRoute("/u/$slug")({
  loader: async ({ params }) => {
    const data = await getRoleView({ data: params.slug });
    if (!data) throw notFound();
    return data;
  },
  component: PublicRoleView,
});

function PublicRoleView() {
  const data = Route.useLoaderData();
  const [view, setView] = createSignal<"interactive" | "minimal">(data().role.defaultView);

  return (
    <div style={{ "max-width": "720px", margin: "60px auto 100px", padding: "0 40px" }}>
      <Show when={!data().role.isPublished}>
        <div style={{
          background: "var(--highlighter-soft)", border: "1px solid var(--line)", "border-radius": "3px",
          padding: "12px 16px", "margin-bottom": "24px", "font-size": "13.5px", color: "var(--graphite)"
        }}>
          This page isn't published yet — only you can see it.{" "}
          <Link to="/roles" style={{ "text-decoration": "underline" }}>Publish it from My roles</Link>.
        </div>
      </Show>
      <div style={{ display: "flex", "flex-wrap": "wrap", "justify-content": "space-between", "align-items": "center", gap: "16px", "margin-bottom": "40px" }}>
        <div style={{ flex: "1", "min-width": "200px" }}>
          <h1 class="serif" style={{ "font-size": "28px", margin: "0 0 4px", "overflow-wrap": "anywhere" }}>{data().role.roleTitle}</h1>
          <p style={{ color: "var(--graphite-soft)", "font-size": "13px", margin: 0 }}>
            Match score: {data().role.matchScore}%
          </p>
        </div>
        <div style={{ display: "flex", gap: "8px", "flex-shrink": "0" }}>
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

      <section style={{ "margin-bottom": "36px" }}>
        <h3 class="serif">Experience</h3>
        <For each={data().experiences}>
          {(exp) => (
            <div style={{
              background: "#FBFAF6", border: "1px solid var(--line)", "border-radius": "3px",
              padding: "20px 22px", "margin-bottom": "14px"
            }}>
              <div style={{ display: "flex", "flex-wrap": "wrap", gap: "8px", "justify-content": "space-between" }}>
                <strong style={{ "min-width": "0", "overflow-wrap": "anywhere" }}>{exp.title}</strong>
                <span style={{ color: "var(--graphite-soft)", "font-size": "12.5px", "flex-shrink": "0" }}>
                  {exp.startDate} — {exp.endDate ?? "present"}
                </span>
              </div>
              <div style={{ color: "var(--graphite-soft)", "font-size": "13px", "margin-bottom": "10px", "overflow-wrap": "anywhere" }}>{exp.company}</div>

              <Show when={view() === "interactive"}>
                <ul style={{ margin: "0 0 10px", "padding-left": "18px" }}>
                  <For each={exp.bullets}>{(b) => <li style={{ "font-size": "13.5px", "line-height": "1.7" }}>{b}</li>}</For>
                </ul>
              </Show>

              <div style={{ display: "flex", gap: "6px", "flex-wrap": "wrap" }}>
                <For each={exp.techStack}>
                  {(tech) => (
                    <span style={{
                      background: "var(--highlighter-soft)", "font-size": "11.5px",
                      padding: "3px 8px", "border-radius": "3px"
                    }}>{tech}</span>
                  )}
                </For>
              </div>
            </div>
          )}
        </For>
      </section>

      <Show when={data().projects.length}>
        <section>
          <h3 class="serif">Proof of work</h3>
          <For each={data().projects}>
            {(proj) => (
              <div style={{
                background: "#FBFAF6", border: "1px solid var(--line)", "border-radius": "3px",
                padding: "20px 22px", "margin-bottom": "14px"
              }}>
                <strong>{proj.name}</strong>
                <Show when={view() === "interactive"}>
                  <p style={{ "font-size": "13.5px", "line-height": "1.6", color: "var(--graphite-soft)" }}>{proj.description}</p>
                  <Show when={proj.metrics}>
                    <p style={{ "font-size": "13px", color: "var(--signal)" }}>{proj.metrics}</p>
                  </Show>
                </Show>
                <div style={{ display: "flex", gap: "14px", "font-size": "13px", "margin-top": "8px" }}>
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

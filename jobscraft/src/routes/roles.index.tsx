import { useQuery, useQueryClient } from '@tanstack/solid-query'
import { createFileRoute, Link, redirect } from '@tanstack/solid-router'
import { createServerFn } from '@tanstack/solid-start'
import { For, Show } from 'solid-js'
import { listRoleViews, togglePublish } from '~/lib/roles'
import { requireUser } from '~/lib/session'

const ensureAuthenticated = createServerFn({ method: 'GET' }).handler(async () => {
  await requireUser()
})

export const Route = createFileRoute('/roles/')({
  beforeLoad: async () => {
    try {
      await ensureAuthenticated()
    } catch {
      throw redirect({ to: '/login' })
    }
  },
  component: RoleList,
})

function RoleList() {
  const queryClient = useQueryClient()
  const rolesQuery = useQuery(()=>({
    queryKey:["roleViews"],
    queryFn:()=>listRoleViews()
  }))

  const handleToggle = async(id:string)=>{
    await togglePublish({data:id})
    queryClient.invalidateQueries({queryKey:["roleViews"]})
  }

  const copyLink = (slug:string)=>{
    navigator.clipboard.writeText(`${window.location.origin}/u/${slug}`)
  }
return (
    <div style={{ "max-width": "720px", margin: "60px auto", padding: "0 40px" }}>
      <div style={{ display: "flex", "justify-content": "space-between", "align-items": "center", "margin-bottom": "24px" }}>
        <h1 class="serif">Your tailored pages</h1>
        <Link to="/roles/new" class="btn-primary" style={{ "text-decoration": "none" }}>New role</Link>
      </div>

      <Show when={rolesQuery.data?.length === 0}>
        <p style={{ color: "var(--graphite-soft)" }}>No pages yet — tailor one from your dashboard.</p>
      </Show>

      <For each={rolesQuery.data ?? []}>
        {(role) => (
          <div style={{
            background: "#FBFAF6", border: "1px solid var(--line)", "border-radius": "3px",
            padding: "18px 22px", "margin-bottom": "12px",
            display: "flex", "justify-content": "space-between", "align-items": "center"
          }}>
            <div>
              <strong>{role.roleTitle}</strong>
              <div style={{ "font-size": "12.5px", color: "var(--graphite-soft)" }}>
                /u/{role.slug} · {role.matchScore}% match · {role.isPublished ? "Published" : "Unpublished"}
              </div>
            </div>
            <div style={{ display: "flex", gap: "8px" }}>
              <Link to='/u/$slug' params={{
                slug:role.slug
              }}   target="_blank" class="btn-secondary" style={{ "text-decoration": "none" }}>View</Link>
              <button class="btn-secondary" onClick={() => copyLink(role.slug)}>Copy link</button>
              <button class="btn-secondary" onClick={() => handleToggle(role.id)}>
                {role.isPublished ? "Unpublish" : "Publish"}
              </button>
            </div>
          </div>
        )}
      </For>
    </div>
  );
}

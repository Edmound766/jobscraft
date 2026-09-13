import { useQuery, useQueryClient } from '@tanstack/solid-query'
import { createFileRoute, Link, redirect } from '@tanstack/solid-router'
import { createServerFn } from '@tanstack/solid-start'
import { createSignal, For, Show } from 'solid-js'
import { deleteRoleView, listRoleViews, togglePublish } from '~/lib/roles'
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
  head: () => ({ meta: [{ title: 'My roles · jobscraft' }] }),
  component: RoleList,
})

function RoleList() {
  const queryClient = useQueryClient()
  const rolesQuery = useQuery(()=>({
    queryKey:["roleViews"],
    queryFn:()=>listRoleViews()
  }))
  const [copiedId, setCopiedId] = createSignal<string | null>(null)
  const [confirmingDeleteId, setConfirmingDeleteId] = createSignal<string | null>(null)
  const [togglingId, setTogglingId] = createSignal<string | null>(null)
  const [deletingId, setDeletingId] = createSignal<string | null>(null)

  const handleToggle = async(id:string)=>{
    setTogglingId(id)
    await togglePublish({data:id})
    queryClient.invalidateQueries({queryKey:["roleViews"]})
    setTogglingId(null)
  }

  const copyLink = (id:string, slug:string)=>{
    navigator.clipboard.writeText(`${window.location.origin}/u/${slug}`)
    setCopiedId(id)
    setTimeout(() => setCopiedId((current) => (current === id ? null : current)), 1500)
  }

  const handleDelete = async(id:string)=>{
    setDeletingId(id)
    await deleteRoleView({data:id})
    queryClient.invalidateQueries({queryKey:["roleViews"]})
    setConfirmingDeleteId(null)
    setDeletingId(null)
  }
return (
    <main class="max-w-[720px] my-15 mx-auto px-5 sm:px-10">
      <div class="flex flex-wrap justify-between items-center gap-3 mb-6">
        <h1 class="serif text-[28px]">Your tailored pages</h1>
        <Link to="/roles/new" class="btn-primary no-underline">New role</Link>
      </div>

      <Show when={rolesQuery.data?.length === 0}>
        <p class="text-graphite-soft">No pages yet — tailor one from your dashboard.</p>
      </Show>

      <For each={rolesQuery.data ?? []}>
        {(role) => (
          <div class="bg-[#FBFAF6] border border-line rounded-[3px] px-[22px] py-[18px] mb-3 flex flex-wrap justify-between items-center gap-3">
            <div class="flex-1 min-w-0">
              <strong class="[overflow-wrap:anywhere]">{role.roleTitle}</strong>
              <div class="text-[13px] text-graphite-soft [overflow-wrap:anywhere]">
                /u/{role.slug} · {role.matchScore}% match · {role.isPublished ? "Published" : "Unpublished"}
              </div>
            </div>
            <div class="flex flex-wrap gap-2 max-w-full items-center">
              <Link to='/u/$slug' params={{
                slug:role.slug
              }}   target="_blank" class="btn-secondary no-underline">View</Link>
              <button class="btn-secondary" onClick={() => copyLink(role.id, role.slug)}>
                {copiedId() === role.id ? "Copied!" : "Copy link"}
              </button>
              <button class="btn-secondary" disabled={togglingId() === role.id} onClick={() => handleToggle(role.id)}>
                {togglingId() === role.id
                  ? (role.isPublished ? "Unpublishing…" : "Publishing…")
                  : (role.isPublished ? "Unpublish" : "Publish")}
              </button>
              <Show
                when={confirmingDeleteId() === role.id}
                fallback={
                  <button class="remove-btn" onClick={() => setConfirmingDeleteId(role.id)}>Delete</button>
                }
              >
                <span class="text-[13px] text-graphite-soft">Delete?</span>
                <button class="remove-btn" disabled={deletingId() === role.id} onClick={() => handleDelete(role.id)}>
                  {deletingId() === role.id ? "Deleting…" : "Yes"}
                </button>
                <button class="remove-btn" disabled={deletingId() === role.id} onClick={() => setConfirmingDeleteId(null)}>Cancel</button>
              </Show>
            </div>
          </div>
        )}
      </For>
    </main>
  );
}

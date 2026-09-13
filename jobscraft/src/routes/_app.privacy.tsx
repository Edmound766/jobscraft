import { createFileRoute } from '@tanstack/solid-router'

export const Route = createFileRoute('/_app/privacy')({
  head: () => ({ meta: [{ title: 'Privacy · jobscraft' }] }),
  component: Privacy,
})

function Privacy() {
  return (
    <main class="max-w-[640px] mt-[60px] mx-auto mb-[100px] px-5 sm:px-10">
      <h1 class="serif text-[28px] mb-6">Privacy</h1>

      <p class="text-[15px] leading-[1.7] mb-4">
        JobsCraft is currently in early testing. Here's what you should know:
      </p>

      <ul class="text-[15px] leading-[1.7] pl-5 mb-4">
        <li class="mb-3">
          <strong>What we store:</strong> your account info (email, name), the career data you enter
          (experience, projects, skills), and any tailored role pages you generate.
        </li>
        <li class="mb-3">
          <strong>What's public:</strong> only role pages you explicitly publish are visible at their URL.
          Everything else — your dashboard, unpublished pages — is private to your account.
        </li>
        <li class="mb-3">
          <strong>Job descriptions you paste</strong> are sent to a third-party AI service to rank your
          experience against them. We don't store the job description text beyond what's needed to
          generate your page.
        </li>
        <li class="mb-3">
          <strong>This is a beta.</strong> We're actively building and testing — don't rely on this for
          critical data yet, and expect things to change.
        </li>
        <li>
          <strong>Questions or want your data removed?</strong> Contact{" "}
          <a href="mailto:edmound776@gmail.com">edmound776@gmail.com</a>.
        </li>
      </ul>
    </main>
  )
}

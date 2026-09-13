import { createFileRoute } from '@tanstack/solid-router'

export const Route = createFileRoute('/privacy')({
  component: Privacy,
})

function Privacy() {
  return (
    <div style={{ "max-width": "640px", margin: "60px auto 100px", padding: "0 40px" }}>
      <h1 class="serif" style={{ "font-size": "32px", margin: "0 0 24px" }}>Privacy</h1>

      <p style={{ "font-size": "15px", "line-height": "1.7", margin: "0 0 16px" }}>
        JobsCraft is currently in early testing. Here's what you should know:
      </p>

      <ul style={{ "font-size": "15px", "line-height": "1.7", "padding-left": "20px", margin: "0 0 16px" }}>
        <li style={{ "margin-bottom": "12px" }}>
          <strong>What we store:</strong> your account info (email, name), the career data you enter
          (experience, projects, skills), and any tailored role pages you generate.
        </li>
        <li style={{ "margin-bottom": "12px" }}>
          <strong>What's public:</strong> only role pages you explicitly publish are visible at their URL.
          Everything else — your dashboard, unpublished pages — is private to your account.
        </li>
        <li style={{ "margin-bottom": "12px" }}>
          <strong>Job descriptions you paste</strong> are sent to a third-party AI service to rank your
          experience against them. We don't store the job description text beyond what's needed to
          generate your page.
        </li>
        <li style={{ "margin-bottom": "12px" }}>
          <strong>This is a beta.</strong> We're actively building and testing — don't rely on this for
          critical data yet, and expect things to change.
        </li>
        <li>
          <strong>Questions or want your data removed?</strong> Contact{" "}
          <a href="mailto:edmound776@gmail.com">edmound776@gmail.com</a>.
        </li>
      </ul>
    </div>
  )
}

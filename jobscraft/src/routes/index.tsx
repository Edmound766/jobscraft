import { createFileRoute, Link } from '@tanstack/solid-router'

export const Route = createFileRoute('/')({ component: App })

function App() {
  return (
 <div>
      <section style={{ "max-width": "720px", margin: "80px auto 100px", padding: "0 40px", "text-align": "center" }}>
        <h1 style={{ "font-size": "40px", margin: "0 0 18px" }}>
          Stop reformatting your résumé for every job.
        </h1>
        <p style={{ color: "var(--graphite-soft)", "font-size": "16px", "line-height": "1.6", margin: "0 0 32px" }}>
          Build your career once. JobsCraft filters and ranks it into a role-tailored,
          instantly shareable page — no PDF, no login wall, no reformatting.
        </p>
        <Link to="/dashboard" class="btn-primary" style={{ "text-decoration": "none" }}>Build your repository</Link>
      </section>

      <section style={{ "max-width": "1040px", margin: "0 auto 100px", padding: "0 40px", display: "grid", "grid-template-columns": "1fr 1fr 1fr", gap: "32px" }}>
        <div>
          <h3>Master repository</h3>
          <p style={{ color: "var(--graphite-soft)", "font-size": "14px", "line-height": "1.6" }}>
            Enter your experience, projects, and skills once — code links, live demos, metrics included.
          </p>
        </div>
        <div>
          <h3>Dynamic matching</h3>
          <p style={{ color: "var(--graphite-soft)", "font-size": "14px", "line-height": "1.6" }}>
            Paste a job description and JobsCraft ranks and structures your data around what that role actually needs.
          </p>
        </div>
        <div>
          <h3>Frictionless URL</h3>
          <p style={{ color: "var(--graphite-soft)", "font-size": "14px", "line-height": "1.6" }}>
            A clean, hosted page recruiters open instantly — no download, no account, no paywall.
          </p>
        </div>
      </section>

      <footer style={{ "max-width": "1040px", margin: "0 auto 60px", padding: "0 40px", "text-align": "center" }}>
        <Link to="/privacy" style={{ color: "var(--graphite-soft)", "font-size": "13px" }}>Privacy</Link>
      </footer>
    </div>
  )
}

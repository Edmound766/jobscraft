import { Link } from '@tanstack/solid-router'

export default function Header() {
  return (
    <header style={{ display: "flex", "justify-content": "space-between", "align-items": "center", padding: "20px 40px", "border-bottom": "1px solid var(--line)" }}>
      <Link to="/" class="serif" style={{ "font-size": "20px" }}>jobscraft</Link>
      <nav style={{ display: "flex", gap: "16px", "align-items": "center" }}>
        <Link to="/dashboard">Dashboard</Link>
        {/* swap for sign-in/sign-out based on session once wired */}
      </nav>
    </header>
  )
}

import { createFileRoute, Link } from '@tanstack/solid-router'

export const Route = createFileRoute('/_app/')({ component: App })

function App() {
  return (
 <main>
      <section class="max-w-[720px] mt-20 mx-auto mb-[100px] px-5 sm:px-10 text-center">
        <h1 class="text-[28px] sm:text-[40px] mb-[18px]">
          Stop reformatting your résumé for every job.
        </h1>
        <p class="text-graphite-soft text-[15px] leading-[1.6] mb-8">
          Build your career once. JobsCraft filters and ranks it into a role-tailored,
          instantly shareable page — no PDF, no login wall, no reformatting.
        </p>
        <Link to="/dashboard" class="btn-primary no-underline">Build your repository</Link>
      </section>

      <section class="max-w-[560px] mx-auto mb-[100px] px-5 sm:px-10">
        <p class="text-graphite-soft text-[13px] text-center mb-3">What a tailored page looks like</p>
        <div class="text-center mb-4">
          <p class="serif text-[21px] mb-1">Senior Backend Engineer</p>
          <p class="text-graphite-soft text-[13px]">Match score: 92%</p>
        </div>
        <div class="bg-[#FBFAF6] border border-line rounded-[3px] px-[22px] py-5">
          <div class="flex flex-wrap gap-2 justify-between">
            <strong>Staff Engineer</strong>
            <span class="text-graphite-soft text-[13px] shrink-0">2021 — Present</span>
          </div>
          <div class="text-graphite-soft text-[13px] mb-2.5">Fintech Co</div>
          <ul class="mb-2.5 pl-[18px]">
            <li class="text-[14px] leading-[1.7]">Led migration to an event-driven architecture, cutting p95 latency 40%</li>
          </ul>
          <div class="flex gap-1.5 flex-wrap">
            <span class="tag">Postgres</span>
            <span class="tag">Node.js</span>
          </div>
        </div>
      </section>

      <section class="max-w-[1040px] mx-auto mb-[100px] px-5 sm:px-10 grid grid-cols-1 sm:grid-cols-3 gap-8">
        <div>
          <h3 class="text-[18px] mb-2">Master repository</h3>
          <p class="text-graphite-soft text-sm leading-[1.6]">
            Enter your experience, projects, and skills once — code links, live demos, metrics included.
          </p>
        </div>
        <div>
          <h3 class="text-[18px] mb-2">Dynamic matching</h3>
          <p class="text-graphite-soft text-sm leading-[1.6]">
            Paste a job description and JobsCraft ranks and structures your data around what that role actually needs.
          </p>
        </div>
        <div>
          <h3 class="text-[18px] mb-2">Frictionless URL</h3>
          <p class="text-graphite-soft text-sm leading-[1.6]">
            A clean, hosted page recruiters open instantly — no download, no account, no paywall.
          </p>
        </div>
      </section>

      <footer class="max-w-[1040px] mx-auto mb-15 px-5 sm:px-10 text-center">
        <Link to="/privacy" class="text-graphite-soft text-[13px]">Privacy</Link>
      </footer>
    </main>
  )
}

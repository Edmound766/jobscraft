import { Outlet, createFileRoute } from '@tanstack/solid-router'
import Header from '../components/Header'

export const Route = createFileRoute('/_app')({
  component: () => (
    <>
      <Header />
      <Outlet />
    </>
  ),
})

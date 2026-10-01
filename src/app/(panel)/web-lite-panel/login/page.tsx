import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { PANEL_PATH } from "@/lib/paths";
import { getCurrentUser } from "@/lib/server/auth";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = { title: "Вход" };

export default async function LoginPage() {
  if (await getCurrentUser()) redirect(PANEL_PATH);
  return (
    <div className="login-wrap">
      <main className="card login-card">
        <h1>Вход в админку</h1>
        <p className="muted">Управление контентом и заявками сайта.</p>
        <LoginForm />
      </main>
    </div>
  );
}

"use server";

import { redirect } from "next/navigation";
import { PANEL_PATH } from "@/lib/paths";
import { login, logout } from "@/lib/server/auth";

export interface LoginState {
  error?: string;
  needCode?: boolean;
}

export async function loginAction(_prev: LoginState, form: FormData): Promise<LoginState> {
  const result = await login(String(form.get("login") ?? ""), String(form.get("password") ?? ""), String(form.get("code") ?? ""));
  if (!result.ok) return { error: result.error, needCode: result.needCode };
  redirect(PANEL_PATH);
}

export async function logoutAction() {
  await logout();
  redirect(`${PANEL_PATH}/login`);
}

"use client";

import { createContext, useContext } from "react";
import type { ClientContent } from "@/lib/clientContent";

const ContentContext = createContext<ClientContent | null>(null);

/** Контент из базы для клиентских компонентов: шапка, модалки, формы, квиз. */
export function ContentProvider({ value, children }: { value: ClientContent; children: React.ReactNode }) {
  return <ContentContext.Provider value={value}>{children}</ContentContext.Provider>;
}

export function useSiteContent(): ClientContent {
  const value = useContext(ContentContext);
  if (!value) throw new Error("useSiteContent: нет ContentProvider выше по дереву");
  return value;
}

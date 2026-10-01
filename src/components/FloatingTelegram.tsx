import { getContent } from "@/lib/server/content";
import { TelegramIcon } from "./icons";

export async function FloatingTelegram() {
  const { site } = await getContent();
  return (
    <a
      href={site.contacts.telegramUrl}
      className="fab"
      target="_blank"
      rel="noopener"
      aria-label={`Написать в Telegram ${site.contacts.telegram}`}
    >
      <TelegramIcon width={26} height={26} />
    </a>
  );
}

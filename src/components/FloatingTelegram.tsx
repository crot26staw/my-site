import { site } from "@/config/site";
import { TelegramIcon } from "./icons";

export function FloatingTelegram() {
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

import { ExternalLink, Mail, MapPin, MessageCircle, Music, Send } from "lucide-react";

interface FooterLink {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  external?: boolean;
}

// TODO: подтвердить реальные URL с заказчиком; текущие — best-guess по официальному сайту музея.
const LINKS: FooterLink[] = [
  {
    label: "Сайт музея",
    href: "https://fabergemuseum.ru",
    icon: ExternalLink,
    external: true,
  },
  {
    label: "Указатель экспозиции",
    href: "https://fabergemuseum.ru/plan",
    icon: MapPin,
    external: true,
  },
  { label: "Аудиогид", href: "https://fabergemuseum.ru/audio", icon: Music, external: true },
  {
    label: "ВКонтакте",
    href: "https://vk.com/fabergemuseumspb",
    icon: MessageCircle,
    external: true,
  },
  { label: "Telegram", href: "https://t.me/fabergemuseum", icon: Send, external: true },
  { label: "Написать нам", href: "mailto:info@fabergemuseum.ru", icon: Mail },
];

export function SiteFooter() {
  return (
    <footer className="border-border bg-muted/30 mt-4 border-t">
      <div className="px-6 py-8">
        <p className="text-muted-foreground text-[10px] tracking-widest uppercase">
          Полезные ссылки
        </p>
        <ul className="mt-4 grid grid-cols-2 gap-3">
          {LINKS.map((l) => {
            const Icon = l.icon;
            return (
              <li key={l.label}>
                <a
                  href={l.href}
                  target={l.external ? "_blank" : undefined}
                  rel={l.external ? "noopener noreferrer" : undefined}
                  className="border-border hover:bg-background flex items-center gap-2 border p-3 text-sm transition-colors"
                >
                  <Icon className="text-accent h-4 w-4 shrink-0" />
                  <span className="min-w-0 truncate">{l.label}</span>
                </a>
              </li>
            );
          })}
        </ul>
        <p className="text-muted-foreground mt-6 text-center text-xs">
          Санкт-Петербург, наб. реки Фонтанки, 21
        </p>
      </div>
    </footer>
  );
}

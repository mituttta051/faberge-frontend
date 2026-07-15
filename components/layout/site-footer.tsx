import { ExternalLink, FileText, Mail, MessageCircle, Music, Phone, Send } from "lucide-react";

interface FooterLink {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  external?: boolean;
}

const LINKS: FooterLink[] = [
  {
    label: "Сайт музея",
    href: "https://fabergemuseum.ru",
    icon: ExternalLink,
    external: true,
  },
  {
    label: "Путеводитель",
    href: "https://fabergemuseum.ru/image/pdf/faberge_expo.pdf",
    icon: FileText,
    external: true,
  },
  {
    label: "Онлайн-аудиогид",
    href: "https://audioguide.fabergemuseum.ru/",
    icon: Music,
    external: true,
  },
  {
    label: "ВКонтакте",
    href: "https://vk.com/fabergemuseum",
    icon: MessageCircle,
    external: true,
  },
  { label: "Telegram", href: "https://t.me/fabergemuseum", icon: Send, external: true },
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

        <p className="text-muted-foreground mt-6 text-[10px] tracking-widest uppercase">
          Контакты
        </p>
        <div className="mt-3 flex flex-col gap-3 text-sm">
          <a
            href="tel:+78123332655"
            className="border-border hover:bg-background flex items-center gap-2 border p-3 transition-colors"
          >
            <Phone className="text-accent h-4 w-4 shrink-0" />
            +7 (812) 333-26-55
          </a>
          <a
            href="mailto:3332655@fsv.ru"
            className="border-border hover:bg-background flex items-center gap-2 border p-3 transition-colors"
          >
            <Mail className="text-accent h-4 w-4 shrink-0" />
            3332655@fsv.ru
          </a>
        </div>

        <div className="text-muted-foreground mt-6 space-y-1 text-xs leading-relaxed">
          <p>Шуваловский дворец, наб. реки Фонтанки, 21</p>
          <p>Ежедневно с 10:00 до 20:45. Кассы — с 9:30 до 20:15.</p>
        </div>
      </div>
    </footer>
  );
}

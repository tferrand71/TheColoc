import { Brush, MessagesSquare, ShoppingBasket } from "lucide-react";
import { Logo } from "./ui";

const FEATURES = [
  { icon: Brush, title: "Ménage en rotation", text: "Chacun son tour, avec rappels et échanges de semaine." },
  { icon: ShoppingBasket, title: "Courses partagées", text: "Ce qui manque, et qui s'en charge." },
  { icon: MessagesSquare, title: "Discussion et annonces", text: "Le fil de la coloc et les messages du propriétaire." },
];

export function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden overflow-hidden border-r border-[var(--color-hairline)] bg-[var(--color-ink)]/70 p-12 lg:flex lg:flex-col">
        <div className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-[var(--color-mauve)]/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-40 right-0 h-96 w-96 rounded-full bg-[var(--color-pink)]/10 blur-3xl" />
        <Logo />
        <div className="relative mt-auto max-w-md">
          <h2 className="text-3xl font-semibold leading-tight tracking-tight text-[var(--color-text-main)]">
            La vie en coloc, <span className="text-gradient">sans prise de tête.</span>
          </h2>
          <ul className="mt-10 flex flex-col gap-6">
            {FEATURES.map(({ icon: Icon, title, text }) => (
              <li key={title} className="flex gap-4">
                <div className="icon-tile">
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-medium text-[var(--color-text-main)]">{title}</p>
                  <p className="text-sm text-[var(--color-text-muted)]">{text}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm animate-rise">
          <div className="mb-10 flex justify-center lg:hidden">
            <Logo />
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}

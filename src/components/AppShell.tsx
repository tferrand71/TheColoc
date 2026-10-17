import { auth } from "@/auth";
import { AppSidebar } from "./AppSidebar";
import { AppBottomNav } from "./AppBottomNav";

export async function AppShell({ children }: { children: React.ReactNode }) {
  const session = await auth();

  if (!session?.user) {
    return <>{children}</>;
  }

  const { displayName, color, role, username } = session.user;

  return (
    <div className="lg:flex lg:h-screen lg:overflow-hidden">
      {/* Sidebar — desktop uniquement */}
      <aside className="hidden lg:flex lg:w-64 lg:flex-shrink-0 lg:flex-col lg:overflow-y-auto
        border-r border-[var(--color-hairline)]">
        <AppSidebar user={{ displayName, color, role, username }} />
      </aside>

      {/* Contenu principal */}
      <div className="min-h-screen pb-20 lg:flex-1 lg:min-h-0 lg:overflow-y-auto lg:pb-0">
        {children}
      </div>

      {/* Bottom nav — mobile uniquement */}
      <AppBottomNav />
    </div>
  );
}

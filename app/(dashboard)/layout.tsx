import Link from "next/link";
import { LayoutDashboard, Users } from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/customers", label: "Kunden", icon: Users },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col pb-16 sm:pb-0 sm:pl-56">
      <nav className="bg-background fixed inset-x-0 bottom-0 z-10 flex border-t sm:inset-y-0 sm:right-auto sm:w-56 sm:flex-col sm:border-t-0 sm:border-r">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="text-muted-foreground hover:text-foreground flex flex-1 flex-col items-center gap-1 py-3 text-xs sm:flex-none sm:flex-row sm:gap-3 sm:px-4 sm:py-3 sm:text-sm"
          >
            <item.icon className="size-5" />
            {item.label}
          </Link>
        ))}
      </nav>
      {children}
    </div>
  );
}

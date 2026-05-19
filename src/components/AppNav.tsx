"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, ListTodo } from "lucide-react";

const links = [
  {
    href: "/todos",
    label: "Todos",
    icon: ListTodo,
  },
  {
    href: "/daily",
    label: "Daily",
    icon: CalendarDays,
  },
];

export function AppNav() {
  const pathname = usePathname();

  return (
    <nav className="bottom-nav" aria-label="Primary navigation">
      {links.map((link) => {
        const Icon = link.icon;
        const active = pathname.startsWith(link.href);

        return (
          <Link
            aria-current={active ? "page" : undefined}
            className={active ? "nav-link active" : "nav-link"}
            href={link.href}
            key={link.href}
          >
            <Icon aria-hidden="true" size={20} />
            <span>{link.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

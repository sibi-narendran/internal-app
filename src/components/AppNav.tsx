"use client";

import { useEffect, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { CalendarDays, ListTodo, Loader2, UserRound } from "lucide-react";
import { TEAM_MEMBERS, getTeamMemberBySlug } from "@/lib/members";

const PROFILE_STORAGE_KEY = "daily-desk-selected-member";

const links = [
  {
    href: "/todos",
    label: "Todos",
    icon: ListTodo,
  },
  {
    href: "/daily",
    label: "Daily Report",
    icon: CalendarDays,
  },
];

export function AppNav() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [pendingHref, setPendingHref] = useState<string | null>(null);
  const [pendingMemberSlug, setPendingMemberSlug] = useState<string | null>(
    null,
  );
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNavigating, startNavigating] = useTransition();
  const [isSwitchingMember, startSwitchingMember] = useTransition();
  const currentMemberSlug = searchParams.get("member");
  const selectedMember =
    getTeamMemberBySlug(currentMemberSlug) ?? TEAM_MEMBERS[0];

  useEffect(() => {
    const urlMember = getTeamMemberBySlug(searchParams.get("member"));

    if (urlMember) {
      window.localStorage.setItem(PROFILE_STORAGE_KEY, urlMember.slug);
      return;
    }

    const storedMember = getTeamMemberBySlug(
      window.localStorage.getItem(PROFILE_STORAGE_KEY),
    );

    if (!storedMember) {
      return;
    }

    const nextParams = new URLSearchParams(searchParams.toString());
    nextParams.set("member", storedMember.slug);
    router.replace(`${pathname}?${nextParams.toString()}`, { scroll: false });
  }, [pathname, router, searchParams]);

  function buildPathWithMember(path: string, memberSlug: string) {
    const nextParams = new URLSearchParams();
    nextParams.set("member", memberSlug);

    return `${path}?${nextParams.toString()}`;
  }

  function changeMember(memberSlug: string) {
    window.localStorage.setItem(PROFILE_STORAGE_KEY, memberSlug);
    setPendingMemberSlug(memberSlug);
    setIsProfileOpen(false);

    const nextParams = new URLSearchParams(searchParams.toString());
    nextParams.set("member", memberSlug);

    startSwitchingMember(() => {
      router.replace(`${pathname}?${nextParams.toString()}`, {
        scroll: false,
      });
    });
  }

  return (
    <div className="app-topbar">
      <div
        className="profile-menu"
        onBlur={(event) => {
          const nextFocus = event.relatedTarget;

          if (
            nextFocus instanceof Node &&
            event.currentTarget.contains(nextFocus)
          ) {
            return;
          }

          setIsProfileOpen(false);
        }}
      >
        <button
          aria-expanded={isProfileOpen}
          aria-haspopup="menu"
          aria-label="Switch profile"
          className="profile-button"
          onClick={() => setIsProfileOpen((isOpen) => !isOpen)}
          type="button"
        >
          {isSwitchingMember && pendingMemberSlug ? (
            <Loader2 aria-hidden="true" className="spin" size={20} />
          ) : (
            <UserRound aria-hidden="true" size={20} />
          )}
          <span
            aria-hidden="true"
            className="profile-dot"
            style={{ backgroundColor: selectedMember.accent }}
          />
        </button>

        {isProfileOpen ? (
          <div className="profile-options" role="menu">
            {TEAM_MEMBERS.map((member) => {
              const active = member.slug === selectedMember.slug;
              const loading =
                isSwitchingMember && pendingMemberSlug === member.slug;

              return (
                <button
                  aria-checked={active}
                  className={
                    active ? "profile-option active" : "profile-option"
                  }
                  key={member.slug}
                  onClick={() => changeMember(member.slug)}
                  role="menuitemradio"
                  type="button"
                >
                  <span
                    aria-hidden="true"
                    className="member-dot"
                    style={{ backgroundColor: member.accent }}
                  />
                  <span>
                    <b>{member.name}</b>
                    <small>{member.role}</small>
                  </span>
                  {loading ? (
                    <Loader2 aria-hidden="true" className="spin" size={16} />
                  ) : null}
                </button>
              );
            })}
          </div>
        ) : null}
      </div>

      <nav className="top-nav" aria-label="Primary navigation">
        {links.map((link) => {
          const Icon = link.icon;
          const active = pathname.startsWith(link.href);
          const loading = isNavigating && pendingHref === link.href && !active;

          return (
            <button
              aria-current={active ? "page" : undefined}
              className={active ? "nav-link active" : "nav-link"}
              key={link.href}
              onClick={() => {
                if (!active) {
                  setPendingHref(link.href);
                  startNavigating(() => {
                    router.push(
                      buildPathWithMember(link.href, selectedMember.slug),
                    );
                  });
                }
              }}
              type="button"
            >
              {loading ? (
                <Loader2 aria-hidden="true" className="spin" size={20} />
              ) : (
                <Icon aria-hidden="true" size={20} />
              )}
              <span>{link.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}

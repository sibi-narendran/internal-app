"use client";

import { useMemo, useState, type FocusEvent, type KeyboardEvent } from "react";
import { useRouter } from "next/navigation";
import { useFormStatus } from "react-dom";
import { CalendarDays, Loader2, Save } from "lucide-react";
import { saveDailyReport } from "@/app/actions";
import type { DailyReportMember, MonthlyReportEntry } from "@/lib/data";

const attendanceOptions = [
  {
    label: "Present",
    value: "PRESENT",
  },
  {
    label: "Half day",
    value: "HALF_DAY",
  },
  {
    label: "Absent",
    value: "ABSENT",
  },
  {
    label: "Leave",
    value: "LEAVE",
  },
] as const;

type DailyReportClientProps = {
  date: string;
  members: DailyReportMember[];
  month: string;
  monthlyReports: MonthlyReportEntry[];
  selectedMemberSlug?: string;
};

export function DailyReportClient({
  date,
  members,
  month,
  monthlyReports,
  selectedMemberSlug,
}: DailyReportClientProps) {
  const router = useRouter();
  const [selectedMemberId, setSelectedMemberId] = useState(
    members.find((member) => member.slug === selectedMemberSlug)?.id ??
      members[0]?.id ??
      "",
  );
  const selectedMemberReports = useMemo(
    () =>
      monthlyReports.filter((report) => report.member.id === selectedMemberId),
    [monthlyReports, selectedMemberId],
  );
  const selectedMember = members.find(
    (member) => member.id === selectedMemberId,
  );
  const selectedMemberQuery = selectedMember
    ? `&member=${selectedMember.slug}`
    : "";

  function changeDate(nextDate: string) {
    router.push(
      `/daily?date=${nextDate}&month=${nextDate.slice(0, 7)}${selectedMemberQuery}`,
    );
  }

  function changeMonth(nextMonth: string) {
    router.push(`/daily?date=${date}&month=${nextMonth}${selectedMemberQuery}`);
  }

  async function saveReport(formData: FormData) {
    await saveDailyReport(formData);
    router.refresh();
  }

  return (
    <div className="daily-layout">
      <div className="mobile-member-switcher" aria-label="Daily report owner view">
        {members.map((member) => (
          <button
            aria-pressed={selectedMemberId === member.id}
            className={
              selectedMemberId === member.id
                ? "member-switch active"
                : "member-switch"
            }
            key={member.id}
            onClick={() => {
              setSelectedMemberId(member.id);
              router.replace(
                `/daily?date=${date}&month=${month}&member=${member.slug}`,
                { scroll: false },
              );
            }}
            type="button"
          >
            <span>{member.name}</span>
            <b>
              {
                monthlyReports.filter((report) => report.member.id === member.id)
                  .length
              }
            </b>
          </button>
        ))}
      </div>

      <div className="daily-toolbar">
        <label className="date-picker">
          <CalendarDays aria-hidden="true" size={18} />
          <span>Date</span>
          <input
            aria-label="Report date"
            type="date"
            value={date}
            onChange={(event) => changeDate(event.target.value)}
          />
        </label>
        <label className="date-picker month-picker">
          <CalendarDays aria-hidden="true" size={18} />
          <span>Month</span>
          <input
            aria-label="Report month"
            type="month"
            value={month}
            onChange={(event) => changeMonth(event.target.value)}
          />
        </label>
      </div>

      <div className="report-grid">
        {members.map((member) => (
          <form
            action={saveReport}
            className={
              selectedMemberId === member.id
                ? "report-card selected"
                : "report-card"
            }
            key={member.id}
          >
            <input name="memberId" type="hidden" value={member.id} />
            <input name="workDate" type="hidden" value={date} />
            <div className="member-heading report-heading">
              <span
                aria-hidden="true"
                className="member-dot"
                style={{ backgroundColor: member.accent }}
              />
              <div>
                <h2>{member.name}</h2>
                <p>{member.role}</p>
              </div>
            </div>

            <fieldset className="attendance-group">
              <legend>Attendance</legend>
              <div className="segmented-control">
                {attendanceOptions.map((option) => (
                  <label key={option.value}>
                    <input
                      defaultChecked={member.report.attendance === option.value}
                      name="attendance"
                      type="radio"
                      value={option.value}
                    />
                    <span>{option.label}</span>
                  </label>
                ))}
              </div>
            </fieldset>

            <label className="field text-field">
              <span>Morning plan</span>
              <textarea
                className="points-textarea"
                defaultValue={member.report.morningPlan}
                name="morningPlan"
                onFocus={startBulletList}
                onKeyDown={continueBulletList}
                placeholder={"- Meeting point\n- Planned work"}
                rows={5}
              />
            </label>

            <label className="field text-field">
              <span>Evening report</span>
              <textarea
                className="points-textarea"
                defaultValue={member.report.eveningReport}
                name="eveningReport"
                onFocus={startBulletList}
                onKeyDown={continueBulletList}
                placeholder={"- Completed work\n- Blockers or follow-up"}
                rows={5}
              />
            </label>

            <SaveButton />
          </form>
        ))}
      </div>

      <MonthlyReportView month={month} reports={selectedMemberReports} />
    </div>
  );
}

function startBulletList(event: FocusEvent<HTMLTextAreaElement>) {
  const textarea = event.currentTarget;

  if (textarea.value.trim()) {
    return;
  }

  textarea.value = "- ";
  textarea.setSelectionRange(textarea.value.length, textarea.value.length);
}

function continueBulletList(event: KeyboardEvent<HTMLTextAreaElement>) {
  if (event.key !== "Enter") {
    return;
  }

  event.preventDefault();

  const textarea = event.currentTarget;
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const value = textarea.value;
  const insertion = "\n- ";
  textarea.value = `${value.slice(0, start)}${insertion}${value.slice(end)}`;
  const nextCursor = start + insertion.length;
  textarea.setSelectionRange(nextCursor, nextCursor);
}

function MonthlyReportView({
  month,
  reports,
}: {
  month: string;
  reports: MonthlyReportEntry[];
}) {
  const groupedReports = useMemo(() => {
    const groups = new Map<string, MonthlyReportEntry[]>();

    for (const report of reports) {
      const dateReports = groups.get(report.workDate) ?? [];
      dateReports.push(report);
      groups.set(report.workDate, dateReports);
    }

    return Array.from(groups.entries());
  }, [reports]);

  return (
    <section className="monthly-report">
      <div className="monthly-header">
        <div>
          <p className="eyebrow">Month View</p>
          <h2>{formatMonth(month)}</h2>
        </div>
      </div>

      {groupedReports.length === 0 ? (
        <p className="monthly-empty">No reports saved for this month.</p>
      ) : (
        <div className="month-list">
          {groupedReports.map(([workDate, dateReports]) => (
            <article className="month-day" key={workDate}>
              <h3>{formatDay(workDate)}</h3>
              <div className="month-report-grid">
                {dateReports.map((report) => (
                  <div className="month-report" key={report.id}>
                    <div className="month-report-heading">
                      <span
                        aria-hidden="true"
                        className="member-dot"
                        style={{ backgroundColor: report.member.accent }}
                      />
                      <div>
                        <h4>{report.member.name}</h4>
                        <p>{report.member.role}</p>
                      </div>
                      <span className="attendance-pill">
                        {formatAttendance(report.attendance)}
                      </span>
                    </div>
                    <PointBlock label="Morning" text={report.morningPlan} />
                    <PointBlock label="Evening" text={report.eveningReport} />
                  </div>
                ))}
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

function PointBlock({ label, text }: { label: string; text: string }) {
  const points = text
    .split(/\r?\n/)
    .map((line) => line.trim().replace(/^[-*]\s*/, ""))
    .filter(Boolean);

  return (
    <div className="point-block">
      <h5>{label}</h5>
      {points.length > 0 ? (
        <ul className="point-list">
          {points.map((point, index) => (
            <li key={`${point}-${index}`}>{point}</li>
          ))}
        </ul>
      ) : (
        <p className="point-empty">No points added.</p>
      )}
    </div>
  );
}

function formatMonth(month: string) {
  return new Intl.DateTimeFormat("en", {
    month: "long",
    year: "numeric",
  }).format(new Date(`${month}-01T00:00:00`));
}

function formatDay(date: string) {
  return new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "short",
    weekday: "short",
  }).format(new Date(`${date}T00:00:00`));
}

function formatAttendance(attendance: string) {
  return attendance
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function SaveButton() {
  const { pending } = useFormStatus();

  return (
    <button className="primary-button report-save" disabled={pending}>
      {pending ? (
        <Loader2 aria-hidden="true" className="spin" size={18} />
      ) : (
        <Save aria-hidden="true" size={18} />
      )}
      <span>Save</span>
    </button>
  );
}

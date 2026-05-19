import {
  AttendanceStatus,
  TodoStatus,
} from "@/generated/prisma/enums";
import { getMonthRange, getWorkDateFromInput, toInputDate } from "@/lib/dates";
import { TEAM_MEMBERS } from "@/lib/members";
import { prisma } from "@/lib/prisma";

export async function ensureMembers() {
  await Promise.all(
    TEAM_MEMBERS.map((member) =>
      prisma.member.upsert({
        where: {
          slug: member.slug,
        },
        create: member,
        update: {
          name: member.name,
          role: member.role,
          accent: member.accent,
        },
      }),
    ),
  );

  return prisma.member.findMany({
    orderBy: {
      slug: "asc",
    },
  });
}

export type TodoPageMember = Awaited<ReturnType<typeof getTodoPageData>>[number];
export type TodoHistoryItem = Awaited<ReturnType<typeof getTodoHistoryData>>[number];

export async function getTodoPageData() {
  await ensureMembers();

  const members = await prisma.member.findMany({
    orderBy: {
      slug: "asc",
    },
    include: {
      todos: {
        where: {
          status: TodoStatus.PENDING,
        },
        orderBy: [
          {
            priority: "asc",
          },
          {
            createdAt: "asc",
          },
        ],
      },
    },
  });

  return members.map((member) => ({
    id: member.id,
    slug: member.slug,
    name: member.name,
    role: member.role,
    accent: member.accent,
    todos: member.todos.map((todo) => ({
      id: todo.id,
      title: todo.title,
      details: todo.details,
      priority: todo.priority,
    })),
  }));
}

export async function getTodoHistoryData() {
  await ensureMembers();

  const todos = await prisma.todo.findMany({
    where: {
      status: {
        in: [TodoStatus.DONE, TodoStatus.DELETED],
      },
    },
    include: {
      member: true,
    },
    orderBy: [
      {
        updatedAt: "desc",
      },
      {
        createdAt: "desc",
      },
    ],
    take: 100,
  });

  return todos.map((todo) => ({
    id: todo.id,
    title: todo.title,
    details: todo.details,
    status: todo.status,
    completedAt: todo.completedAt?.toISOString() ?? null,
    deletedAt: todo.deletedAt?.toISOString() ?? null,
    updatedAt: todo.updatedAt.toISOString(),
    member: {
      id: todo.member.id,
      name: todo.member.name,
      role: todo.member.role,
      accent: todo.member.accent,
    },
  }));
}

export type DailyReportMember = Awaited<ReturnType<typeof getDailyPageData>>[number];

export async function getDailyPageData(dateInput: string) {
  const workDate = getWorkDateFromInput(dateInput);
  const members = await ensureMembers();
  const reports = await prisma.dailyReport.findMany({
    where: {
      workDate,
    },
  });

  const reportsByMember = new Map(
    reports.map((report) => [report.memberId, report]),
  );

  return members.map((member) => {
    const report = reportsByMember.get(member.id);

    return {
      id: member.id,
      slug: member.slug,
      name: member.name,
      role: member.role,
      accent: member.accent,
      report: {
        id: report?.id ?? null,
        workDate: report ? toInputDate(report.workDate) : dateInput,
        attendance: report?.attendance ?? AttendanceStatus.PRESENT,
        morningPlan: report?.morningPlan ?? "",
        eveningReport: report?.eveningReport ?? "",
      },
    };
  });
}

export type MonthlyReportEntry = Awaited<ReturnType<typeof getMonthlyReportData>>[number];

export async function getMonthlyReportData(monthInput: string) {
  await ensureMembers();

  const { start, end } = getMonthRange(monthInput);
  const reports = await prisma.dailyReport.findMany({
    where: {
      workDate: {
        gte: start,
        lt: end,
      },
    },
    include: {
      member: true,
    },
    orderBy: [
      {
        workDate: "desc",
      },
      {
        member: {
          slug: "asc",
        },
      },
    ],
  });

  return reports.map((report) => ({
    id: report.id,
    workDate: toInputDate(report.workDate),
    attendance: report.attendance,
    morningPlan: report.morningPlan,
    eveningReport: report.eveningReport,
    member: {
      id: report.member.id,
      name: report.member.name,
      role: report.member.role,
      accent: report.member.accent,
    },
  }));
}

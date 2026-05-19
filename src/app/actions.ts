"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import {
  AttendanceStatus,
  TodoStatus,
} from "@/generated/prisma/enums";
import { getWorkDateFromInput } from "@/lib/dates";
import { ensureMembers } from "@/lib/data";
import { prisma } from "@/lib/prisma";

const reorderSchema = z.object({
  memberId: z.string().min(1),
  orderedIds: z.array(z.string().min(1)),
});

const attendanceSchema = z.enum([
  AttendanceStatus.PRESENT,
  AttendanceStatus.ABSENT,
  AttendanceStatus.HALF_DAY,
  AttendanceStatus.LEAVE,
]);

function readString(formData: FormData, field: string) {
  const value = formData.get(field);
  return typeof value === "string" ? value.trim() : "";
}

export async function createTodo(formData: FormData) {
  await ensureMembers();

  const title = readString(formData, "title");
  const details = readString(formData, "details");
  const memberId = readString(formData, "memberId");

  if (!title || !memberId) {
    return;
  }

  const maxPriority = await prisma.todo.aggregate({
    where: {
      memberId,
      status: TodoStatus.PENDING,
    },
    _max: {
      priority: true,
    },
  });

  await prisma.todo.create({
    data: {
      title,
      details: details || null,
      memberId,
      priority: (maxPriority._max.priority ?? 0) + 1,
    },
  });

  revalidatePath("/todos");
}

export async function updateTodo(formData: FormData) {
  const todoId = readString(formData, "todoId");
  const title = readString(formData, "title");
  const details = readString(formData, "details");

  if (!todoId || !title) {
    return;
  }

  await prisma.todo.update({
    where: {
      id: todoId,
    },
    data: {
      title,
      details: details || null,
    },
  });

  revalidatePath("/todos");
}

export async function reorderTodos(input: unknown) {
  const { memberId, orderedIds } = reorderSchema.parse(input);

  await prisma.$transaction(
    orderedIds.map((id, index) =>
      prisma.todo.updateMany({
        where: {
          id,
          memberId,
          status: TodoStatus.PENDING,
        },
        data: {
          priority: index + 1,
        },
      }),
    ),
  );

  revalidatePath("/todos");
}

export async function completeTodo(todoId: string) {
  if (!todoId) {
    return;
  }

  await prisma.todo.update({
    where: {
      id: todoId,
    },
    data: {
      status: TodoStatus.DONE,
      completedAt: new Date(),
    },
  });

  revalidatePath("/todos");
}

export async function deleteTodo(todoId: string) {
  if (!todoId) {
    return;
  }

  await prisma.todo.delete({
    where: {
      id: todoId,
    },
  });

  revalidatePath("/todos");
}

export async function saveDailyReport(formData: FormData) {
  await ensureMembers();

  const memberId = readString(formData, "memberId");
  const workDateInput = readString(formData, "workDate");
  const attendance = attendanceSchema.catch(AttendanceStatus.PRESENT).parse(
    readString(formData, "attendance"),
  );
  const morningPlan = readString(formData, "morningPlan");
  const eveningReport = readString(formData, "eveningReport");

  if (!memberId || !workDateInput) {
    return;
  }

  const workDate = getWorkDateFromInput(workDateInput);

  await prisma.dailyReport.upsert({
    where: {
      memberId_workDate: {
        memberId,
        workDate,
      },
    },
    create: {
      memberId,
      workDate,
      attendance,
      morningPlan,
      eveningReport,
    },
    update: {
      attendance,
      morningPlan,
      eveningReport,
    },
  });

  revalidatePath("/daily");
  revalidatePath(`/daily?date=${workDateInput}`);
}

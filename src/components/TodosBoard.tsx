"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Check,
  GripVertical,
  Loader2,
  Pencil,
  Plus,
  Save,
  Trash2,
  X,
} from "lucide-react";
import {
  completeTodo,
  createTodo,
  deleteTodo,
  reorderTodos,
  updateTodo,
} from "@/app/actions";
import type { TodoPageMember } from "@/lib/data";

type Todo = TodoPageMember["todos"][number];

type MemberGroup = {
  id: string;
  slug: string;
  name: string;
  role: string;
  accent: string;
  todos: Todo[];
};

type TodosBoardProps = {
  members: TodoPageMember[];
  selectedMemberSlug?: string;
};

function buildGroups(members: TodoPageMember[]) {
  return members.reduce<Record<string, MemberGroup>>((groups, member) => {
    groups[member.id] = {
      id: member.id,
      slug: member.slug,
      name: member.name,
      role: member.role,
      accent: member.accent,
      todos: member.todos,
    };

    return groups;
  }, {});
}

export function TodosBoard({ members, selectedMemberSlug }: TodosBoardProps) {
  const router = useRouter();
  const [groups, setGroups] = useState(() => buildGroups(members));
  const [selectedMemberId, setSelectedMemberId] = useState(
    members.find((member) => member.slug === selectedMemberSlug)?.id ??
      members[0]?.id ??
      "",
  );
  const [openAddFor, setOpenAddFor] = useState<string | null>(null);
  const [isOrdering, startOrdering] = useTransition();

  const memberList = useMemo(() => Object.values(groups), [groups]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 120,
        tolerance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  function findMemberByTodo(todoId: string) {
    return memberList.find((member) =>
      member.todos.some((todo) => todo.id === todoId),
    );
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    const activeMember = findMemberByTodo(String(active.id));
    const overMember = findMemberByTodo(String(over.id));

    if (!activeMember || !overMember || activeMember.id !== overMember.id) {
      return;
    }

    const oldIndex = activeMember.todos.findIndex(
      (todo) => todo.id === active.id,
    );
    const newIndex = activeMember.todos.findIndex((todo) => todo.id === over.id);

    if (oldIndex < 0 || newIndex < 0) {
      return;
    }

    const orderedTodos = arrayMove(activeMember.todos, oldIndex, newIndex);

    setGroups((current) => ({
      ...current,
      [activeMember.id]: {
        ...current[activeMember.id],
        todos: orderedTodos,
      },
    }));

    startOrdering(async () => {
      await reorderTodos({
        memberId: activeMember.id,
        orderedIds: orderedTodos.map((todo) => todo.id),
      });
      router.refresh();
    });
  }

  return (
    <div className="todos-layout">
      <div className="mobile-member-switcher" aria-label="Todo owner view">
        {memberList.map((member) => (
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
              setOpenAddFor(null);
              router.replace(`/todos?member=${member.slug}`, { scroll: false });
            }}
            type="button"
          >
            <span>{member.name}</span>
            <b>{member.todos.length}</b>
          </button>
        ))}
      </div>

      <DndContext
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
        sensors={sensors}
      >
        <div className="todo-columns">
          {memberList.map((member) => (
            <section
              className={
                selectedMemberId === member.id
                  ? "todo-column selected"
                  : "todo-column"
              }
              key={member.id}
            >
              <div className="member-heading">
                <span
                  aria-hidden="true"
                  className="member-dot"
                  style={{ backgroundColor: member.accent }}
                />
                <div>
                  <h2>{member.name}</h2>
                  <p>{member.role}</p>
                </div>
                <div className="member-actions">
                  <span className="count-badge">{member.todos.length}</span>
                  <button
                    aria-label={`Add todo for ${member.name}`}
                    className="icon-button add-toggle"
                    onClick={() =>
                      setOpenAddFor((current) =>
                        current === member.id ? null : member.id,
                      )
                    }
                    type="button"
                  >
                    <Plus aria-hidden="true" size={18} />
                  </button>
                </div>
              </div>

              {openAddFor === member.id ? (
                <AddTodoForm
                  memberId={member.id}
                  memberName={member.name}
                  onCancel={() => setOpenAddFor(null)}
                  onSaved={() => {
                    setOpenAddFor(null);
                    router.refresh();
                  }}
                />
              ) : null}

              <SortableContext
                items={member.todos.map((todo) => todo.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="todo-list">
                  {member.todos.map((todo) => (
                    <SortableTodoCard
                      key={todo.id}
                      todo={todo}
                      onChange={() => router.refresh()}
                    />
                  ))}
                </div>
              </SortableContext>

              {member.todos.length === 0 ? (
                <p className="empty-state">No pending todos.</p>
              ) : null}
            </section>
          ))}
        </div>
      </DndContext>

      {isOrdering ? <div className="sync-note">Saving order...</div> : null}
    </div>
  );
}

function AddTodoForm({
  memberId,
  memberName,
  onCancel,
  onSaved,
}: {
  memberId: string;
  memberName: string;
  onCancel: () => void;
  onSaved: () => void;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [isAdding, startAdding] = useTransition();

  async function handleAddTodo(formData: FormData) {
    startAdding(async () => {
      await createTodo(formData);
      formRef.current?.reset();
      onSaved();
    });
  }

  return (
    <form action={handleAddTodo} className="column-add-form" ref={formRef}>
      <input name="memberId" type="hidden" value={memberId} />
      <label className="field">
        <span>Todo</span>
        <input
          aria-label={`New todo for ${memberName}`}
          name="title"
          placeholder="Add pending work"
          required
          maxLength={140}
        />
      </label>
      <div className="column-add-actions">
        <button
          aria-label={`Cancel todo for ${memberName}`}
          className="icon-button"
          onClick={onCancel}
          type="button"
        >
          <X aria-hidden="true" size={18} />
        </button>
        <button className="primary-button compact-button" disabled={isAdding}>
          {isAdding ? (
            <Loader2 aria-hidden="true" className="spin" size={18} />
          ) : (
            <Plus aria-hidden="true" size={18} />
          )}
          <span>Add</span>
        </button>
      </div>
    </form>
  );
}

function SortableTodoCard({
  todo,
  onChange,
}: {
  todo: Todo;
  onChange: () => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [isPending, startTransition] = useTransition();
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: todo.id, disabled: isEditing });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };
  const cardClassName = [
    "todo-card",
    isDragging ? "dragging" : "",
    isEditing ? "editing" : "",
  ]
    .filter(Boolean)
    .join(" ");

  function saveTodo(formData: FormData) {
    startTransition(async () => {
      await updateTodo(formData);
      setIsEditing(false);
      onChange();
    });
  }

  function finishTodo() {
    startTransition(async () => {
      await completeTodo(todo.id);
      onChange();
    });
  }

  function removeTodo() {
    startTransition(async () => {
      await deleteTodo(todo.id);
      onChange();
    });
  }

  return (
    <article
      className={cardClassName}
      ref={setNodeRef}
      style={style}
    >
      <button
        aria-label={`Reorder ${todo.title}`}
        className="icon-button drag-handle"
        disabled={isEditing}
        type="button"
        {...attributes}
        {...listeners}
      >
        <GripVertical aria-hidden="true" size={18} />
      </button>
      {isEditing ? (
        <form action={saveTodo} className="todo-edit-form">
          <input name="todoId" type="hidden" value={todo.id} />
          <label className="field">
            <span>Todo</span>
            <input
              autoFocus
              defaultValue={todo.title}
              name="title"
              required
              maxLength={140}
            />
          </label>
          <label className="field">
            <span>Note</span>
            <input
              defaultValue={todo.details ?? ""}
              name="details"
              placeholder="Optional details"
              maxLength={140}
            />
          </label>
          <div className="todo-edit-actions">
            <button
              aria-label={`Cancel editing ${todo.title}`}
              className="icon-button"
              disabled={isPending}
              onClick={() => setIsEditing(false)}
              type="button"
            >
              <X aria-hidden="true" size={18} />
            </button>
            <button className="primary-button compact-button" disabled={isPending}>
              {isPending ? (
                <Loader2 aria-hidden="true" className="spin" size={18} />
              ) : (
                <Save aria-hidden="true" size={18} />
              )}
              <span>Save</span>
            </button>
          </div>
        </form>
      ) : (
        <>
          <div className="todo-copy">
            <p>{todo.title}</p>
            {todo.details ? <span>{todo.details}</span> : null}
          </div>
          <div className="todo-actions">
            <button
              aria-label={`Edit ${todo.title}`}
              className="icon-button edit-button"
              disabled={isPending}
              onClick={() => setIsEditing(true)}
              type="button"
            >
              <Pencil aria-hidden="true" size={17} />
            </button>
            <button
              aria-label={`Complete ${todo.title}`}
              className="icon-button done-button"
              disabled={isPending}
              onClick={finishTodo}
              type="button"
            >
              <Check aria-hidden="true" size={18} />
            </button>
            <button
              aria-label={`Delete ${todo.title}`}
              className="icon-button danger-button"
              disabled={isPending}
              onClick={removeTodo}
              type="button"
            >
              <Trash2 aria-hidden="true" size={17} />
            </button>
          </div>
        </>
      )}
    </article>
  );
}

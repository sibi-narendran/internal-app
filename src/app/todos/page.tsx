import { TodosBoard } from "@/components/TodosBoard";
import { TodoStatus } from "@/generated/prisma/enums";
import {
  getTodoHistoryData,
  getTodoPageData,
  type TodoHistoryItem,
  type TodoPageMember,
} from "@/lib/data";

export const dynamic = "force-dynamic";

type TodosPageProps = {
  searchParams: Promise<{
    member?: string;
  }>;
};

export default async function TodosPage({ searchParams }: TodosPageProps) {
  const params = await searchParams;
  const [members, history] = await Promise.all([
    getTodoPageData(),
    getTodoHistoryData(),
  ]);
  const boardKey = JSON.stringify(
    members.map((member) => ({
      id: member.id,
      todos: member.todos.map((todo) => ({
        id: todo.id,
        title: todo.title,
        details: todo.details,
      })),
    })),
  );

  return (
    <section className="page">
      <header className="page-header">
        <div>
          <p className="eyebrow">Priorities</p>
          <h1>Pending Todos</h1>
        </div>
      </header>
      <TodosBoard
        key={`${boardKey}:${params.member ?? ""}`}
        members={members}
        selectedMemberSlug={params.member}
      />
      <TodoHistory history={history} members={members} />
    </section>
  );
}

const historyDateFormatter = new Intl.DateTimeFormat("en-IN", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Asia/Kolkata",
});

function TodoHistory({
  history,
  members,
}: {
  history: TodoHistoryItem[];
  members: TodoPageMember[];
}) {
  const doneCount = history.filter(
    (todo) => todo.status === TodoStatus.DONE,
  ).length;
  const deletedCount = history.filter(
    (todo) => todo.status === TodoStatus.DELETED,
  ).length;
  const historyByMemberId = new Map(
    members.map((member) => [
      member.id,
      history.filter((todo) => todo.member.id === member.id),
    ]),
  );

  return (
    <section className="todo-history" aria-labelledby="todo-history-heading">
      <header className="history-header">
        <div>
          <p className="eyebrow">Archive</p>
          <h2 id="todo-history-heading">Done & Deleted</h2>
        </div>
        <div className="history-counts" aria-label="Archive counts">
          <span>Done {doneCount}</span>
          <span>Deleted {deletedCount}</span>
        </div>
      </header>

      <div className="history-person-grid">
        {members.map((member) => {
          const memberHistory = historyByMemberId.get(member.id) ?? [];
          const memberDoneCount = memberHistory.filter(
            (todo) => todo.status === TodoStatus.DONE,
          ).length;
          const memberDeletedCount = memberHistory.filter(
            (todo) => todo.status === TodoStatus.DELETED,
          ).length;

          return (
            <section className="history-person" key={member.id}>
              <header className="history-person-heading">
                <span
                  aria-hidden="true"
                  className="member-dot"
                  style={{ backgroundColor: member.accent }}
                />
                <div>
                  <h3>{member.name}</h3>
                  <p>{member.role}</p>
                </div>
                <div
                  className="history-person-counts"
                  aria-label={`${member.name} archive counts`}
                >
                  <span>Done {memberDoneCount}</span>
                  <span>Deleted {memberDeletedCount}</span>
                </div>
              </header>

              {memberHistory.length > 0 ? (
                <ol className="history-list">
                  {memberHistory.map((todo) => (
                    <TodoHistoryRow key={todo.id} todo={todo} />
                  ))}
                </ol>
              ) : (
                <p className="history-empty">No archive yet.</p>
              )}
            </section>
          );
        })}
      </div>
    </section>
  );
}

function TodoHistoryRow({ todo }: { todo: TodoHistoryItem }) {
  const isDone = todo.status === TodoStatus.DONE;
  const statusLabel = isDone ? "Done" : "Deleted";
  const eventDate = todo.completedAt ?? todo.deletedAt ?? todo.updatedAt;

  return (
    <li className="history-card">
      <span
        aria-hidden="true"
        className="member-dot"
        style={{ backgroundColor: todo.member.accent }}
      />
      <div className="history-copy">
        <div className="history-title-row">
          <p>{todo.title}</p>
          <span
            className={
              isDone
                ? "history-status history-status-done"
                : "history-status history-status-deleted"
            }
          >
            {statusLabel}
          </span>
        </div>
        {todo.details ? <span>{todo.details}</span> : null}
        <div className="history-meta">
          <b>{todo.member.name}</b>
          <time dateTime={eventDate}>
            {historyDateFormatter.format(new Date(eventDate))}
          </time>
        </div>
      </div>
    </li>
  );
}

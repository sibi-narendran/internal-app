import { TodosBoard } from "@/components/TodosBoard";
import { getTodoPageData } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function TodosPage() {
  const members = await getTodoPageData();
  const boardKey = members
    .map((member) => `${member.id}:${member.todos.map((todo) => todo.id).join(",")}`)
    .join("|");

  return (
    <section className="page">
      <header className="page-header">
        <div>
          <p className="eyebrow">Priorities</p>
          <h1>Pending Todos</h1>
        </div>
      </header>
      <TodosBoard key={boardKey} members={members} />
    </section>
  );
}

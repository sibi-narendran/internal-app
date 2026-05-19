import { TodosBoard } from "@/components/TodosBoard";
import { getTodoPageData } from "@/lib/data";

export const dynamic = "force-dynamic";

type TodosPageProps = {
  searchParams: Promise<{
    member?: string;
  }>;
};

export default async function TodosPage({ searchParams }: TodosPageProps) {
  const params = await searchParams;
  const members = await getTodoPageData();
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
    </section>
  );
}

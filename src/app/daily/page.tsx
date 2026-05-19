import { DailyReportClient } from "@/components/DailyReportClient";
import { getDailyPageData, getMonthlyReportData } from "@/lib/data";
import { getMonthInputFromDateInput, todayInputDate } from "@/lib/dates";

export const dynamic = "force-dynamic";

type DailyPageProps = {
  searchParams: Promise<{
    date?: string;
    month?: string;
  }>;
};

export default async function DailyPage({ searchParams }: DailyPageProps) {
  const params = await searchParams;
  const date = params.date ?? todayInputDate();
  const month = params.month ?? getMonthInputFromDateInput(date);
  const [members, monthlyReports] = await Promise.all([
    getDailyPageData(date),
    getMonthlyReportData(month),
  ]);

  return (
    <section className="page">
      <header className="page-header page-header-row">
        <div>
          <p className="eyebrow">Attendance</p>
          <h1>Daily Work Report</h1>
        </div>
      </header>
      <DailyReportClient
        date={date}
        members={members}
        month={month}
        monthlyReports={monthlyReports}
      />
    </section>
  );
}

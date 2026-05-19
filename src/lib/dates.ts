export function todayInputDate() {
  const now = new Date();
  const year = now.getFullYear();
  const month = `${now.getMonth() + 1}`.padStart(2, "0");
  const day = `${now.getDate()}`.padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function getWorkDateFromInput(input: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input)) {
    return getWorkDateFromInput(todayInputDate());
  }

  return new Date(`${input}T00:00:00.000Z`);
}

export function getMonthInputFromDateInput(input: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input)) {
    return todayInputDate().slice(0, 7);
  }

  return input.slice(0, 7);
}

export function getMonthRange(input: string) {
  const monthInput = /^\d{4}-\d{2}$/.test(input)
    ? input
    : todayInputDate().slice(0, 7);
  const [year, month] = monthInput.split("-").map(Number);

  return {
    monthInput,
    start: new Date(Date.UTC(year, month - 1, 1)),
    end: new Date(Date.UTC(year, month, 1)),
  };
}

export function toInputDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

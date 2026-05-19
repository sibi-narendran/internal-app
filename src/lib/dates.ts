export function todayInputDate() {
  const now = new Date();
  const year = now.getFullYear();
  const month = `${now.getMonth() + 1}`.padStart(2, "0");
  const day = `${now.getDate()}`.padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function normalizeDateInput(input: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input)) {
    return todayInputDate();
  }

  const [year, month, day] = input.split("-").map(Number);
  const parsed = new Date(Date.UTC(year, month - 1, day));

  if (
    parsed.getUTCFullYear() !== year ||
    parsed.getUTCMonth() !== month - 1 ||
    parsed.getUTCDate() !== day
  ) {
    return todayInputDate();
  }

  return input;
}

export function getWorkDateFromInput(input: string) {
  return new Date(`${normalizeDateInput(input)}T00:00:00.000Z`);
}

export function getMonthInputFromDateInput(input: string) {
  return normalizeDateInput(input).slice(0, 7);
}

export function normalizeMonthInput(input: string) {
  if (!/^\d{4}-\d{2}$/.test(input)) {
    return todayInputDate().slice(0, 7);
  }

  const [, month] = input.split("-").map(Number);

  if (month < 1 || month > 12) {
    return todayInputDate().slice(0, 7);
  }

  return input;
}

export function getMonthRange(input: string) {
  const monthInput = normalizeMonthInput(input);
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

import type { Priority } from "../components/PriorityPicker";

export type Task = {
  id: string;
  title: string;
  description: string;
  priority: Priority;
  dueDate: string | null;
  completed: boolean;
  createdAt: number;
  parentId: string | null;
};

export type View =
  "inbox" | "today" | "upcoming" | "overdue" | "completed" | "calendar";
export type Status = "all" | "active" | "done";
export type Sort = "due" | "priority" | "newest" | "title";
export type VisibleRow = { task: Task; depth: number; contextOnly: boolean };
export type Draft = {
  title: string;
  description: string;
  dueDate: string;
  priority: Priority;
};

export const TASKS_PER_PAGE = 40;
export const emptyDraft: Draft = {
  title: "",
  description: "",
  dueDate: "",
  priority: "medium",
};

export function localDay(date: Date): string {
  const year = date.getFullYear();
  return `${year}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function dayOffset(n: number): string {
  const date = new Date();
  date.setDate(date.getDate() + n);
  return localDay(date);
}

export function taskCountLabel(count: number): string {
  const lastTwo = count % 100;
  const last = count % 10;
  const word =
    lastTwo >= 11 && lastTwo <= 14
      ? "задач"
      : last === 1
        ? "задача"
        : last >= 2 && last <= 4
          ? "задачи"
          : "задач";
  return `${count} ${word}`;
}

export function shiftMonth(month: string, amount: number): string {
  const date = new Date(`${month}-01T12:00:00`);
  date.setMonth(date.getMonth() + amount);
  return localDay(date).slice(0, 7);
}

export function calendarCells(month: string): string[] {
  const first = new Date(`${month}-01T12:00:00`);
  const mondayOffset = (first.getDay() + 6) % 7;
  const daysInMonth = new Date(
    first.getFullYear(),
    first.getMonth() + 1,
    0,
  ).getDate();
  const cellCount = Math.ceil((mondayOffset + daysInMonth) / 7) * 7;
  return Array.from({ length: cellCount }, (_, index) => {
    const cell = new Date(first);
    cell.setDate(1 + index - mondayOffset);
    return localDay(cell);
  });
}

export function makeTask(title: string, overrides: Partial<Task> = {}): Task {
  return {
    id:
      globalThis.crypto?.randomUUID?.() ??
      `task-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    title,
    description: "",
    priority: "medium",
    dueDate: null,
    completed: false,
    createdAt: Date.now(),
    parentId: null,
    ...overrides,
  };
}

export function demoTasks(): Task[] {
  const presentation = makeTask("Подготовить презентацию нового проекта", {
    priority: "high",
    dueDate: dayOffset(0),
  });
  return [
    makeTask("Согласовать финальный бриф", {
      priority: "high",
      dueDate: dayOffset(-1),
      description: "Подтвердить правки и сроки перед запуском проекта.",
    }),
    presentation,
    makeTask("Сверить ключевые тезисы", {
      priority: "medium",
      dueDate: dayOffset(0),
      parentId: presentation.id,
      description: "Согласовать итоговые цифры и структуру слайдов.",
    }),
    makeTask("Ответить на письма и сообщения", {
      priority: "medium",
      dueDate: dayOffset(0),
    }),
    makeTask("Обновить портфолио и кейсы", {
      priority: "high",
      dueDate: dayOffset(1),
    }),
    makeTask("Прочитать 20 страниц книги", {
      priority: "low",
      dueDate: dayOffset(2),
    }),
    makeTask("Спланировать задачи на неделю", {
      priority: "medium",
      dueDate: dayOffset(3),
    }),
    makeTask("Утренний кофе и план на день", {
      priority: "low",
      dueDate: dayOffset(0),
      completed: true,
    }),
    makeTask("Разобрать заметки после встречи", {
      priority: "medium",
      completed: true,
    }),
  ];
}

export function dueLabel(value: string | null): string | null {
  if (!value) return null;
  if (value === dayOffset(0)) return "Сегодня";
  if (value === dayOffset(1)) return "Завтра";
  const date = new Date(`${value}T12:00:00`);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString("ru-RU", { day: "numeric", month: "short" });
}

export function compareTasks(sort: Sort) {
  const priorityOrder: Record<Priority, number> = {
    high: 0,
    medium: 1,
    low: 2,
  };
  return (a: Task, b: Task) => {
    const completion = Number(a.completed) - Number(b.completed);
    if (completion) return completion;
    if (sort === "priority")
      return (
        priorityOrder[a.priority] - priorityOrder[b.priority] ||
        (a.dueDate ?? "9999").localeCompare(b.dueDate ?? "9999")
      );
    if (sort === "newest") return b.createdAt - a.createdAt;
    if (sort === "title") return a.title.localeCompare(b.title, "ru-RU");
    return (
      (a.dueDate ?? "9999").localeCompare(b.dueDate ?? "9999") ||
      priorityOrder[a.priority] - priorityOrder[b.priority] ||
      b.createdAt - a.createdAt
    );
  };
}

export function validTask(value: unknown): value is Task {
  if (!value || typeof value !== "object") return false;
  const task = value as Record<string, unknown>;
  return (
    typeof task.id === "string" &&
    typeof task.title === "string" &&
    typeof task.description === "string" &&
    ["high", "medium", "low"].includes(String(task.priority)) &&
    (task.dueDate === null ||
      (typeof task.dueDate === "string" &&
        /^\d{4}-\d{2}-\d{2}$/.test(task.dueDate))) &&
    typeof task.completed === "boolean" &&
    typeof task.createdAt === "number" &&
    (task.parentId === undefined ||
      task.parentId === null ||
      typeof task.parentId === "string")
  );
}

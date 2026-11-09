import { beforeEach, describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "../App";

beforeEach(() => {
  window.localStorage.clear();
  window.localStorage.setItem(
    "daymark:profile:v1",
    JSON.stringify({ name: "" }),
  );
});

describe("Daymark core workflows", () => {
  it("asks for an optional name only once and permits changing it later", async () => {
    window.localStorage.removeItem("daymark:profile:v1");
    const user = userEvent.setup();
    const { unmount } = render(<App />);
    expect(
      screen.getByRole("dialog", { name: "Давайте знакомиться" }),
    ).toBeInTheDocument();
    await user.type(screen.getByRole("textbox", { name: /Ваше имя/ }), "Мария");
    await user.click(screen.getByRole("button", { name: /Продолжить/ }));
    expect(screen.getByRole("heading", { name: /Мария/ })).toBeInTheDocument();
    unmount();
    render(<App />);
    expect(
      screen.queryByRole("dialog", { name: "Давайте знакомиться" }),
    ).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /Настроить имя/ }));
    await user.click(screen.getByRole("button", { name: "Без имени" }));
    expect(
      screen.queryByRole("heading", { name: /Мария/ }),
    ).not.toBeInTheDocument();
  });

  it("remembers the selected profile and keeps task lists separate after reload", async () => {
    const user = userEvent.setup();
    const { unmount } = render(<App />);
    const quickInput = screen.getByRole("textbox", {
      name: "Название новой задачи",
    });
    await user.type(quickInput, "Дела первого профиля{enter}");

    await user.click(
      screen.getByRole("button", {
        name: /Настроить имя и переключить профиль/,
      }),
    );
    await user.click(screen.getByRole("button", { name: "Добавить профиль" }));
    await user.type(
      screen.getByRole("textbox", { name: /Имя нового профиля/ }),
      "Мария",
    );
    await user.click(screen.getByRole("button", { name: /Создать профиль/ }));
    expect(screen.getByRole("heading", { name: /Мария/ })).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Открыть: Дела первого профиля" }),
    ).not.toBeInTheDocument();
    await user.type(
      screen.getByRole("textbox", { name: "Название новой задачи" }),
      "Дела Марии{enter}",
    );

    await user.click(
      screen.getByRole("button", {
        name: /Настроить имя и переключить профиль/,
      }),
    );
    await user.click(
      screen.getByRole("button", {
        name: "Переключить на профиль: Моё пространство",
      }),
    );
    expect(
      screen.getByRole("button", { name: "Открыть: Дела первого профиля" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Открыть: Дела Марии" }),
    ).not.toBeInTheDocument();

    await user.click(
      screen.getByRole("button", {
        name: /Настроить имя и переключить профиль/,
      }),
    );
    await user.type(
      screen.getByRole("textbox", { name: /Ваше имя/ }),
      "Алексей",
    );
    await user.click(screen.getByRole("button", { name: /Сохранить имя/ }));
    unmount();

    const next = render(<App />);
    expect(
      screen.getByRole("heading", { name: /Алексей/ }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Открыть: Дела первого профиля" }),
    ).toBeInTheDocument();
    await user.click(
      screen.getByRole("button", {
        name: /Настроить имя и переключить профиль/,
      }),
    );
    await user.click(
      screen.getByRole("button", { name: "Переключить на профиль: Мария" }),
    );
    expect(
      screen.getByRole("button", { name: "Открыть: Дела Марии" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Открыть: Дела первого профиля" }),
    ).not.toBeInTheDocument();
    next.unmount();
    render(<App />);
    expect(screen.getByRole("heading", { name: /Мария/ })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Открыть: Дела Марии" }),
    ).toBeInTheDocument();
    expect(
      JSON.parse(window.localStorage.getItem("daymark:tasks:v1") ?? "[]"),
    ).toHaveLength(1);
  });

  it("migrates legacy profile names and existing tasks without moving or deleting them", async () => {
    window.localStorage.setItem(
      "daymark:profile:v1",
      JSON.stringify({ name: "Старое имя" }),
    );
    window.localStorage.setItem(
      "daymark:tasks:v1",
      JSON.stringify([
        {
          id: "old-task",
          title: "Сохранённая задача",
          description: "",
          priority: "high",
          dueDate: null,
          completed: false,
          createdAt: 1,
          parentId: null,
        },
      ]),
    );
    const user = userEvent.setup();
    render(<App />);
    expect(
      screen.getByRole("heading", { name: /Старое имя/ }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Открыть: Сохранённая задача" }),
    ).toBeInTheDocument();
    await user.click(
      screen.getByRole("button", {
        name: /Настроить имя и переключить профиль/,
      }),
    );
    await user.click(screen.getByRole("button", { name: "Добавить профиль" }));
    await user.click(screen.getByRole("button", { name: /Создать профиль/ }));
    expect(screen.getByText("Здесь пока пусто")).toBeInTheDocument();
    await user.click(
      screen.getByRole("button", {
        name: /Настроить имя и переключить профиль/,
      }),
    );
    await user.click(
      screen.getByRole("button", {
        name: "Переключить на профиль: Старое имя",
      }),
    );
    expect(
      screen.getByRole("button", { name: "Открыть: Сохранённая задача" }),
    ).toBeInTheDocument();
    expect(
      JSON.parse(window.localStorage.getItem("daymark:tasks:v1") ?? "[]"),
    ).toHaveLength(1);
  });

  it("filters multiple priorities without leaving the current workspace", async () => {
    const user = userEvent.setup();
    render(<App />);
    fireEvent.click(
      screen.getByRole("button", { name: /Посмотреть на примере/i }),
    );
    await user.click(screen.getByRole("button", { name: /Сегодня 4/ }));
    expect(
      screen.getByRole("heading", { name: /Сегодня/ }),
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /Важные задачи/ }));
    expect(
      screen.getByRole("button", { name: /Важные задачи/ }),
    ).toHaveAttribute("aria-pressed", "true");
    expect(
      screen.getByRole("button", {
        name: "Открыть: Подготовить презентацию нового проекта",
      }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", {
        name: "Открыть: Ответить на письма и сообщения",
      }),
    ).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /Обычные задачи/ }));
    expect(
      screen.getByRole("button", { name: /Важные задачи/ }),
    ).toHaveAttribute("aria-pressed", "true");
    expect(
      screen.getByRole("button", { name: /Обычные задачи/ }),
    ).toHaveAttribute("aria-pressed", "true");
    expect(
      screen.getByRole("button", { name: "Сбросить фильтр" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", {
        name: "Открыть: Ответить на письма и сообщения",
      }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", {
        name: "Открыть: Утренний кофе и план на день",
      }),
    ).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /Календарь/ }));
    expect(
      screen.getByRole("heading", { name: /Задачи на/ }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Важные задачи/ }),
    ).toHaveAttribute("aria-pressed", "true");
    expect(
      screen.getByRole("button", { name: /Обычные задачи/ }),
    ).toHaveAttribute("aria-pressed", "true");
    await user.click(
      screen.getByRole("button", { name: "Убрать приоритет: Высокий" }),
    );
    expect(
      screen.getByRole("button", { name: /Важные задачи/ }),
    ).toHaveAttribute("aria-pressed", "false");
    expect(
      screen.getByRole("button", { name: /Обычные задачи/ }),
    ).toHaveAttribute("aria-pressed", "true");
    await user.click(screen.getByRole("button", { name: "Сбросить фильтр" }));
    expect(
      screen.queryByRole("button", { name: "Сбросить фильтр" }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", {
        name: "Открыть: Утренний кофе и план на день",
      }),
    ).toBeInTheDocument();
  });

  it("starts empty and offers an explicit demo dataset", () => {
    render(<App />);
    expect(screen.getByText("Здесь пока пусто")).toBeInTheDocument();
    fireEvent.click(
      screen.getByRole("button", { name: /Посмотреть на примере/i }),
    );
    expect(
      screen.getByRole("heading", { name: /Все задачи 9/i }),
    ).toBeInTheDocument();
  });

  it("creates, completes, filters and restores tasks after remounting", async () => {
    const user = userEvent.setup();
    const { unmount } = render(<App />);
    await user.type(
      screen.getByRole("textbox", { name: "Название новой задачи" }),
      "Проверить сценарии{enter}",
    );
    expect(
      screen.getByRole("button", { name: "Открыть: Проверить сценарии" }),
    ).toBeInTheDocument();
    await user.click(
      screen.getByRole("button", { name: "Выполнить: Проверить сценарии" }),
    );
    await user.click(screen.getByRole("button", { name: "В работе" }));
    expect(
      screen.queryByRole("button", { name: "Открыть: Проверить сценарии" }),
    ).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Готово" }));
    expect(
      screen.getByRole("button", { name: "Открыть: Проверить сценарии" }),
    ).toBeInTheDocument();
    unmount();
    render(<App />);
    expect(
      screen.getByRole("button", { name: "Открыть: Проверить сценарии" }),
    ).toBeInTheDocument();
  });

  it("edits a task, then returns keyboard focus to the original trigger", async () => {
    const user = userEvent.setup();
    render(<App />);
    const newButton = screen.getByRole("button", { name: "Новая задача" });
    await user.click(newButton);
    expect(
      screen.getByRole("dialog", { name: "Новая задача" }),
    ).toBeInTheDocument();
    await user.type(
      screen.getByRole("textbox", { name: "Название задачи" }),
      "Сделать аудит",
    );
    await user.click(
      screen.getByRole("combobox", { name: /Приоритет: Средний/ }),
    );
    await user.click(screen.getByRole("option", { name: "Высокий" }));
    await user.click(screen.getByRole("button", { name: "Создать задачу" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(newButton).toHaveFocus();
    await user.click(
      screen.getByRole("button", { name: "Редактировать: Сделать аудит" }),
    );
    await user.clear(screen.getByRole("textbox", { name: "Название задачи" }));
    await user.type(
      screen.getByRole("textbox", { name: "Название задачи" }),
      "Сделать UX-аудит",
    );
    await user.click(screen.getByRole("button", { name: "Сохранить" }));
    expect(
      screen.getByRole("button", { name: "Открыть: Сделать UX-аудит" }),
    ).toBeInTheDocument();
  });

  it("exposes the same priority icon in the sidebar, picker and task row, and supports keyboard selection", async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole("button", { name: "Новая задача" }));
    const picker = screen.getByRole("combobox", { name: /Приоритет: Средний/ });
    picker.focus();
    await user.keyboard("{ArrowUp}");
    expect(screen.getByRole("option", { name: "Низкий" })).toHaveFocus();
    await user.keyboard("{Enter}");
    expect(
      screen.getByRole("combobox", { name: /Приоритет: Низкий/ }),
    ).toHaveFocus();
    expect(
      screen.queryByRole("listbox", { name: "Приоритет" }),
    ).not.toBeInTheDocument();
    await user.type(
      screen.getByRole("textbox", { name: "Название задачи" }),
      "Пример приоритета",
    );
    await user.click(screen.getByRole("button", { name: "Создать задачу" }));
    expect(
      document.querySelector(".priority-legend .priority-icon.low"),
    ).toBeInTheDocument();
    expect(
      document.querySelector(".task-priority.low .priority-icon.low"),
    ).toBeInTheDocument();
  });

  it("supports undo after deleting a task", async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.type(
      screen.getByRole("textbox", { name: "Название новой задачи" }),
      "Вернуть задачу{enter}",
    );
    await user.click(
      screen.getByRole("button", { name: "Удалить: Вернуть задачу" }),
    );
    expect(
      screen.queryByRole("button", { name: "Открыть: Вернуть задачу" }),
    ).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Отменить" }));
    expect(
      screen.getByRole("button", { name: "Открыть: Вернуть задачу" }),
    ).toBeInTheDocument();
  });

  it("does not add empty or whitespace-only tasks", async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.type(
      screen.getByRole("textbox", { name: "Название новой задачи" }),
      "   ",
    );
    expect(screen.getByRole("button", { name: /Добавить$/ })).toBeDisabled();
    expect(screen.getByText("Здесь пока пусто")).toBeInTheDocument();
  });

  it("sets priority and a due date in quick add, then finds overdue work", async () => {
    const user = userEvent.setup();
    render(<App />);
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const past = [
      yesterday.getFullYear(),
      String(yesterday.getMonth() + 1).padStart(2, "0"),
      String(yesterday.getDate()).padStart(2, "0"),
    ].join("-");
    await user.click(
      screen.getByRole("combobox", { name: /Приоритет новой задачи: Средний/ }),
    );
    await user.click(screen.getByRole("option", { name: "Высокий" }));
    fireEvent.change(screen.getByLabelText("Срок новой задачи"), {
      target: { value: past },
    });
    await user.type(
      screen.getByRole("textbox", { name: "Название новой задачи" }),
      "Просроченный дедлайн{enter}",
    );
    await user.click(screen.getByRole("button", { name: /Просроченные 1/i }));
    expect(
      screen.getByRole("button", { name: "Открыть: Просроченный дедлайн" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Высокий", { selector: ".task-priority" }),
    ).toBeInTheDocument();
    expect(screen.getByText(/Просрочено/)).toBeInTheDocument();
  });

  it("keeps quick-added tasks in Today and Upcoming when their dates match", async () => {
    const user = userEvent.setup();
    render(<App />);
    fireEvent.click(
      screen.getByRole("button", { name: /Посмотреть на примере/i }),
    );
    await user.click(screen.getByRole("button", { name: /Сегодня 4/i }));
    expect(screen.getByLabelText("Срок новой задачи")).toHaveValue(
      new Date().toLocaleDateString("sv-SE"),
    );
    await user.type(
      screen.getByRole("textbox", { name: "Название новой задачи" }),
      "Новая задача на сегодня{enter}",
    );
    expect(
      screen.getByRole("heading", { name: /Сегодня/ }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Открыть: Новая задача на сегодня" }),
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /Предстоящие/ }));
    await user.type(
      screen.getByRole("textbox", { name: "Название новой задачи" }),
      "Новая задача на завтра{enter}",
    );
    expect(
      screen.getByRole("heading", { name: /Предстоящие/ }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Открыть: Новая задача на завтра" }),
    ).toBeInTheDocument();
  });

  it("creates a nested task and restores a deleted subtree", async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.type(
      screen.getByRole("textbox", { name: "Название новой задачи" }),
      "Подготовить релиз{enter}",
    );
    await user.click(
      screen.getByRole("button", {
        name: "Добавить подзадачу: Подготовить релиз",
      }),
    );
    expect(
      screen.getByRole("dialog", { name: "Новая подзадача" }),
    ).toBeInTheDocument();
    await user.type(
      screen.getByRole("textbox", { name: "Название задачи" }),
      "Проверить сборку",
    );
    await user.click(screen.getByRole("button", { name: "Создать задачу" }));
    expect(screen.getByText("0/1 подзадач")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Открыть: Проверить сборку" }),
    ).toBeInTheDocument();
    await user.click(
      screen.getByRole("button", {
        name: "Выполнить с подзадачами: Подготовить релиз",
      }),
    );
    expect(
      screen.getByRole("button", {
        name: "Вернуть в работу: Проверить сборку",
      }),
    ).toBeInTheDocument();
    await user.click(
      screen.getByRole("button", { name: "Удалить: Подготовить релиз" }),
    );
    expect(
      screen.queryByRole("button", { name: "Открыть: Проверить сборку" }),
    ).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Отменить" }));
    expect(
      screen.getByRole("button", { name: "Открыть: Проверить сборку" }),
    ).toBeInTheDocument();
  });

  it("opens a task from its row and shows a description preview", async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole("button", { name: "Новая задача" }));
    await user.type(
      screen.getByRole("textbox", { name: "Название задачи" }),
      "Исследовать UX",
    );
    await user.type(
      screen.getByRole("textbox", { name: /Описание/i }),
      "Проверить сценарии в мобильной версии",
    );
    await user.click(screen.getByRole("button", { name: "Создать задачу" }));
    expect(
      screen.getByText("Проверить сценарии в мобильной версии"),
    ).toBeInTheDocument();
    await user.click(
      screen.getByRole("button", { name: "Открыть: Исследовать UX" }),
    );
    expect(
      screen.getByRole("dialog", { name: "Редактировать задачу" }),
    ).toBeInTheDocument();
  });

  it("sorts parent tasks by priority and title", async () => {
    const user = userEvent.setup();
    render(<App />);
    const nameInput = screen.getByRole("textbox", {
      name: "Название новой задачи",
    });
    await user.click(
      screen.getByRole("combobox", { name: /Приоритет новой задачи: Средний/ }),
    );
    await user.click(screen.getByRole("option", { name: "Низкий" }));
    await user.type(nameInput, "Альфа{enter}");
    await user.click(
      screen.getByRole("combobox", { name: /Приоритет новой задачи: Средний/ }),
    );
    await user.click(screen.getByRole("option", { name: "Высокий" }));
    await user.type(nameInput, "Бета{enter}");
    await user.selectOptions(
      screen.getByRole("combobox", { name: "Сортировка задач" }),
      "priority",
    );
    expect(
      screen
        .getAllByRole("button", { name: /^Открыть:/ })
        .map((button) => button.getAttribute("aria-label")),
    ).toEqual(["Открыть: Бета", "Открыть: Альфа"]);
    await user.selectOptions(
      screen.getByRole("combobox", { name: "Сортировка задач" }),
      "title",
    );
    expect(
      screen
        .getAllByRole("button", { name: /^Открыть:/ })
        .map((button) => button.getAttribute("aria-label")),
    ).toEqual(["Открыть: Альфа", "Открыть: Бета"]);
  });

  it("keeps a 5,000-task list navigable without rendering every task", async () => {
    const tasks = Array.from({ length: 5000 }, (_, index) => ({
      id: `bulk-${index}`,
      title: `Задача ${index + 1}`,
      description: `Описание задачи ${index + 1}`,
      priority: "medium",
      dueDate: null,
      completed: false,
      createdAt: 5000 - index,
      parentId: null,
    }));
    window.localStorage.setItem("daymark:tasks:v1", JSON.stringify(tasks));

    render(<App />);

    expect(
      screen.getByRole("heading", { name: /Все задачи 5000/i }),
    ).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: /^Открыть:/ })).toHaveLength(
      40,
    );
    expect(screen.getByText("Показано 40 из 5000")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Показать ещё 40/i }));
    expect(screen.getAllByRole("button", { name: /^Открыть:/ })).toHaveLength(
      80,
    );
    expect(screen.getByText("Показано 80 из 5000")).toBeInTheDocument();

    fireEvent.change(screen.getByRole("textbox", { name: "Поиск задач" }), {
      target: { value: "Задача 4999" },
    });
    expect(screen.getAllByRole("button", { name: /^Открыть:/ })).toHaveLength(
      1,
    );
    expect(
      screen.getByRole("button", { name: "Открыть: Задача 4999" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Показать ещё/ }),
    ).not.toBeInTheDocument();
  });

  it("migrates existing v1 tasks without losing them", () => {
    window.localStorage.setItem(
      "daymark:tasks:v1",
      JSON.stringify([
        {
          id: "legacy",
          title: "Старый план",
          description: "",
          priority: "medium",
          dueDate: null,
          completed: false,
          createdAt: 123,
        },
      ]),
    );
    render(<App />);
    expect(
      screen.getByRole("button", { name: "Открыть: Старый план" }),
    ).toBeInTheDocument();
    const saved = JSON.parse(window.localStorage.getItem("daymark:tasks:v1")!);
    expect(saved[0].parentId).toBeNull();
  });
});

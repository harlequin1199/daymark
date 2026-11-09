import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    if (window.localStorage.getItem("daymark:profile:v1") === null) {
      window.localStorage.setItem(
        "daymark:profile:v1",
        JSON.stringify({ name: "" }),
      );
    }
  });
});

test("urgency accent is red only for overdue tasks", async ({ page }) => {
  await page.addInitScript(() => {
    const date = new Date();
    const toDay = (value: Date) =>
      `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}-${String(value.getDate()).padStart(2, "0")}`;
    const yesterday = new Date(date);
    yesterday.setDate(date.getDate() - 1);
    window.localStorage.setItem(
      "daymark:tasks:v1",
      JSON.stringify([
        {
          id: "overdue",
          title: "Просроченная",
          description: "",
          priority: "medium",
          dueDate: toDay(yesterday),
          completed: false,
          createdAt: 3,
          parentId: null,
        },
        {
          id: "today",
          title: "На сегодня",
          description: "",
          priority: "high",
          dueDate: toDay(date),
          completed: false,
          createdAt: 2,
          parentId: null,
        },
        {
          id: "no-date",
          title: "Без срока",
          description: "",
          priority: "low",
          dueDate: null,
          completed: false,
          createdAt: 1,
          parentId: null,
        },
      ]),
    );
  });
  await page.goto("/");

  const overdue = page.locator(".task-row").filter({ hasText: "Просроченная" });
  const today = page.locator(".task-row").filter({ hasText: "На сегодня" });
  const noDate = page.locator(".task-row").filter({ hasText: "Без срока" });
  await expect(overdue).toHaveCSS("border-left-color", "rgb(191, 66, 72)");
  await expect(today).toHaveCSS("border-left-color", "rgb(232, 230, 235)");
  await expect(noDate).toHaveCSS("border-left-color", "rgb(232, 230, 235)");
  await expect(overdue.locator(".task-due.overdue svg")).toHaveCount(1);
  await expect(today.locator(".task-due.today svg.lucide-flame")).toHaveCount(
    1,
  );
  await expect(
    overdue.locator(".task-priority.medium .priority-icon.medium"),
  ).toHaveCount(1);
  await expect(
    today.locator(".task-priority.high .priority-icon.high"),
  ).toHaveCount(1);
  await today.hover();
  await expect(today).toHaveCSS("border-left-color", "rgb(162, 139, 229)");
  await overdue.hover();
  await expect(overdue).toHaveCSS("border-left-color", "rgb(191, 66, 72)");
});

test("about dialog stays centered after scrolling", async ({
  page,
  isMobile,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: /Посмотреть на примере/ }).click();
  await page.evaluate(() => scrollTo(0, document.documentElement.scrollHeight));
  if (isMobile)
    await page.getByRole("button", { name: "Открыть меню" }).click();
  await page.getByRole("button", { name: /О приложении/ }).click();
  const dialog = page.getByRole("dialog", { name: /Меньше шума/ });
  await expect(dialog).toBeVisible();
  await dialog.evaluate(async (element) => {
    await Promise.all(
      element.getAnimations().map((animation) => animation.finished),
    );
  });
  const geometry = await dialog.evaluate((element) => {
    const rect = element.getBoundingClientRect();
    return {
      centerX: rect.left + rect.width / 2,
      centerY: rect.top + rect.height / 2,
      viewportX: innerWidth / 2,
      viewportY: innerHeight / 2,
    };
  });
  expect(Math.abs(geometry.centerX - geometry.viewportX)).toBeLessThan(12);
  expect(Math.abs(geometry.centerY - geometry.viewportY)).toBeLessThan(20);
});

test("priorities filter together and persist within every workspace", async ({
  page,
  isMobile,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: /Посмотреть на примере/ }).click();
  if (isMobile)
    await page.getByRole("button", { name: "Открыть меню" }).click();
  await page.getByRole("button", { name: /Сегодня 4/ }).click();
  await expect(page.getByRole("heading", { name: /Сегодня/ })).toBeVisible();
  if (isMobile)
    await page.getByRole("button", { name: "Открыть меню" }).click();
  await page.getByRole("button", { name: /Важные задачи/ }).click();
  await expect(
    page.getByRole("button", { name: "Сбросить фильтр" }),
  ).toBeVisible();
  await expect(page.locator(".task-row .task-priority:not(.high)")).toHaveCount(
    0,
  );
  await expect(page.getByRole("heading", { name: /Сегодня/ })).toBeVisible();
  if (isMobile)
    await page.getByRole("button", { name: "Открыть меню" }).click();
  await page.getByRole("button", { name: /Обычные задачи/ }).click();
  await expect(
    page.locator(".task-row .task-priority.medium").first(),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Убрать приоритет: Высокий" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Убрать приоритет: Средний" }),
  ).toBeVisible();
  if (isMobile)
    await page.getByRole("button", { name: "Открыть меню" }).click();
  await page.getByRole("button", { name: /Календарь/ }).click();
  await expect(page.getByRole("heading", { name: /Задачи на/ })).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Убрать приоритет: Средний" }),
  ).toBeVisible();
  const selectedDayCount = await page
    .locator(".calendar-day[aria-pressed='true'] .calendar-day-count")
    .innerText();
  expect(Number(selectedDayCount)).toBe(3);
  await page.getByRole("button", { name: "Убрать приоритет: Высокий" }).click();
  await expect(
    page.locator(".calendar-day[aria-pressed='true'] .calendar-day-count"),
  ).toHaveText("2");
  await page.getByRole("button", { name: "Сбросить фильтр" }).click();
  await expect(
    page.locator(".calendar-day[aria-pressed='true'] .calendar-day-count"),
  ).toHaveText("4");
});

test("calendar shows dated tasks and allows navigating days", async ({
  page,
  isMobile,
}) => {
  if (isMobile) await page.setViewportSize({ width: 320, height: 700 });
  await page.goto("/");
  await page.getByRole("button", { name: /Посмотреть на примере/ }).click();
  if (isMobile)
    await page.getByRole("button", { name: "Открыть меню" }).click();
  await page.getByRole("button", { name: /Календарь/ }).click();
  await expect(
    page.locator(".calendar-grid .calendar-day").first(),
  ).toBeVisible();
  await expect(page.getByRole("heading", { name: /Задачи на/ })).toBeVisible();
  await page.getByRole("button", { name: "Следующий месяц" }).click();
  await expect(page.getByText("На этот день задач нет")).toBeVisible();
  await page.getByRole("button", { name: "Сегодня", exact: true }).click();
  await expect(page.locator(".calendar-day[aria-pressed='true']")).toHaveCount(
    1,
  );
  await page.getByRole("button", { name: "Новая задача" }).click();
  await page
    .getByRole("textbox", { name: "Название задачи" })
    .fill("Задача из календаря");
  await expect(
    page.getByRole("dialog", { name: "Новая задача" }).locator("#task-date"),
  ).toHaveValue(
    await page.evaluate(() => {
      const today = new Date();
      return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
    }),
  );
  await page.getByRole("button", { name: "Создать задачу" }).click();
  await expect(
    page.getByRole("button", { name: "Открыть: Задача из календаря" }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth > innerWidth,
    ),
  ).toBe(false);
  const audit = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
    .analyze();
  expect(audit.violations).toEqual([]);
});

test("very long task text does not cause horizontal overflow", async ({
  page,
}) => {
  await page.addInitScript(() => {
    window.localStorage.setItem(
      "daymark:tasks:v1",
      JSON.stringify([
        {
          id: "very-long",
          title: "З".repeat(140),
          description: "о".repeat(500),
          priority: "high",
          dueDate: null,
          completed: false,
          createdAt: 1,
          parentId: null,
        },
      ]),
    );
  });
  await page.goto("/");
  await expect(page.locator(".task-row")).toHaveCount(1);
  for (const width of [320, 390]) {
    await page.setViewportSize({ width, height: 760 });
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > innerWidth,
    );
    expect(overflow).toBe(false);
  }
  const titleClamp = await page.locator(".task-title").evaluate((element) => ({
    clamp: getComputedStyle(element).webkitLineClamp,
    scrollHeight: element.scrollHeight,
    clientHeight: element.clientHeight,
  }));
  expect(titleClamp.clamp).toBe("2");
  expect(titleClamp.scrollHeight).toBeGreaterThan(titleClamp.clientHeight);
  const description = page.locator(".task-description");
  const lineClamp = await description.evaluate((element) => ({
    clamp: getComputedStyle(element).webkitLineClamp,
    scrollHeight: element.scrollHeight,
    clientHeight: element.clientHeight,
  }));
  expect(lineClamp.clamp).toBe("2");
  expect(lineClamp.scrollHeight).toBeGreaterThan(lineClamp.clientHeight);
  await page.locator(".task-row-open").click();
  await expect(
    page.getByRole("dialog", { name: "Редактировать задачу" }),
  ).toBeVisible();
  const modalOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth > innerWidth,
  );
  expect(modalOverflow).toBe(false);
});

test("5,000 tasks are searchable and displayed in manageable batches", async ({
  page,
}) => {
  await page.addInitScript(() => {
    const tasks = Array.from({ length: 5000 }, (_, index) => ({
      id: `stress-${index}`,
      title: `Задача массовой проверки ${index + 1}`,
      description: `Описание ${index + 1}`,
      priority: "medium",
      dueDate: null,
      completed: false,
      createdAt: 5000 - index,
      parentId: null,
    }));
    window.localStorage.setItem("daymark:tasks:v1", JSON.stringify(tasks));
  });
  const start = Date.now();
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: /Все задачи 5000/ }),
  ).toBeVisible();
  const readyMs = Date.now() - start;

  await expect(page.locator(".task-row")).toHaveCount(40);
  await expect(page.getByText("Показано 40 из 5000")).toBeVisible();
  await page.getByRole("button", { name: /Показать ещё 40/ }).click();
  await expect(page.locator(".task-row")).toHaveCount(80);

  const searchStart = Date.now();
  await page
    .getByRole("textbox", { name: "Поиск задач" })
    .fill("массовой проверки 4999");
  await expect(page.locator(".task-row")).toHaveCount(1);
  await expect(
    page.getByRole("button", {
      name: "Открыть: Задача массовой проверки 4999",
    }),
  ).toBeVisible();
  const searchMs = Date.now() - searchStart;
  const dimensions = await page.evaluate(() => ({
    viewport: innerWidth,
    documentWidth: document.documentElement.scrollWidth,
  }));
  expect(dimensions.documentWidth).toBeLessThanOrEqual(dimensions.viewport);
  console.log(
    JSON.stringify({ test: "5k-task-load", readyMs, searchMs, ...dimensions }),
  );
});

test("create, complete, search, and persist", async ({ page }) => {
  await page.goto("/");
  await page
    .getByRole("textbox", { name: "Название новой задачи" })
    .fill("Важное дело");
  await page
    .getByRole("textbox", { name: "Название новой задачи" })
    .press("Enter");
  await expect(
    page.getByRole("button", { name: "Открыть: Важное дело" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Выполнить: Важное дело" }).click();
  await page.reload();
  await expect(
    page.getByRole("button", { name: "Вернуть в работу: Важное дело" }),
  ).toBeVisible();
  await page
    .getByRole("textbox", { name: "Поиск задач" })
    .fill("не существует");
  await expect(page.getByText("Ничего не найдено")).toBeVisible();
});

test("modal is keyboard accessible and restores focus", async ({ page }) => {
  await page.goto("/");
  const trigger = page.getByRole("button", { name: "Новая задача" });
  await trigger.focus();
  await trigger.press("Enter");
  const dialog = page.getByRole("dialog", { name: "Новая задача" });
  await expect(dialog).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(trigger).toBeFocused();
});

test("has no critical automated accessibility violations", async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => document.fonts.ready);
  const mainResults = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
    .analyze();
  if (mainResults.violations.length)
    console.log(
      "Main accessibility violations",
      mainResults.violations.map(({ id, nodes }) => ({
        id,
        nodes: nodes.map(({ target, failureSummary }) => ({
          target,
          failureSummary,
        })),
      })),
    );
  expect(mainResults.violations).toEqual([]);
  await page.getByRole("button", { name: "Новая задача" }).click();
  await page
    .getByRole("dialog", { name: "Новая задача" })
    .evaluate(async (dialog) => {
      await Promise.all(
        dialog.getAnimations().map((animation) => animation.finished),
      );
    });
  const dialogResults = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
    .analyze();
  if (dialogResults.violations.length)
    console.log(
      "Dialog accessibility violations",
      dialogResults.violations.map(({ id, nodes }) => ({
        id,
        nodes: nodes.map(({ target, failureSummary }) => ({
          target,
          failureSummary,
        })),
      })),
    );
  expect(dialogResults.violations).toEqual([]);
});

test("does not overflow viewport horizontally", async ({ page }) => {
  await page.goto("/");
  const overflows = await page.evaluate(
    () => document.documentElement.scrollWidth > window.innerWidth,
  );
  expect(overflows).toBe(false);
});

test("mobile navigation traps focus and closes with Escape", async ({
  page,
  isMobile,
}) => {
  test.skip(!isMobile, "Only relevant at the mobile breakpoint");
  await page.goto("/");
  const menuTrigger = page.getByRole("button", { name: "Открыть меню" });
  await menuTrigger.click();
  await expect(page.getByRole("dialog", { name: "Навигация" })).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Закрыть меню" }),
  ).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog", { name: "Навигация" })).toBeHidden();
  await expect(menuTrigger).toBeFocused();
});

test("task row opens the editor and a subtask can be added", async ({
  page,
}) => {
  await page.goto("/");
  await page
    .getByRole("textbox", { name: "Название новой задачи" })
    .fill("План релиза");
  await page
    .getByRole("textbox", { name: "Название новой задачи" })
    .press("Enter");
  await page
    .getByRole("button", { name: "Добавить подзадачу: План релиза" })
    .click();
  await expect(
    page.getByRole("dialog", { name: "Новая подзадача" }),
  ).toBeVisible();
  await page
    .getByRole("textbox", { name: "Название задачи" })
    .fill("Проверить адаптивность");
  await page
    .getByRole("textbox", { name: /Описание/i })
    .fill("Все ключевые точки перелома");
  await page.getByRole("button", { name: "Создать задачу" }).click();
  await expect(page.getByText("0/1 подзадач")).toBeVisible();
  await expect(page.getByText("Все ключевые точки перелома")).toBeVisible();
  await page
    .getByRole("button", { name: "Открыть: Проверить адаптивность" })
    .click();
  await expect(
    page.getByRole("dialog", { name: "Редактировать задачу" }),
  ).toBeVisible();
});

test("quick-add priority, sorting and overdue tasks", async ({ page }) => {
  await page.goto("/");
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const past = [
    yesterday.getFullYear(),
    String(yesterday.getMonth() + 1).padStart(2, "0"),
    String(yesterday.getDate()).padStart(2, "0"),
  ].join("-");
  await page
    .getByRole("combobox", { name: /Приоритет новой задачи: Средний/ })
    .click();
  await expect(
    page
      .getByRole("option", { name: "Высокий" })
      .locator(".priority-icon.high"),
  ).toHaveCount(1);
  await page.getByRole("option", { name: "Высокий" }).click();
  await page.getByLabel("Срок новой задачи").fill(past);
  await page
    .getByRole("textbox", { name: "Название новой задачи" })
    .fill("Срочный релиз");
  await page
    .getByRole("textbox", { name: "Название новой задачи" })
    .press("Enter");
  if (await page.getByRole("button", { name: "Открыть меню" }).isVisible()) {
    await page.getByRole("button", { name: "Открыть меню" }).click();
  }
  await page.getByRole("button", { name: /Просроченные 1/ }).click();
  await expect(page.getByText(/Просрочено/)).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Открыть: Срочный релиз" }),
  ).toBeVisible();
  await page
    .getByRole("combobox", { name: "Сортировка задач" })
    .selectOption("priority");
});

test("quick-add priority stays compact at desktop and phone widths", async ({
  page,
}) => {
  for (const width of [1360, 390, 320]) {
    await page.setViewportSize({ width, height: 760 });
    await page.goto("/");
    const form = page.locator(".quick-add");
    const picker = form.locator(".priority-picker");
    const formBox = await form.boundingBox();
    const pickerBox = await picker.boundingBox();
    expect(formBox).not.toBeNull();
    expect(pickerBox).not.toBeNull();
    expect(pickerBox!.width).toBeGreaterThanOrEqual(125);
    expect(pickerBox!.width).toBeLessThan(formBox!.width * 0.7);

    await picker.getByRole("combobox").click();
    const menuBox = await picker.getByRole("listbox").boundingBox();
    expect(menuBox).not.toBeNull();
    expect(menuBox!.width).toBeLessThan(formBox!.width * 0.7);
    await picker.getByRole("option", { name: "Высокий" }).click();
    await expect(picker.getByRole("combobox")).toHaveAttribute(
      "aria-expanded",
      "false",
    );
  }
});

test("editor priority menu does not move or resize the dialog", async ({
  page,
}) => {
  for (const { width, height } of [
    { width: 1360, height: 900 },
    { width: 390, height: 720 },
    { width: 320, height: 640 },
  ]) {
    await page.setViewportSize({ width, height });
    await page.goto("/");
    await page.getByRole("button", { name: "Новая задача" }).click();
    const dialog = page.getByRole("dialog", { name: "Новая задача" });
    await dialog.evaluate(async (element) => {
      await Promise.all(
        element.getAnimations().map((animation) => animation.finished),
      );
    });
    const picker = dialog.getByRole("combobox", { name: /Приоритет:/ });
    await picker.scrollIntoViewIfNeeded();
    const before = await dialog.boundingBox();
    await picker.click();
    const menu = dialog.getByRole("listbox", { name: "Приоритет" });
    await expect(menu).toBeVisible();
    const after = await dialog.boundingBox();
    const menuBox = await menu.boundingBox();
    expect(before).not.toBeNull();
    expect(after).not.toBeNull();
    expect(menuBox).not.toBeNull();
    expect(Math.abs(after!.y - before!.y)).toBeLessThan(2);
    expect(Math.abs(after!.height - before!.height)).toBeLessThan(2);
    expect(menuBox!.y).toBeGreaterThanOrEqual(after!.y - 2);
    expect(menuBox!.y + menuBox!.height).toBeLessThanOrEqual(
      after!.y + after!.height + 2,
    );
    await menu.getByRole("option", { name: "Низкий" }).click();
    await expect(picker).toHaveAttribute("aria-expanded", "false");
    await dialog.getByRole("button", { name: "Отмена" }).click();
  }
});

test("undated subtasks follow their parent in Today and Calendar", async ({
  page,
  isMobile,
}) => {
  await page.addInitScript(() => {
    const date = new Date();
    const today = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
    window.localStorage.setItem(
      "daymark:tasks:v1",
      JSON.stringify([
        {
          id: "dated-parent",
          title: "Родитель на сегодня",
          description: "",
          priority: "low",
          dueDate: today,
          completed: false,
          createdAt: 2,
          parentId: null,
        },
        {
          id: "undated-child",
          title: "Подзадача без собственного срока",
          description: "",
          priority: "medium",
          dueDate: null,
          completed: false,
          createdAt: 1,
          parentId: "dated-parent",
        },
      ]),
    );
  });
  await page.goto("/");
  if (isMobile)
    await page.getByRole("button", { name: "Открыть меню" }).click();
  await page.getByRole("button", { name: /Сегодня 2/ }).click();
  await expect(
    page.getByRole("button", {
      name: "Открыть: Подзадача без собственного срока",
    }),
  ).toBeVisible();
  await expect(page.locator(".subtask-row .task-due.today")).toBeVisible();

  if (isMobile)
    await page.getByRole("button", { name: "Открыть меню" }).click();
  await page.getByRole("button", { name: /Обычные задачи 1/ }).click();
  await expect(
    page.getByRole("button", {
      name: "Открыть: Подзадача без собственного срока",
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Открыть: Родитель на сегодня" }),
  ).toBeVisible();

  if (isMobile)
    await page.getByRole("button", { name: "Открыть меню" }).click();
  await page.getByRole("button", { name: /Календарь/ }).click();
  await expect(
    page.locator(".calendar-day[aria-pressed='true'] .calendar-day-count"),
  ).toHaveText("1");
});

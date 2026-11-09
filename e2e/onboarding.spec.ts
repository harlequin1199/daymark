import { expect, test } from "@playwright/test";

test("first visit asks for an optional name and remembers a skip", async ({
  page,
  isMobile,
}) => {
  await page.goto("/");
  await expect(
    page.getByRole("dialog", { name: "Давайте знакомиться" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Без имени" }).click();
  await expect(
    page.getByRole("dialog", { name: "Давайте знакомиться" }),
  ).toBeHidden();
  await page.reload();
  await expect(
    page.getByRole("dialog", { name: "Давайте знакомиться" }),
  ).toHaveCount(0);
  if (isMobile)
    await page.getByRole("button", { name: "Открыть меню" }).click();
  await expect(
    page.getByRole("button", { name: /Настроить имя/ }),
  ).toBeVisible();
});

test("local profiles remember names and keep separate task lists", async ({
  page,
  isMobile,
}) => {
  await page.goto("/");
  await page.getByRole("textbox", { name: /Ваше имя/ }).fill("Алексей");
  await page.getByRole("button", { name: /Продолжить/ }).click();
  await page
    .getByRole("textbox", { name: "Название новой задачи" })
    .fill("Личная задача");
  await page
    .getByRole("textbox", { name: "Название новой задачи" })
    .press("Enter");

  const openProfiles = async () => {
    if (isMobile)
      await page.getByRole("button", { name: "Открыть меню" }).click();
    await page
      .getByRole("button", { name: /Настроить имя и переключить профиль/ })
      .click();
  };
  await openProfiles();
  await page.getByRole("button", { name: "Добавить профиль" }).click();
  await page.getByRole("textbox", { name: /Имя нового профиля/ }).fill("Мария");
  await page.getByRole("button", { name: /Создать профиль/ }).click();
  await page.getByRole("heading", { name: /Мария/ }).waitFor();
  await page
    .getByRole("textbox", { name: "Название новой задачи" })
    .fill("Задача Марии");
  await page
    .getByRole("textbox", { name: "Название новой задачи" })
    .press("Enter");
  await page.reload();

  await page.getByRole("button", { name: "Открыть: Задача Марии" }).waitFor();
  await expect(
    page.getByRole("button", { name: "Открыть: Личная задача" }),
  ).toHaveCount(0);
  await openProfiles();
  await page
    .getByRole("button", { name: "Переключить на профиль: Алексей" })
    .click();
  await page.getByRole("button", { name: "Открыть: Личная задача" }).waitFor();
  await expect(
    page.getByRole("button", { name: "Открыть: Задача Марии" }),
  ).toHaveCount(0);
  await expect(page.getByRole("heading", { name: /Алексей/ })).toBeVisible();
});

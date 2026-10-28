import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import {
  attachHardFailGuards,
  login,
  register,
  uniqueUser,
} from "./helpers";

test.describe("F01 auth", () => {
  test.beforeEach(async ({ page }) => {
    attachHardFailGuards(page);
  });

  test("F01-H1 register lands on dashboard", async ({ page }) => {
    await register(page);
  });

  test("F01-H2 logout and login", async ({ page }) => {
    const user = await register(page);
    await page.getByRole("button", { name: "Αποσύνδεση" }).click();
    await expect(page).toHaveURL(/\/login/);
    await login(page, user.username, user.password);
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test("F01-N1 wrong password", async ({ page }) => {
    const user = await register(page);
    await page.getByRole("button", { name: "Αποσύνδεση" }).click();
    await login(page, user.username, "wrong-pass");
    await expect(page.getByRole("status")).toContainText(/Λάθος|στοιχεία/i);
    await expect(page).toHaveURL(/\/login/);
  });

  test("F01-N2 password mismatch on register", async ({ page }) => {
    const user = uniqueUser();
    await page.goto("/register");
    await page.getByLabel("Ονοματεπώνυμο").fill(user.fullName);
    await page.getByLabel("Όνομα χρήστη").fill(user.username);
    await page.getByLabel("Email").fill(user.email);
    await page.getByLabel("Κωδικός", { exact: true }).fill(user.password);
    await page.getByLabel("Επιβεβαίωση κωδικού").fill("other123");
    await page.getByRole("button", { name: "Εγγραφή" }).click();
    await expect(page.getByRole("status")).toContainText(/ταιριάζουν/i);
    await expect(page).toHaveURL(/\/register/);
  });

  test("F01-N3 duplicate username", async ({ page }) => {
    const user = await register(page);
    await page.getByRole("button", { name: "Αποσύνδεση" }).click();
    await page.goto("/register");
    await page.getByLabel("Ονοματεπώνυμο").fill("Άλλος");
    await page.getByLabel("Όνομα χρήστη").fill(user.username);
    await page.getByLabel("Email").fill(`other${Date.now()}@example.test`);
    await page.getByLabel("Κωδικός", { exact: true }).fill("test1234");
    await page.getByLabel("Επιβεβαίωση κωδικού").fill("test1234");
    await page.getByRole("button", { name: "Εγγραφή" }).click();
    await expect(page.getByRole("status")).toContainText(/χρησιμοποιείται|υπάρχει/i);
  });

  test("F01-E1 Greek accents in name", async ({ page }) => {
    const user = uniqueUser("accent");
    user.fullName = "Γιώργος Παπαγεωργίου";
    await register(page, user);
    await expect(page.getByText("Γιώργος Παπαγεωργίου")).toBeVisible();
  });

  test("F01-E2 mobile login layout", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    const user = await register(page);
    await page.getByRole("button", { name: "Άνοιγμα μενού" }).click();
    await page.getByRole("button", { name: "Αποσύνδεση" }).click();
    await expect(page).toHaveURL(/\/login/);
    await login(page, user.email, user.password);
    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.getByRole("button", { name: "Άνοιγμα μενού" })).toBeVisible();
  });

  test("A11Y-01 axe on dashboard after register", async ({ page }) => {
    await register(page);
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa"])
      .analyze();
    const serious = results.violations.filter(
      (v) => v.impact === "critical" || v.impact === "serious",
    );
    expect(serious, JSON.stringify(serious, null, 2)).toEqual([]);
  });
});

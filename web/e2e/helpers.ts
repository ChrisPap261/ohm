import { expect, type Page } from "@playwright/test";

export function uniqueUser(prefix = "qa") {
  const stamp = `${Date.now()}${Math.floor(Math.random() * 1000)}`;
  return {
    fullName: "Χρήστος Δοκιμή",
    username: `${prefix}${stamp}`,
    email: `${prefix}${stamp}@example.test`,
    password: "test1234",
  };
}

export async function register(page: Page, user = uniqueUser()) {
  await page.goto("/register");
  await page.getByLabel("Ονοματεπώνυμο").fill(user.fullName);
  await page.getByLabel("Όνομα χρήστη").fill(user.username);
  await page.getByLabel("Email").fill(user.email);
  await page.getByLabel("Κωδικός", { exact: true }).fill(user.password);
  await page.getByLabel("Επιβεβαίωση κωδικού").fill(user.password);
  await page.getByRole("button", { name: "Εγγραφή" }).click();
  await expect(page).toHaveURL(/\/dashboard/);
  await expect(page.getByRole("heading", { name: "Επισκόπηση" })).toBeVisible();
  return user;
}

export async function login(page: Page, usernameOrEmail: string, password: string) {
  await page.goto("/login");
  await page.getByLabel("Όνομα χρήστη ή email").fill(usernameOrEmail);
  await page.getByLabel("Κωδικός").fill(password);
  await page.getByRole("button", { name: "Είσοδος" }).click();
}

export async function gotoNav(page: Page, name: string | RegExp) {
  await page.getByRole("navigation", { name: "Κύριο μενού" }).getByRole("link", { name }).click();
}

export function attachHardFailGuards(page: Page) {
  page.on("console", (msg) => {
    if (msg.type() !== "error") return;
    const text = msg.text();
    // Next.js / React noise that is not app bugs
    if (
      text.includes("Download the React DevTools") ||
      text.includes("Fast Refresh") ||
      text.includes("hydration") ||
      text.includes("Extra attributes from the server")
    ) {
      return;
    }
    throw new Error(`console error: ${text}`);
  });
  page.on("response", (res) => {
    if (res.status() >= 500 && !res.url().includes("_next")) {
      throw new Error(`${res.status()} on ${res.url()}`);
    }
  });
}

import { test, expect } from "@playwright/test";
import {
  attachHardFailGuards,
  gotoNav,
  register,
} from "./helpers";

test.describe("F02–F08 core product flows", () => {
  test.beforeEach(async ({ page }) => {
    attachHardFailGuards(page);
    await register(page);
  });

  test("F02-H1 seeded active season visible", async ({ page }) => {
    await expect(page.getByText(/Ενεργή περίοδος/)).toBeVisible();
    await expect(page.getByText("2025-26").first()).toBeVisible();
  });

  test("F02-E1 no season blocks harvests", async ({ page }) => {
    await gotoNav(page, "Περίοδοι");
    const row = page.getByRole("row").filter({ hasText: "2025-26" });
    page.once("dialog", (d) => d.accept());
    await row.getByRole("button", { name: "Διαγραφή" }).click();
    await expect(page.getByText(/Δεν υπάρχουν περίοδοι/i)).toBeVisible();

    await gotoNav(page, "Συγκομιδές");
    await expect(
      page.getByText(/Δεν έχει οριστεί ενεργή περίοδος/i),
    ).toBeVisible();
    await expect(page.getByRole("link", { name: /περιόδους/i })).toBeVisible();
  });

  test("F03-H1 create harvest with crates autofill", async ({ page }) => {
    await gotoNav(page, "Συγκομιδές");
    await page.getByRole("button", { name: "Νέα συγκομιδή" }).click();
    const dialog = page.getByRole("dialog");
    await dialog.getByLabel("Αγροτεμάχιο").selectOption({ index: 1 });
    await dialog.getByLabel("Τελάρα").fill("10");
    await expect(dialog.getByLabel("Κιλά ελιών")).toHaveValue("225");
    await dialog.getByRole("button", { name: "Αποθήκευση" }).click();
    await expect(page.getByRole("cell", { name: "225 kg" }).first()).toBeVisible();
  });

  test("F03-E1 editable autofill kg", async ({ page }) => {
    await gotoNav(page, "Συγκομιδές");
    await page.getByRole("button", { name: "Νέα συγκομιδή" }).click();
    const dialog = page.getByRole("dialog");
    await dialog.getByLabel("Αγροτεμάχιο").selectOption({ index: 1 });
    await dialog.getByLabel("Τελάρα").fill("4");
    await expect(dialog.getByLabel("Κιλά ελιών")).toHaveValue("90");
    await dialog.getByLabel("Κιλά ελιών").fill("100");
    await dialog.getByRole("button", { name: "Αποθήκευση" }).click();
    await expect(page.getByRole("cell", { name: "100 kg" }).first()).toBeVisible();
  });

  test("F04-H1 mill processing shows liters and yield", async ({ page }) => {
    await gotoNav(page, "Ελαιοτριβείο");
    await page.getByRole("button", { name: "Νέα επεξεργασία" }).click();
    const dialog = page.getByRole("dialog");
    await dialog.getByLabel("Τελάρα").fill("20");
    await expect(dialog.getByLabel("Κιλά ελιών")).toHaveValue("450");
    await dialog.getByLabel("Κιλά λαδιού").fill("80");
    await dialog.getByLabel("Κόστος (€)").fill("50");
    await dialog.getByRole("button", { name: "Αποθήκευση" }).click();
    await expect(page.getByText(/80 kg/).first()).toBeVisible();
    await expect(page.getByText(/88 L|5\.6:1/).first()).toBeVisible();
  });

  test("F05-H1 oil sale and F05-E1 status toggle", async ({ page }) => {
    await page.getByRole("button", { name: "Πωλήσεις" }).click();
    await page.getByRole("link", { name: "Ελαιόλαδο" }).click();
    await expect(page.getByRole("heading", { name: /ελαιόλαδου/i })).toBeVisible();
    await page.getByRole("button", { name: "Νέα πώληση" }).click();
    const dialog = page.getByRole("dialog");
    await dialog.getByLabel("Λίτρα", { exact: true }).fill("11");
    await dialog.getByLabel("Τιμή ανά λίτρο (€)").fill("8");
    await dialog.getByLabel("Αγοραστής").fill("Δοκιμαστικός Αγοραστής");
    await dialog.getByRole("button", { name: "Αποθήκευση" }).click();
    await expect(dialog).toBeHidden();
    await expect(page.getByRole("cell", { name: "11 L" }).first()).toBeVisible();

    const paidSwitch = page.getByRole("switch", { name: "Πληρ." }).or(
      page.getByRole("switch", { name: "Πληρώθηκε" }),
    ).first();
    await expect(paidSwitch).toBeVisible();
    const before = await paidSwitch.getAttribute("aria-checked");
    await paidSwitch.click();
    await expect(paidSwitch).toHaveAttribute(
      "aria-checked",
      before === "true" ? "false" : "true",
    );
  });

  test("F06-H1 olive sale", async ({ page }) => {
    await page.getByRole("button", { name: "Πωλήσεις" }).click();
    await page.getByRole("link", { name: "Ελιές" }).click();
    await page.getByRole("button", { name: "Νέα πώληση" }).click();
    const dialog = page.getByRole("dialog");
    await dialog.getByLabel("Κιλά ελιών").fill("50");
    await dialog.getByLabel("Τιμή ανά κιλό (€)").fill("1.5");
    await dialog.getByLabel("Αγοραστής").fill("Δοκιμαστικός Αγοραστής");
    await dialog.getByRole("button", { name: "Αποθήκευση" }).click();
    await expect(dialog).toBeHidden();
    await expect(page.getByRole("cell", { name: "50 kg" }).first()).toBeVisible();
  });

  test("F07-H1 create expense transaction", async ({ page }) => {
    await gotoNav(page, /Έσοδα/);
    await page.getByRole("button", { name: "Νέα κίνηση" }).click();
    const dialog = page.getByRole("dialog");
    await dialog.getByLabel("Τύπος").selectOption("expense");
    await dialog.getByLabel("Περιγραφή").fill("Καύσιμα");
    await dialog.getByLabel("Ποσό (€)").fill("12.50");
    await dialog.getByRole("button", { name: "Αποθήκευση" }).click();
    await expect(page.getByRole("cell", { name: "Καύσιμα" }).first()).toBeVisible();
    await expect(page.getByText(/12,50/).first()).toBeVisible();
  });

  test("F08-H1 dashboard stats", async ({ page }) => {
    await gotoNav(page, "Επισκόπηση");
    await expect(page.getByRole("heading", { name: "Επισκόπηση" })).toBeVisible();
    await expect(page.getByText("Υπόλοιπο λαδιού")).toBeVisible();
    await expect(page.getByText("900 kg").first()).toBeVisible();
  });

  test("F08-H2 analytics page", async ({ page }) => {
    await gotoNav(page, "Αναλύσεις");
    await expect(page.getByRole("heading", { name: "Αναλύσεις" })).toBeVisible();
  });
});

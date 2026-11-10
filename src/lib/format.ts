export const OIL_L_PER_KG = 1.1;

const eur = new Intl.NumberFormat("el-GR", { style: "currency", currency: "EUR" });
const num = new Intl.NumberFormat("el-GR", { maximumFractionDigits: 1 });

export const money = (cents: number) => eur.format((cents || 0) / 100);
export const n = (v: number | null | undefined) => (v == null ? "—" : num.format(v));
export const date = (d: string) => {
  if (!d) return "—";
  const [y, m, day] = d.split("-");
  return `${day}/${m}/${y}`;
};
export const today = () => new Date().toISOString().slice(0, 10);

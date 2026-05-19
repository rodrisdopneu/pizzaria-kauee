export const formatBRL = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value || 0);

export const formatDate = (date: string | Date) =>
  new Intl.DateTimeFormat("pt-BR").format(new Date(date));

export const monthLabel = (date: Date) =>
  new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric" }).format(date);

export const startOfMonth = (d = new Date()) => new Date(d.getFullYear(), d.getMonth(), 1);
export const endOfMonth = (d = new Date()) => new Date(d.getFullYear(), d.getMonth() + 1, 0);

export const toISODate = (d: Date) => d.toISOString().slice(0, 10);

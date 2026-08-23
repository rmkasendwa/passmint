export const money = new Intl.NumberFormat("en-UG", {
  style: "currency",
  currency: "UGX",
  maximumFractionDigits: 0,
});

export const dateTime = new Intl.DateTimeFormat("en-UG", {
  dateStyle: "medium",
  timeStyle: "short",
});

export const shortDate = new Intl.DateTimeFormat("en-UG", {
  weekday: "short",
  month: "short",
  day: "numeric",
});

export const chipDate = new Intl.DateTimeFormat("en-UG", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

export const filterDate = new Intl.DateTimeFormat("en-UG", {
  month: "short",
  day: "numeric",
});

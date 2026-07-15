export type DueDateUrgency = "green" | "yellow" | "red" | "none";

export interface DueDateInfo {
  urgency: DueDateUrgency;
  daysLeft: number | null;
  label: string;
  dateLabel: string;
}

function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function parseDateOnly(iso: string): Date | null {
  if (!iso) return null;
  const d = new Date(`${iso.slice(0, 10)}T00:00:00`);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** Green > 7 days · Yellow 1–7 days · Red due today or overdue */
export function getDueDateInfo(dueDate?: string): DueDateInfo {
  if (!dueDate) {
    return {
      urgency: "none",
      daysLeft: null,
      label: "No due date",
      dateLabel: "—",
    };
  }

  const due = parseDateOnly(dueDate);
  if (!due) {
    return {
      urgency: "none",
      daysLeft: null,
      label: "Invalid date",
      dateLabel: dueDate,
    };
  }

  const today = startOfToday();
  const msPerDay = 24 * 60 * 60 * 1000;
  const daysLeft = Math.round((due.getTime() - today.getTime()) / msPerDay);
  const dateLabel = due.toLocaleDateString();

  if (daysLeft < 0) {
    const overdue = Math.abs(daysLeft);
    return {
      urgency: "red",
      daysLeft,
      label: overdue === 1 ? "1 day overdue" : `${overdue} days overdue`,
      dateLabel,
    };
  }
  if (daysLeft === 0) {
    return { urgency: "red", daysLeft, label: "Due today", dateLabel };
  }
  if (daysLeft <= 7) {
    return {
      urgency: "yellow",
      daysLeft,
      label: daysLeft === 1 ? "1 day left" : `${daysLeft} days left`,
      dateLabel,
    };
  }
  return {
    urgency: "green",
    daysLeft,
    label: `${daysLeft} days left`,
    dateLabel,
  };
}

// Central type definitions for TaskFlow

export type Priority = "Low" | "Medium" | "High" | "Critical";
export type Status = "Todo" | "In Progress" | "Completed" | "Overdue";

export interface Task {
  id: string;
  title: string;
  description: string;
  priority: Priority;
  status: Status;
  project: string;
  assignee: string;
  dueDate: string; // ISO string YYYY-MM-DD
  createdAt: string;
}

export interface Project {
  id: string;
  name: string;
  color: string;
  taskCount: number;
  completedCount: number;
}

export type NavItem = {
  id: string;
  label: string;
  icon: string;
  href: string;
};

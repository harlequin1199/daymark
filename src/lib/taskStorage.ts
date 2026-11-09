import { taskStorageKey } from "./profiles";
import { validTask, type Task } from "../domain/tasks";

/** Repair older and malformed subtask references while keeping valid user data. */
export function loadTasks(profileId: string): Task[] {
  try {
    const saved = window.localStorage.getItem(taskStorageKey(profileId));
    if (saved === null) return [];
    const parsed: unknown = JSON.parse(saved);
    if (Array.isArray(parsed) && parsed.every(validTask)) {
      const restored: Task[] = parsed.map((task: Task) => ({
        ...task,
        parentId: task.parentId ?? null,
      }));
      const byId = new Map(restored.map((task) => [task.id, task]));
      return restored.map((task) => ({
        ...task,
        parentId:
          task.parentId &&
          task.parentId !== task.id &&
          byId.get(task.parentId)?.parentId === null
            ? task.parentId
            : null,
      }));
    }
  } catch {
    // Storage may be disabled or contain corrupted data.
  }
  return [];
}

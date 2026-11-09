import type { Dispatch, SetStateAction } from "react";
import {
  AlertTriangle,
  ArrowRight,
  CalendarDays,
  Check,
  CheckCheck,
  CornerDownRight,
  Flame,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { PriorityIcon, priorityLabels } from "./PriorityPicker";
import {
  dueLabel,
  TASKS_PER_PAGE,
  type Task,
  type VisibleRow,
} from "../domain/tasks";

type TaskRowsProps = {
  visibleRows: VisibleRow[];
  displayedRows: VisibleRow[];
  remainingRows: number;
  setVisibleLimit: Dispatch<SetStateAction<number>>;
  today: string;
  childCountByParent: Map<string, { total: number; done: number }>;
  editTask: (task: Task) => void;
  toggleTask: (id: string) => void;
  openNewTask: (parentId?: string | null) => void;
  removeTask: (task: Task) => void;
  EmptyIcon: LucideIcon;
  emptyTitle: string;
  emptyDetail: string;
  search: string;
  taskCount: number;
  loadExamples: () => void;
};

export function TaskRows({
  visibleRows,
  displayedRows,
  remainingRows,
  setVisibleLimit,
  today,
  childCountByParent,
  editTask,
  toggleTask,
  openNewTask,
  removeTask,
  EmptyIcon,
  emptyTitle,
  emptyDetail,
  search,
  taskCount,
  loadExamples,
}: TaskRowsProps) {
  return (
    <div className="task-list">
      {visibleRows.length ? (
        displayedRows.map(({ task, depth, contextOnly }) => (
          <div
            className={`task-row ${depth ? "subtask-row" : ""} ${contextOnly ? "context-row" : ""} ${task.completed ? "task-completed" : ""} ${!task.completed && task.dueDate && task.dueDate < today ? "task-overdue" : ""}`}
            key={task.id}
          >
            <button
              className="task-row-open"
              type="button"
              aria-label={`Открыть: ${task.title}`}
              title="Открыть задачу"
              onClick={() => editTask(task)}
            />
            {depth > 0 && (
              <CornerDownRight
                className="subtask-indent"
                size={18}
                aria-hidden="true"
              />
            )}
            <button
              type="button"
              aria-label={`${task.completed ? "Вернуть в работу" : childCountByParent.has(task.id) ? "Выполнить с подзадачами" : "Выполнить"}: ${task.title}`}
              aria-pressed={task.completed}
              className={`check-box ${task.completed ? "checked" : ""}`}
              onClick={() => toggleTask(task.id)}
            >
              {task.completed && <Check size={14} strokeWidth={3} />}
            </button>
            <div className="task-body">
              <strong className="task-title" title={task.title}>
                {task.title}
              </strong>
              {task.description && (
                <p className="task-description" title={task.description}>
                  {task.description}
                </p>
              )}
              <div className="task-meta">
                <span className={`task-priority ${task.priority}`}>
                  <PriorityIcon priority={task.priority} size={14} />{" "}
                  {priorityLabels[task.priority]}
                </span>
                {task.dueDate && (
                  <span
                    className={`task-due ${!task.completed && task.dueDate < today ? "overdue" : !task.completed && task.dueDate === today ? "today" : ""}`}
                  >
                    {!task.completed && task.dueDate < today ? (
                      <AlertTriangle size={14} aria-hidden="true" />
                    ) : !task.completed && task.dueDate === today ? (
                      <Flame size={14} aria-hidden="true" />
                    ) : (
                      <CalendarDays size={12} aria-hidden="true" />
                    )}
                    {!task.completed && task.dueDate < today
                      ? "Просрочено · "
                      : ""}
                    {dueLabel(task.dueDate)}
                  </span>
                )}
                {childCountByParent.has(task.id) && (
                  <span className="subtask-count">
                    <CheckCheck size={13} />
                    {childCountByParent.get(task.id)?.done}/
                    {childCountByParent.get(task.id)?.total} подзадач
                  </span>
                )}
              </div>
            </div>
            <div className="task-actions">
              {depth === 0 && (
                <button
                  type="button"
                  className="row-action add-subtask-action"
                  aria-label={`Добавить подзадачу: ${task.title}`}
                  title="Добавить подзадачу"
                  onClick={() => openNewTask(task.id)}
                >
                  <Plus size={18} />
                </button>
              )}
              <button
                type="button"
                className="row-action"
                aria-label={`Редактировать: ${task.title}`}
                title="Редактировать"
                onClick={() => editTask(task)}
              >
                <Pencil size={17} />
              </button>
              <button
                type="button"
                className="row-action delete-action"
                aria-label={`Удалить: ${task.title}`}
                title="Удалить"
                onClick={() => removeTask(task)}
              >
                <Trash2 size={17} />
              </button>
            </div>
          </div>
        ))
      ) : (
        <div className="empty-state">
          <div className="empty-icon">
            <EmptyIcon size={26} />
          </div>
          <strong>{emptyTitle}</strong>
          <p>{emptyDetail}</p>
          {!search && (
            <button
              className="soft-button"
              onClick={() => openNewTask()}
              type="button"
            >
              <Plus size={16} /> Добавить задачу
            </button>
          )}
          {taskCount === 0 && !search && (
            <button
              className="example-button"
              onClick={loadExamples}
              type="button"
            >
              Посмотреть на примере <ArrowRight size={15} />
            </button>
          )}
        </div>
      )}
      {remainingRows > 0 && (
        <div className="task-pagination">
          <span role="status" aria-live="polite">
            Показано {displayedRows.length} из {visibleRows.length}
          </span>
          <button
            type="button"
            onClick={() =>
              setVisibleLimit((current) => current + TASKS_PER_PAGE)
            }
          >
            Показать ещё {Math.min(TASKS_PER_PAGE, remainingRows)}
            <ArrowRight size={16} aria-hidden="true" />
          </button>
        </div>
      )}
    </div>
  );
}

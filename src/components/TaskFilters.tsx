import type { Dispatch, SetStateAction } from "react";
import { ArrowDownWideNarrow, CheckCheck, Search, X } from "lucide-react";
import {
  PriorityIcon,
  priorities,
  priorityLabels,
  type Priority,
} from "./PriorityPicker";
import type { Sort, Status, View } from "../domain/tasks";

type TaskFiltersProps = {
  view: View;
  status: Status;
  setStatus: Dispatch<SetStateAction<Status>>;
  sort: Sort;
  setSort: Dispatch<SetStateAction<Sort>>;
  search: string;
  setSearch: Dispatch<SetStateAction<string>>;
  priorityFilter: Priority[];
  selectPriority: (priority: Priority) => void;
  setPriorityFilter: Dispatch<SetStateAction<Priority[]>>;
};

export function TaskFilters({
  view,
  status,
  setStatus,
  sort,
  setSort,
  search,
  setSearch,
  priorityFilter,
  selectPriority,
  setPriorityFilter,
}: TaskFiltersProps) {
  return (
    <>
      <div className="task-toolbar">
        {view !== "completed" ? (
          <div
            className="filter-switch"
            role="group"
            aria-label="Фильтр по статусу"
          >
            {[
              { key: "all", label: "Все" },
              { key: "active", label: "В работе" },
              { key: "done", label: "Готово" },
            ].map((item) => (
              <button
                key={item.key}
                type="button"
                aria-pressed={status === item.key}
                className={status === item.key ? "active" : ""}
                onClick={() => setStatus(item.key as Status)}
              >
                {item.label}
              </button>
            ))}
          </div>
        ) : (
          <span className="completed-filter">
            <CheckCheck size={16} /> Завершённые задачи
          </span>
        )}
        <div className="toolbar-right">
          <label className="sort-control">
            <ArrowDownWideNarrow size={16} aria-hidden="true" />
            <span className="sr-only">Сортировка задач</span>
            <select
              value={sort}
              onChange={(event) => setSort(event.target.value as Sort)}
              aria-label="Сортировка задач"
            >
              <option value="due">По сроку</option>
              <option value="priority">По приоритету</option>
              <option value="newest">Сначала новые</option>
              <option value="title">По названию</option>
            </select>
          </label>
          <div className="search-field">
            <Search size={17} aria-hidden="true" />
            <input
              name="search"
              autoComplete="off"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Поиск задач…"
              aria-label="Поиск задач"
            />
            {search && (
              <button
                aria-label="Очистить поиск"
                type="button"
                onClick={() => setSearch("")}
              >
                <X size={15} />
              </button>
            )}
          </div>
        </div>
      </div>

      {priorityFilter.length > 0 && (
        <div
          className="priority-active-filters"
          role="group"
          aria-label="Выбранные приоритеты"
        >
          {priorities
            .filter((priority) => priorityFilter.includes(priority))
            .map((priority) => (
              <button
                key={priority}
                type="button"
                className="priority-filter-chip"
                aria-label={`Убрать приоритет: ${priorityLabels[priority]}`}
                onClick={() => selectPriority(priority)}
              >
                <PriorityIcon priority={priority} size={15} />
                {priorityLabels[priority]}
                <X size={14} aria-hidden="true" />
              </button>
            ))}
          <button
            type="button"
            className="priority-filter-clear"
            onClick={() => setPriorityFilter([])}
          >
            Сбросить фильтр
          </button>
        </div>
      )}
    </>
  );
}

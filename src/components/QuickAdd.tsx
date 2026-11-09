import type { Dispatch, FormEventHandler, SetStateAction } from "react";
import { ArrowRight, CalendarDays, Plus } from "lucide-react";
import { PriorityPicker, type Priority } from "./PriorityPicker";

type QuickAddProps = {
  quickAdd: FormEventHandler<HTMLFormElement>;
  quickTitle: string;
  setQuickTitle: Dispatch<SetStateAction<string>>;
  quickPriority: Priority;
  setQuickPriority: Dispatch<SetStateAction<Priority>>;
  quickDueDate: string;
  setQuickDueDate: Dispatch<SetStateAction<string>>;
};

export function QuickAdd({
  quickAdd,
  quickTitle,
  setQuickTitle,
  quickPriority,
  setQuickPriority,
  quickDueDate,
  setQuickDueDate,
}: QuickAddProps) {
  return (
    <form className="quick-add" onSubmit={quickAdd}>
      <div className="quick-add-main">
        <Plus size={19} aria-hidden="true" />
        <input
          name="quick-task"
          autoComplete="off"
          aria-label="Название новой задачи"
          maxLength={140}
          placeholder="Добавить задачу…"
          value={quickTitle}
          onChange={(event) => setQuickTitle(event.target.value)}
        />
        <button
          type="submit"
          className="quick-submit"
          disabled={!quickTitle.trim()}
        >
          Добавить <ArrowRight size={16} />
        </button>
      </div>
      <div className="quick-add-options">
        <PriorityPicker
          compact
          label="Приоритет новой задачи"
          value={quickPriority}
          onChange={setQuickPriority}
        />
        <label>
          <CalendarDays size={14} aria-hidden="true" />
          <span className="sr-only">Срок новой задачи</span>
          <input
            type="date"
            aria-label="Срок новой задачи"
            value={quickDueDate}
            onChange={(event) => setQuickDueDate(event.target.value)}
          />
        </label>
      </div>
    </form>
  );
}

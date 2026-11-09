import type { Dispatch, FormEventHandler, SetStateAction } from "react";
import { ArrowRight, CornerDownRight, X } from "lucide-react";
import { PriorityPicker } from "./PriorityPicker";
import { AccessibleDialog } from "./AccessibleDialog";
import type { Draft, Task } from "../domain/tasks";

type TaskEditorDialogProps = {
  editingId: string | null;
  parentForNewTask: string | null;
  editorParent?: Task;
  draft: Draft;
  setDraft: Dispatch<SetStateAction<Draft>>;
  setShowEditor: Dispatch<SetStateAction<boolean>>;
  saveEditor: FormEventHandler<HTMLFormElement>;
};

export function TaskEditorDialog({
  editingId,
  parentForNewTask,
  editorParent,
  draft,
  setDraft,
  setShowEditor,
  saveEditor,
}: TaskEditorDialogProps) {
  return (
    <AccessibleDialog
      className="editor-modal"
      labelledBy="editor-title"
      onClose={() => setShowEditor(false)}
      initialFocusSelector="#task-name"
    >
      <div className="modal-top">
        <div>
          <span className="section-eyebrow">ВАШИ ПЛАНЫ</span>
          <h2 id="editor-title">
            {editingId
              ? "Редактировать задачу"
              : parentForNewTask
                ? "Новая подзадача"
                : "Новая задача"}
          </h2>
          {editorParent && (
            <p className="editor-parent-hint">
              <CornerDownRight size={14} aria-hidden="true" />
              Подзадача для «{editorParent.title}»
            </p>
          )}
        </div>
        <button
          type="button"
          className="icon-button"
          aria-label="Закрыть"
          onClick={() => setShowEditor(false)}
        >
          <X size={20} />
        </button>
      </div>
      <form onSubmit={saveEditor}>
        <label className="form-label" htmlFor="task-name">
          Название задачи
        </label>
        <input
          id="task-name"
          name="title"
          autoComplete="off"
          required
          maxLength={140}
          className="form-input"
          placeholder="Что нужно сделать?"
          value={draft.title}
          onChange={(event) =>
            setDraft((previous) => ({
              ...previous,
              title: event.target.value,
            }))
          }
        />
        <label className="form-label" htmlFor="task-desc">
          Описание <span>(необязательно)</span>
        </label>
        <textarea
          id="task-desc"
          name="description"
          className="form-input description-input"
          maxLength={500}
          placeholder="Добавьте немного контекста..."
          value={draft.description}
          onChange={(event) =>
            setDraft((previous) => ({
              ...previous,
              description: event.target.value,
            }))
          }
        />
        <div className="form-grid">
          <div>
            <label className="form-label" htmlFor="task-date">
              Срок выполнения
            </label>
            <input
              className="form-input date-input"
              id="task-date"
              name="due-date"
              type="date"
              value={draft.dueDate}
              onChange={(event) =>
                setDraft((previous) => ({
                  ...previous,
                  dueDate: event.target.value,
                }))
              }
            />
          </div>
          <div>
            <label className="form-label" htmlFor="task-priority">
              Приоритет
            </label>
            <PriorityPicker
              id="task-priority"
              label="Приоритет"
              value={draft.priority}
              onChange={(priority) =>
                setDraft((previous) => ({
                  ...previous,
                  priority,
                }))
              }
            />
          </div>
        </div>
        <div className="modal-actions">
          <button
            type="button"
            className="secondary-button"
            onClick={() => setShowEditor(false)}
          >
            Отмена
          </button>
          <button
            type="submit"
            className="primary-button"
            disabled={!draft.title.trim()}
          >
            {editingId ? "Сохранить" : "Создать задачу"}{" "}
            <ArrowRight size={17} />
          </button>
        </div>
      </form>
    </AccessibleDialog>
  );
}

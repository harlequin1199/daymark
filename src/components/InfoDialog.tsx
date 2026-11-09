import type { Dispatch, SetStateAction } from "react";
import { ArrowRight, Command, Sparkles, X } from "lucide-react";
import { AccessibleDialog } from "./AccessibleDialog";

export function InfoDialog({
  setShowTips,
}: {
  setShowTips: Dispatch<SetStateAction<boolean>>;
}) {
  return (
    <AccessibleDialog
      className="info-modal"
      labelledBy="info-title"
      onClose={() => setShowTips(false)}
    >
      <button
        className="icon-button info-close"
        type="button"
        onClick={() => setShowTips(false)}
        aria-label="Закрыть"
      >
        <X size={20} />
      </button>
      <div className="info-brand">
        <Sparkles size={26} />
      </div>
      <h2 id="info-title">
        Меньше шума.
        <br />
        Больше важного.
      </h2>
      <p>
        Daymark — интерактивный прототип планировщика задач. Создавайте планы,
        отмечайте достижения и возвращайтесь к ним после обновления страницы.
      </p>
      <div className="info-tip">
        <Command size={17} /> Совет: нажмите Enter в строке быстрого добавления.
      </div>
      <button
        className="primary-button info-button"
        type="button"
        onClick={() => setShowTips(false)}
      >
        Понятно <ArrowRight size={17} />
      </button>
    </AccessibleDialog>
  );
}

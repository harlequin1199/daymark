import type { RefObject } from "react";
import {
  AlertTriangle,
  ArrowRight,
  CalendarDays,
  CheckCheck,
  CircleHelp,
  Inbox,
  Sparkles,
  Sun,
  UserRound,
  UsersRound,
  X,
} from "lucide-react";
import { PriorityIcon, type Priority } from "./PriorityPicker";
import type { ProfileRegistry } from "../lib/profiles";
import type { View } from "../domain/tasks";

export const navigation = [
  { key: "inbox", label: "Все задачи", icon: Inbox },
  { key: "today", label: "Сегодня", icon: Sun },
  { key: "upcoming", label: "Предстоящие", icon: CalendarDays },
  { key: "overdue", label: "Просроченные", icon: AlertTriangle },
  { key: "completed", label: "Выполненные", icon: CheckCheck },
  { key: "calendar", label: "Календарь", icon: CalendarDays },
] as const;

type SidebarProps = {
  sidebarRef: RefObject<HTMLElement | null>;
  menuOpen: boolean;
  onCloseMenu: () => void;
  onOpenProfile: () => void;
  onShowTips: () => void;
  profileName: string;
  profiles: ProfileRegistry;
  view: View;
  onSelectView: (view: View) => void;
  counts: Record<View, number>;
  priorityFilter: Priority[];
  priorityCounts: Record<Priority, number>;
  onSelectPriority: (priority: Priority) => void;
};

export function Sidebar({
  sidebarRef,
  menuOpen,
  onCloseMenu,
  onOpenProfile,
  onShowTips,
  profileName,
  profiles,
  view,
  onSelectView,
  counts,
  priorityFilter,
  priorityCounts,
  onSelectPriority,
}: SidebarProps) {
  return (
    <aside
      ref={sidebarRef}
      className={`sidebar ${menuOpen ? "sidebar-open" : ""}`}
      role={menuOpen ? "dialog" : undefined}
      aria-modal={menuOpen ? "true" : undefined}
      aria-label={menuOpen ? "Навигация" : undefined}
    >
      <div className="logo-line">
        <div className="brand-icon">
          <Sparkles size={20} strokeWidth={2.3} />
        </div>
        <span className="brand-word">
          daymark<span className="brand-dot">.</span>
        </span>
        <button
          className="icon-button sidebar-close"
          type="button"
          aria-label="Закрыть меню"
          onClick={onCloseMenu}
        >
          <X size={19} />
        </button>
      </div>

      <button
        className="workspace-picker"
        type="button"
        onClick={onOpenProfile}
        title="Переключить профиль или настроить имя"
      >
        <span className="workspace-avatar">
          {profileName ? (
            profileName[0].toLocaleUpperCase("ru-RU")
          ) : (
            <UserRound size={18} />
          )}
        </span>
        <span className="workspace-details">
          <strong>
            {profileName ||
              (profiles.activeId === "local"
                ? "Моё пространство"
                : `Профиль ${profiles.profiles.findIndex(({ id }) => id === profiles.activeId) + 1}`)}
          </strong>
          <small>Переключить профиль</small>
        </span>
        <UsersRound
          className="workspace-switch-icon"
          size={17}
          aria-hidden="true"
        />
        <span className="sr-only">Настроить имя и переключить профиль</span>
      </button>

      <div className="sidebar-section-label">РАБОЧЕЕ ПРОСТРАНСТВО</div>
      <nav className="side-nav" aria-label="Основная навигация">
        {navigation.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.key}
              className={`nav-item ${view === item.key ? "selected" : ""}`}
              aria-current={view === item.key ? "page" : undefined}
              type="button"
              onClick={() => onSelectView(item.key)}
            >
              <Icon size={18} strokeWidth={1.9} />
              <span>{item.label}</span>
              <small>{counts[item.key]}</small>
            </button>
          );
        })}
      </nav>

      <div className="sidebar-section-label categories-label">
        ВАШИ ПРИОРИТЕТЫ
      </div>
      <p className="priority-caption">Можно выбрать несколько</p>
      {(
        [
          { priority: "high", label: "Важные задачи" },
          { priority: "medium", label: "Обычные задачи" },
          { priority: "low", label: "Не срочные" },
        ] as const
      ).map(({ priority, label }) => (
        <button
          type="button"
          key={priority}
          className={`priority-legend ${priorityFilter.includes(priority) ? "selected" : ""}`}
          aria-pressed={priorityFilter.includes(priority)}
          onClick={() => onSelectPriority(priority)}
        >
          <PriorityIcon priority={priority} size={17} />
          <span>{label}</span>
          <strong>{priorityCounts[priority]}</strong>
        </button>
      ))}

      <div className="sidebar-bottom">
        <div className="sidebar-quote">
          <span className="quote-spark">✳</span>
          <strong>
            Маленькие шаги.
            <br />
            Большие результаты.
          </strong>
          <p>Важное начинается с одного выполненного дела.</p>
        </div>
        <button className="help-link" type="button" onClick={onShowTips}>
          <CircleHelp size={17} /> О приложении <ArrowRight size={15} />
        </button>
      </div>
    </aside>
  );
}

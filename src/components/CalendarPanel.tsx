import { ChevronLeft, ChevronRight } from "lucide-react";
import { calendarCells, type Task } from "../domain/tasks";

type CalendarPanelProps = {
  month: string;
  today: string;
  selectedDate: string;
  tasksByDate: Map<string, Task[]>;
  onSelectDate: (date: string) => void;
  onMoveMonth: (amount: number) => void;
};

export function CalendarPanel({
  month,
  today,
  selectedDate,
  tasksByDate,
  onSelectDate,
  onMoveMonth,
}: CalendarPanelProps) {
  const monthLabel = new Date(`${month}-01T12:00:00`).toLocaleDateString(
    "ru-RU",
    { month: "long", year: "numeric" },
  );

  return (
    <section className="calendar-panel" aria-labelledby="calendar-title">
      <div className="calendar-heading">
        <div>
          <span className="section-eyebrow">ПЛАНЫ ПО ДАТАМ</span>
          <h2 id="calendar-title">{monthLabel}</h2>
        </div>
        <div className="calendar-controls">
          <button
            type="button"
            className="calendar-today"
            onClick={() => onSelectDate(today)}
          >
            Сегодня
          </button>
          <button
            type="button"
            className="calendar-arrow"
            aria-label="Предыдущий месяц"
            onClick={() => onMoveMonth(-1)}
          >
            <ChevronLeft size={19} />
          </button>
          <button
            type="button"
            className="calendar-arrow"
            aria-label="Следующий месяц"
            onClick={() => onMoveMonth(1)}
          >
            <ChevronRight size={19} />
          </button>
        </div>
      </div>
      <div className="calendar-weekdays" aria-hidden="true">
        {["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"].map((weekday) => (
          <span key={weekday}>{weekday}</span>
        ))}
      </div>
      <div className="calendar-grid" aria-label="Дни месяца">
        {calendarCells(month).map((date) => {
          const dayTasks = tasksByDate.get(date) ?? [];
          return (
            <button
              key={date}
              type="button"
              className={`calendar-day ${date.slice(0, 7) !== month ? "outside" : ""} ${date === selectedDate ? "selected" : ""} ${date === today ? "today" : ""}`}
              aria-pressed={date === selectedDate}
              onClick={() => onSelectDate(date)}
            >
              <span className="sr-only">
                {new Date(`${date}T12:00:00`).toLocaleDateString("ru-RU", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
                , задач: {dayTasks.length}
              </span>
              <span className="calendar-day-top">
                <span className="calendar-day-number">
                  {Number(date.slice(-2))}
                </span>
                {dayTasks.length > 0 && (
                  <span className="calendar-day-count">{dayTasks.length}</span>
                )}
              </span>
              <span className="calendar-events" aria-hidden="true">
                {dayTasks.slice(0, 2).map((task) => (
                  <span
                    key={task.id}
                    className={`calendar-event ${task.priority} ${task.completed ? "completed" : ""}`}
                    title={task.title}
                  >
                    {task.title}
                  </span>
                ))}
                {dayTasks.length > 2 && (
                  <span className="calendar-more">+{dayTasks.length - 2}</span>
                )}
              </span>
            </button>
          );
        })}
      </div>
      <p className="calendar-hint">
        Нажмите на дату, чтобы увидеть задачи на этот день.
      </p>
    </section>
  );
}

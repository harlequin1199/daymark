import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import {
  AlertTriangle,
  CalendarDays,
  Check,
  CheckCheck,
  LayoutGrid,
  Menu,
  Plus,
  Search,
  Sparkles,
  Sun,
  X,
  RotateCcw,
} from "lucide-react";
import type { Priority } from "./components/PriorityPicker";
import {
  createProfile,
  readProfiles,
  taskStorageKey,
  PROFILES_KEY,
  type ProfileRegistry,
} from "./lib/profiles";

import {
  TASKS_PER_PAGE,
  emptyDraft,
  dayOffset,
  shiftMonth,
  makeTask,
  demoTasks,
  compareTasks,
  type Task,
  type Draft,
  type View,
  type Status,
  type Sort,
  type VisibleRow,
} from "./domain/tasks";
import { loadTasks } from "./lib/taskStorage";
import { Sidebar, navigation } from "./components/Sidebar";
import { CalendarPanel } from "./components/CalendarPanel";
import { TaskRows } from "./components/TaskRows";
import { TaskFilters } from "./components/TaskFilters";
import { QuickAdd } from "./components/QuickAdd";
import { TaskEditorDialog } from "./components/TaskEditorDialog";
import { ProfileDialog } from "./components/ProfileDialog";
import { InfoDialog } from "./components/InfoDialog";

function App() {
  const [profiles, setProfiles] = useState<ProfileRegistry>(readProfiles);
  const [tasksByProfile, setTasksByProfile] = useState<Record<string, Task[]>>(
    () =>
      Object.fromEntries(
        readProfiles().profiles.map(({ id }) => [id, loadTasks(id)]),
      ),
  );
  const tasks = tasksByProfile[profiles.activeId] ?? [];
  const currentProfile =
    profiles.profiles.find(({ id }) => id === profiles.activeId) ??
    profiles.profiles[0];
  const profile = { name: currentProfile.name, welcomed: profiles.welcomed };
  function setTasks(update: Task[] | ((previous: Task[]) => Task[])) {
    const profileId = profiles.activeId;
    setTasksByProfile((previous) => ({
      ...previous,
      [profileId]:
        typeof update === "function"
          ? update(previous[profileId] ?? [])
          : update,
    }));
  }
  const [view, setView] = useState<View>("inbox");
  const [status, setStatus] = useState<Status>("all");
  const [priorityFilter, setPriorityFilter] = useState<Priority[]>([]);
  const [sort, setSort] = useState<Sort>("due");
  const [search, setSearch] = useState("");
  const [visibleLimit, setVisibleLimit] = useState(TASKS_PER_PAGE);
  const [quickTitle, setQuickTitle] = useState("");
  const [quickPriority, setQuickPriority] = useState<Priority>("medium");
  const [quickDueDate, setQuickDueDate] = useState("");
  const [showEditor, setShowEditor] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [parentForNewTask, setParentForNewTask] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [deletedTasks, setDeletedTasks] = useState<Task[]>([]);
  const [storageWarning, setStorageWarning] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [showTips, setShowTips] = useState(false);
  const [profileDraft, setProfileDraft] = useState(
    () =>
      readProfiles().profiles.find(({ id }) => id === readProfiles().activeId)
        ?.name ?? "",
  );
  const [profileMode, setProfileMode] = useState<"edit" | "create">("edit");
  const [showProfile, setShowProfile] = useState(
    () => !readProfiles().welcomed,
  );
  const [calendarMonth, setCalendarMonth] = useState(() =>
    dayOffset(0).slice(0, 7),
  );
  const [selectedDate, setSelectedDate] = useState(() => dayOffset(0));
  const sidebarRef = useRef<HTMLElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const profileNameRef = useRef<HTMLInputElement>(null);
  const savedProfilesRef = useRef<ProfileRegistry | null>(null);
  const savedTasksRef = useRef<Record<string, Task[]> | null>(null);

  useEffect(() => {
    if (showProfile && profileMode === "create")
      profileNameRef.current?.focus();
  }, [showProfile, profileMode]);

  useEffect(() => {
    try {
      if (savedProfilesRef.current !== profiles) {
        window.localStorage.setItem(PROFILES_KEY, JSON.stringify(profiles));
        savedProfilesRef.current = profiles;
      }
      for (const [id, profileTasks] of Object.entries(tasksByProfile)) {
        if (savedTasksRef.current?.[id] !== profileTasks) {
          window.localStorage.setItem(
            taskStorageKey(id),
            JSON.stringify(profileTasks),
          );
        }
      }
      savedTasksRef.current = tasksByProfile;
      setStorageWarning(false);
    } catch {
      setStorageWarning(true);
    }
  }, [profiles, tasksByProfile]);

  useEffect(() => {
    if (!deletedTasks.length) return;
    const timeout = setTimeout(() => setDeletedTasks([]), 6500);
    return () => clearTimeout(timeout);
  }, [deletedTasks]);

  useEffect(() => {
    if (!menuOpen) return;
    const main = document.querySelector<HTMLElement>(".main-area");
    const sidebar = sidebarRef.current;
    const previousOverflow = document.body.style.overflow;
    main?.setAttribute("inert", "");
    document.body.style.overflow = "hidden";
    sidebar?.querySelector<HTMLButtonElement>(".sidebar-close")?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
      if (event.key !== "Tab" || !sidebar) return;
      const focusable = Array.from(
        sidebar.querySelectorAll<HTMLElement>(
          "button:not(:disabled), a[href], input:not(:disabled)",
        ),
      );
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      main?.removeAttribute("inert");
      document.body.style.overflow = previousOverflow;
      menuButtonRef.current?.focus();
    };
  }, [menuOpen]);

  const today = dayOffset(0);
  const tasksByDate = useMemo(() => {
    const result = new Map<string, Task[]>();
    for (const task of tasks) {
      if (
        !task.dueDate ||
        (priorityFilter.length > 0 && !priorityFilter.includes(task.priority))
      )
        continue;
      const onDate = result.get(task.dueDate) ?? [];
      onDate.push(task);
      result.set(task.dueDate, onDate);
    }
    return result;
  }, [tasks, priorityFilter]);
  const activeCount = tasks.filter((task) => !task.completed).length;
  const doneCount = tasks.length - activeCount;
  const todayTasks = tasks.filter((task) => task.dueDate === today);
  const todayDone = todayTasks.filter((task) => task.completed).length;
  const overdueCount = tasks.filter(
    (task) => !task.completed && task.dueDate && task.dueDate < today,
  ).length;
  const progress = tasks.length
    ? Math.round((doneCount / tasks.length) * 100)
    : 0;

  const workspaceTasks = useMemo(() => {
    const query = search.trim().toLowerCase();
    return tasks.filter((task) => {
      if (view === "calendar" && task.dueDate !== selectedDate) return false;
      if (view === "today" && task.dueDate !== today) return false;
      if (
        view === "upcoming" &&
        (task.dueDate === null || task.dueDate <= today || task.completed)
      )
        return false;
      if (
        view === "overdue" &&
        (task.dueDate === null || task.dueDate >= today || task.completed)
      )
        return false;
      if (view === "completed" && !task.completed) return false;
      if (view !== "completed") {
        if (status === "active" && task.completed) return false;
        if (status === "done" && !task.completed) return false;
      }
      return `${task.title} ${task.description}`.toLowerCase().includes(query);
    });
  }, [tasks, view, status, selectedDate, search, today]);

  const workspaceTaskIds = useMemo(
    () => new Set(workspaceTasks.map((task) => task.id)),
    [workspaceTasks],
  );
  const priorityCounts = useMemo(() => {
    const counts: Record<Priority, number> = { high: 0, medium: 0, low: 0 };
    for (const task of workspaceTasks) counts[task.priority]++;
    return counts;
  }, [workspaceTasks]);

  const visibleRows = useMemo<VisibleRow[]>(() => {
    const matches = (task: Task) =>
      workspaceTaskIds.has(task.id) &&
      (priorityFilter.length === 0 || priorityFilter.includes(task.priority));

    const ordered = [...tasks].sort(compareTasks(sort));
    const children = new Map<string, Task[]>();
    const roots: Task[] = [];
    for (const task of ordered) {
      if (task.parentId) {
        const group = children.get(task.parentId) ?? [];
        group.push(task);
        children.set(task.parentId, group);
      } else roots.push(task);
    }

    const rows: VisibleRow[] = [];
    for (const parent of roots) {
      const parentMatches = matches(parent);
      const matchingChildren = (children.get(parent.id) ?? []).filter(matches);
      if (!parentMatches && !matchingChildren.length) continue;
      rows.push({ task: parent, depth: 0, contextOnly: !parentMatches });
      for (const child of matchingChildren)
        rows.push({ task: child, depth: 1, contextOnly: false });
    }
    return rows;
  }, [tasks, workspaceTaskIds, priorityFilter, sort]);

  const visibleCount = visibleRows.filter((row) => !row.contextOnly).length;
  // Strictly bound the number of mounted rows, even if one task has thousands of subtasks.
  const displayedRows = visibleRows.slice(0, visibleLimit);
  const remainingRows = visibleRows.length - displayedRows.length;

  useEffect(() => {
    setVisibleLimit(TASKS_PER_PAGE);
  }, [view, status, priorityFilter, selectedDate, search, sort]);

  const childCountByParent = useMemo(() => {
    const result = new Map<string, { total: number; done: number }>();
    for (const task of tasks) {
      if (!task.parentId) continue;
      const previous = result.get(task.parentId) ?? { total: 0, done: 0 };
      result.set(task.parentId, {
        total: previous.total + 1,
        done: previous.done + Number(task.completed),
      });
    }
    return result;
  }, [tasks]);

  function selectView(next: View) {
    setView(next);
    setStatus("all");
    setSearch("");
    setMenuOpen(false);
    setQuickDueDate(
      next === "calendar"
        ? selectedDate
        : next === "today"
          ? today
          : next === "upcoming"
            ? dayOffset(1)
            : "",
    );
  }

  function selectPriority(next: Priority) {
    setPriorityFilter((current) =>
      current.includes(next)
        ? current.filter((priority) => priority !== next)
        : [...current, next],
    );
    setMenuOpen(false);
  }

  function selectCalendarDate(date: string) {
    setSelectedDate(date);
    setCalendarMonth(date.slice(0, 7));
    setQuickDueDate(date);
  }

  function moveCalendar(amount: number) {
    const month = shiftMonth(calendarMonth, amount);
    selectCalendarDate(`${month}-01`);
  }

  function saveProfile(name = profileDraft) {
    const trimmed = name.trim().slice(0, 40);
    if (profileMode === "create") {
      const nextProfile = createProfile(trimmed);
      setProfiles((current) => ({
        ...current,
        profiles: [...current.profiles, nextProfile],
        activeId: nextProfile.id,
        welcomed: true,
      }));
      setTasksByProfile((previous) => ({
        ...previous,
        [nextProfile.id]: [],
      }));
      resetWorkspace();
    } else {
      setProfiles((current) => ({
        ...current,
        profiles: current.profiles.map((item) =>
          item.id === current.activeId ? { ...item, name: trimmed } : item,
        ),
        welcomed: true,
      }));
    }
    setShowProfile(false);
  }

  function openProfile() {
    setProfileMode("edit");
    setProfileDraft(profile.name);
    setShowProfile(true);
    setMenuOpen(false);
  }

  function resetWorkspace() {
    setView("inbox");
    setStatus("all");
    setPriorityFilter([]);
    setSort("due");
    setSearch("");
    setVisibleLimit(TASKS_PER_PAGE);
    setQuickTitle("");
    setQuickPriority("medium");
    setQuickDueDate("");
    setDeletedTasks([]);
    setShowEditor(false);
    setMenuOpen(false);
  }

  function switchProfile(id: string) {
    if (!profiles.profiles.some((item) => item.id === id)) return;
    if (id === profiles.activeId) {
      setShowProfile(false);
      return;
    }
    setProfiles((current) => ({ ...current, activeId: id }));
    resetWorkspace();
    setShowProfile(false);
  }

  function startNewProfile() {
    setProfileMode("create");
    setProfileDraft("");
  }

  function closeProfile() {
    if (!profile.welcomed) {
      saveProfile("");
    } else if (profileMode === "create") {
      setProfileMode("edit");
      setProfileDraft(profile.name);
    } else {
      setShowProfile(false);
    }
  }

  function openNewTask(parentId: string | null = null) {
    setEditingId(null);
    setParentForNewTask(parentId);
    setDraft({
      ...emptyDraft,
      dueDate:
        view === "calendar"
          ? selectedDate
          : view === "today"
            ? today
            : view === "upcoming"
              ? dayOffset(1)
              : "",
    });
    setShowEditor(true);
  }

  function editTask(task: Task) {
    setEditingId(task.id);
    setParentForNewTask(null);
    setDraft({
      title: task.title,
      description: task.description,
      priority: task.priority,
      dueDate: task.dueDate || "",
    });
    setShowEditor(true);
  }

  function quickAdd(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const title = quickTitle.trim();
    if (!title) return;
    const dueDate =
      quickDueDate ||
      (view === "calendar"
        ? selectedDate
        : view === "today"
          ? today
          : view === "upcoming"
            ? dayOffset(1)
            : "");
    setTasks((previous) => [
      makeTask(title, {
        priority: quickPriority,
        dueDate: dueDate || null,
      }),
      ...previous,
    ]);
    setQuickTitle("");
    setQuickPriority("medium");
    setQuickDueDate(
      view === "today" && dueDate === today
        ? today
        : view === "upcoming" && dueDate > today
          ? dayOffset(1)
          : "",
    );
    if (view === "calendar") {
      selectCalendarDate(dueDate);
    } else if (
      view === "completed" ||
      (view === "today" && dueDate !== today) ||
      (view === "upcoming" && (!dueDate || dueDate <= today)) ||
      (view === "overdue" && (!dueDate || dueDate >= today))
    ) {
      setView("inbox");
    }
    setStatus("all");
    setSearch("");
  }

  function saveEditor(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const title = draft.title.trim();
    if (!title) return;
    if (editingId) {
      setTasks((previous) =>
        previous.map((task) =>
          task.id === editingId
            ? {
                ...task,
                title,
                description: draft.description.trim(),
                dueDate: draft.dueDate || null,
                priority: draft.priority,
              }
            : task,
        ),
      );
    } else {
      setTasks((previous) => [
        makeTask(title, {
          description: draft.description.trim(),
          dueDate: draft.dueDate || null,
          priority: draft.priority,
          parentId: parentForNewTask,
        }),
        ...previous.map((task) =>
          task.id === parentForNewTask ? { ...task, completed: false } : task,
        ),
      ]);
      if (view === "calendar" && draft.dueDate)
        selectCalendarDate(draft.dueDate);
      else if (
        view === "completed" ||
        (view === "today" && draft.dueDate !== today) ||
        (view === "upcoming" && (!draft.dueDate || draft.dueDate <= today)) ||
        (view === "overdue" && (!draft.dueDate || draft.dueDate >= today))
      )
        setView("inbox");
      setSearch("");
      setStatus("all");
    }
    setShowEditor(false);
  }

  function toggleTask(id: string) {
    setTasks((previous) => {
      const target = previous.find((task) => task.id === id);
      if (!target) return previous;
      const completed = !target.completed;
      return previous.map((task) => {
        if (task.id === id) return { ...task, completed };
        // Completing a parent resolves its checklist; reopening retains progress.
        if (!target.parentId && task.parentId === id && completed)
          return { ...task, completed: true };
        // Reopening a child must reopen an already-completed parent.
        if (target.parentId && task.id === target.parentId && !completed)
          return { ...task, completed: false };
        return task;
      });
    });
  }

  function removeTask(task: Task) {
    const removed = tasks.filter(
      (item) => item.id === task.id || item.parentId === task.id,
    );
    setTasks((previous) =>
      previous.filter(
        (item) => !removed.some((deleted) => deleted.id === item.id),
      ),
    );
    setDeletedTasks(removed);
  }

  function undoDelete() {
    setTasks((previous) => [
      ...deletedTasks.filter(
        (deleted) => !previous.some((task) => task.id === deleted.id),
      ),
      ...previous,
    ]);
    setDeletedTasks([]);
  }

  function loadExamples() {
    setTasks((previous) => [...previous, ...demoTasks()]);
    setView("inbox");
    setStatus("all");
    setSearch("");
  }

  const currentTitle =
    navigation.find((item) => item.key === view)?.label || "Все задачи";
  const selectedDateLabel = new Date(
    `${selectedDate}T12:00:00`,
  ).toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "long",
  });
  const editorParent = tasks.find(
    (task) =>
      task.id ===
      (parentForNewTask ??
        tasks.find((item) => item.id === editingId)?.parentId),
  );
  const dateLong = new Date().toLocaleDateString("ru-RU", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  const greeting =
    new Date().getHours() < 12
      ? "Доброе утро"
      : new Date().getHours() < 18
        ? "Добрый день"
        : "Добрый вечер";
  const EmptyIcon = search
    ? Search
    : view === "overdue"
      ? AlertTriangle
      : view === "today"
        ? Sun
        : view === "upcoming"
          ? CalendarDays
          : view === "completed" || status === "done"
            ? CheckCheck
            : Sparkles;
  const emptyTitle = search
    ? "Ничего не найдено"
    : view === "calendar"
      ? "На этот день задач нет"
      : view === "overdue"
        ? "Просроченных задач нет"
        : view === "today"
          ? "На сегодня всё свободно"
          : view === "upcoming"
            ? "Пока нет планов на будущее"
            : view === "completed" || status === "done"
              ? "Пока нет выполненных задач"
              : "Здесь пока пусто";
  const emptyDetail = search
    ? "Попробуйте изменить запрос."
    : view === "calendar"
      ? "Выберите другую дату или добавьте новую задачу."
      : view === "overdue"
        ? "Отлично! Все сроки под контролем."
        : "Добавьте новое дело или переключите фильтр.";
  const sidebarCounts: Record<View, number> = {
    inbox: tasks.length,
    today: todayTasks.length,
    upcoming: tasks.filter(
      (task) => !!task.dueDate && task.dueDate > today && !task.completed,
    ).length,
    overdue: overdueCount,
    completed: doneCount,
    calendar: tasks.filter((task) => !!task.dueDate).length,
  };

  return (
    <div className="app-shell">
      <a className="skip-link" href="#task-list-heading">
        Перейти к списку задач
      </a>
      <Sidebar
        sidebarRef={sidebarRef}
        menuOpen={menuOpen}
        onCloseMenu={() => setMenuOpen(false)}
        onOpenProfile={openProfile}
        onShowTips={() => {
          setMenuOpen(false);
          setShowTips(true);
        }}
        profileName={profile.name}
        profiles={profiles}
        view={view}
        onSelectView={selectView}
        counts={sidebarCounts}
        priorityFilter={priorityFilter}
        priorityCounts={priorityCounts}
        onSelectPriority={selectPriority}
      />

      {menuOpen && (
        <button
          className="mobile-backdrop"
          aria-hidden="true"
          tabIndex={-1}
          type="button"
          onClick={() => setMenuOpen(false)}
        />
      )}

      <main className="main-area">
        <div className="topbar">
          <button
            ref={menuButtonRef}
            className="icon-button mobile-menu"
            type="button"
            aria-label="Открыть меню"
            onClick={() => setMenuOpen(true)}
          >
            <Menu size={22} />
          </button>
          <span className="breadcrumb">
            <LayoutGrid size={15} /> Пространство{" "}
            <span className="slash">/</span> <strong>{currentTitle}</strong>
          </span>
          <div className="topbar-actions">
            <span className="date-pill">
              <CalendarDays size={15} />{" "}
              {new Date().toLocaleDateString("ru-RU", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </span>
          </div>
        </div>

        <div className="content-wrap">
          <header className="page-heading">
            <div>
              <div className="eyebrow">
                <span className="eyebrow-dot" /> {dateLong}
              </div>
              <h1>
                {greeting}
                {profile.name ? ", " : " "}
                {profile.name ? (
                  <span className="name-with-spark">
                    <span className="display-name">{profile.name}</span>
                    <span className="wave" aria-hidden="true">
                      ✳
                    </span>
                  </span>
                ) : (
                  <span className="wave" aria-hidden="true">
                    ✳
                  </span>
                )}
              </h1>
              <p>Хороший день, чтобы сосредоточиться на главном.</p>
            </div>
          </header>

          <div className="hero-grid">
            <section className="focus-card">
              <div className="focus-orb orb-one" />
              <div className="focus-orb orb-two" />
              <div className="focus-card-content">
                <div className="focus-caption">
                  <Sparkles size={15} /> ВАШ ПРОГРЕСС
                </div>
                <h2>
                  Каждая задача —<br />
                  <em>шаг вперёд.</em>
                </h2>
                <p>Продолжайте в своём темпе. Вы отлично справляетесь!</p>
                <div className="focus-bottom">
                  <span className="focus-stat">
                    <strong>{doneCount}</strong> из {tasks.length} выполнено
                  </span>
                  <span className="focus-percent-mobile">{progress}%</span>
                </div>
              </div>
              <div
                className="progress-ring"
                role="progressbar"
                aria-label="Общий прогресс выполнения задач"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={progress}
                style={{ "--progress": `${progress}%` } as React.CSSProperties}
              >
                <div className="progress-inner">
                  <strong>{progress}%</strong>
                  <small>готово</small>
                </div>
              </div>
            </section>
            <section className="today-card">
              <div className="today-card-heading">
                <span className="today-icon">
                  <Sun size={19} />
                </span>
                <span>Сегодня</span>
              </div>
              <div className="today-metric">
                <strong>{todayTasks.length - todayDone}</strong>
                <span>задач осталось</span>
              </div>
              <div className="today-bottom">
                <p>
                  {todayTasks.length
                    ? `${todayDone} из ${todayTasks.length} задач завершено`
                    : "На сегодня всё свободно"}
                </p>
              </div>
            </section>
          </div>

          {view === "calendar" && (
            <CalendarPanel
              month={calendarMonth}
              today={today}
              selectedDate={selectedDate}
              tasksByDate={tasksByDate}
              onSelectDate={selectCalendarDate}
              onMoveMonth={moveCalendar}
            />
          )}

          <section
            className="tasks-section"
            aria-labelledby="task-list-heading"
          >
            <div className="section-top">
              <div>
                <span className="section-eyebrow">ОРГАНИЗУЙТЕ СВОЙ ДЕНЬ</span>
                <h2 id="task-list-heading" tabIndex={-1}>
                  {view === "calendar"
                    ? `Задачи на ${selectedDateLabel}`
                    : currentTitle}{" "}
                  <span className="task-count">{visibleCount}</span>
                </h2>
              </div>
              <button
                type="button"
                className="primary-button section-add"
                onClick={() => openNewTask()}
              >
                <Plus size={17} /> Новая задача
              </button>
            </div>

            <TaskFilters
              view={view}
              status={status}
              setStatus={setStatus}
              sort={sort}
              setSort={setSort}
              search={search}
              setSearch={setSearch}
              priorityFilter={priorityFilter}
              selectPriority={selectPriority}
              setPriorityFilter={setPriorityFilter}
            />

            <TaskRows
              visibleRows={visibleRows}
              displayedRows={displayedRows}
              remainingRows={remainingRows}
              setVisibleLimit={setVisibleLimit}
              today={today}
              childCountByParent={childCountByParent}
              editTask={editTask}
              toggleTask={toggleTask}
              openNewTask={openNewTask}
              removeTask={removeTask}
              EmptyIcon={EmptyIcon}
              emptyTitle={emptyTitle}
              emptyDetail={emptyDetail}
              search={search}
              taskCount={tasks.length}
              loadExamples={loadExamples}
            />

            <QuickAdd
              quickAdd={quickAdd}
              quickTitle={quickTitle}
              setQuickTitle={setQuickTitle}
              quickPriority={quickPriority}
              setQuickPriority={setQuickPriority}
              quickDueDate={quickDueDate}
              setQuickDueDate={setQuickDueDate}
            />
            <div className="list-footer">
              <span>
                <span className="live-dot" /> {activeCount} активных задач
              </span>
              <span>
                Сохраняется на этом устройстве <Check size={14} />
              </span>
            </div>
          </section>

          <footer className="app-footer">
            Сделано с вниманием к деталям <span>✳</span> Daymark ©{" "}
            {new Date().getFullYear()}
          </footer>
        </div>
      </main>

      {storageWarning && (
        <div className="storage-warning" role="alert">
          Не удалось сохранить задачи. Проверьте настройки браузера.
        </div>
      )}
      {deletedTasks.length > 0 && (
        <div className="undo-toast" role="status">
          <span>
            {deletedTasks.length > 1
              ? `Задача и ${deletedTasks.length - 1} подзадач удалены`
              : "Задача удалена"}
          </span>
          <button type="button" onClick={undoDelete}>
            <RotateCcw size={16} /> Отменить
          </button>
          <button
            type="button"
            className="toast-close"
            aria-label="Закрыть уведомление"
            onClick={() => setDeletedTasks([])}
          >
            <X size={16} />
          </button>
        </div>
      )}

      {showProfile && (
        <ProfileDialog
          profile={profile}
          profileMode={profileMode}
          profiles={profiles}
          tasksByProfile={tasksByProfile}
          profileNameRef={profileNameRef}
          profileDraft={profileDraft}
          setProfileDraft={setProfileDraft}
          switchProfile={switchProfile}
          startNewProfile={startNewProfile}
          closeProfile={closeProfile}
          saveProfile={saveProfile}
        />
      )}

      {showEditor && (
        <TaskEditorDialog
          editingId={editingId}
          parentForNewTask={parentForNewTask}
          editorParent={editorParent}
          draft={draft}
          setDraft={setDraft}
          setShowEditor={setShowEditor}
          saveEditor={saveEditor}
        />
      )}

      {showTips && <InfoDialog setShowTips={setShowTips} />}
    </div>
  );
}

export default App;

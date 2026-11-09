import type { Dispatch, RefObject, SetStateAction } from "react";
import { ArrowRight, Check, Plus, UserRound, X } from "lucide-react";
import { AccessibleDialog } from "./AccessibleDialog";
import { taskCountLabel, type Task } from "../domain/tasks";
import type { ProfileRegistry } from "../lib/profiles";

type ProfileDialogProps = {
  profile: { name: string; welcomed: boolean };
  profileMode: "edit" | "create";
  profiles: ProfileRegistry;
  tasksByProfile: Record<string, Task[]>;
  profileNameRef: RefObject<HTMLInputElement | null>;
  profileDraft: string;
  setProfileDraft: Dispatch<SetStateAction<string>>;
  switchProfile: (id: string) => void;
  startNewProfile: () => void;
  closeProfile: () => void;
  saveProfile: (name?: string) => void;
};

export function ProfileDialog({
  profile,
  profileMode,
  profiles,
  tasksByProfile,
  profileNameRef,
  profileDraft,
  setProfileDraft,
  switchProfile,
  startNewProfile,
  closeProfile,
  saveProfile,
}: ProfileDialogProps) {
  return (
    <AccessibleDialog
      className="profile-modal"
      labelledBy="profile-title"
      onClose={closeProfile}
      initialFocusSelector="#profile-name"
    >
      <div className="modal-top">
        <div>
          <span className="section-eyebrow">ЛОКАЛЬНЫЕ ПРОФИЛИ</span>
          <h2 id="profile-title">
            {!profile.welcomed
              ? "Давайте знакомиться"
              : profileMode === "create"
                ? "Новый профиль"
                : "Ваши профили"}
          </h2>
        </div>
        <button
          type="button"
          className="icon-button"
          aria-label="Закрыть"
          onClick={closeProfile}
        >
          <X size={20} />
        </button>
      </div>
      <p className="profile-explanation">
        {!profile.welcomed
          ? "Как к вам обращаться? Имя необязательно, его можно изменить позже."
          : profileMode === "create"
            ? "Создайте отдельное пространство со своим списком дел. Имя указывать необязательно."
            : "Переключайтесь между профилями: у каждого собственные задачи и календарь."}
      </p>
      {profile.welcomed && profileMode === "edit" && (
        <div
          className="profile-switcher"
          role="group"
          aria-label="Профили на устройстве"
        >
          {profiles.profiles.map((item, index) => {
            const selected = item.id === profiles.activeId;
            const displayName =
              item.name ||
              (index === 0 ? "Моё пространство" : `Профиль ${index + 1}`);
            return (
              <button
                key={item.id}
                type="button"
                className={`profile-choice ${selected ? "selected" : ""}`}
                aria-current={selected ? "true" : undefined}
                aria-label={`Переключить на профиль: ${displayName}`}
                onClick={() => switchProfile(item.id)}
              >
                <span className="profile-choice-avatar">
                  {item.name ? (
                    item.name[0].toLocaleUpperCase("ru-RU")
                  ) : (
                    <UserRound size={17} />
                  )}
                </span>
                <span className="profile-choice-name">{displayName}</span>
                <small>
                  {taskCountLabel(tasksByProfile[item.id]?.length ?? 0)}
                </small>
                {selected && <Check size={17} aria-hidden="true" />}
              </button>
            );
          })}
          <button
            type="button"
            className="profile-create-button"
            onClick={startNewProfile}
          >
            <Plus size={17} aria-hidden="true" /> Добавить профиль
          </button>
        </div>
      )}
      <form
        onSubmit={(event) => {
          event.preventDefault();
          saveProfile();
        }}
      >
        <label className="form-label" htmlFor="profile-name">
          {profileMode === "create" ? "Имя нового профиля" : "Ваше имя"}{" "}
          <span>(необязательно)</span>
        </label>
        <input
          ref={profileNameRef}
          className="form-input"
          id="profile-name"
          type="text"
          autoComplete="given-name"
          maxLength={40}
          placeholder="Как вас называть?"
          value={profileDraft}
          onChange={(event) => setProfileDraft(event.target.value)}
        />
        <div className="modal-actions">
          <button
            type="button"
            className="secondary-button"
            onClick={() =>
              profileMode === "create" ? closeProfile() : saveProfile("")
            }
          >
            {profileMode === "create" ? "Отмена" : "Без имени"}
          </button>
          <button type="submit" className="primary-button">
            {profileMode === "create"
              ? "Создать профиль"
              : profile.welcomed
                ? "Сохранить имя"
                : "Продолжить"}
            <ArrowRight size={17} />
          </button>
        </div>
      </form>
      <p className="profile-local-note">
        Профили хранятся только в этом браузере, без регистрации и синхронизации
        между устройствами.
      </p>
    </AccessibleDialog>
  );
}

export type LocalProfile = { id: string; name: string };

export type ProfileRegistry = {
  profiles: LocalProfile[];
  activeId: string;
  welcomed: boolean;
};

export const DEFAULT_PROFILE_ID = "local";
export const PROFILES_KEY = "daymark:profiles:v1";
export const LEGACY_PROFILE_KEY = "daymark:profile:v1";
export const LEGACY_TASKS_KEY = "daymark:tasks:v1";

export function taskStorageKey(id: string): string {
  // Keep the original task storage untouched so existing users retain their work.
  return id === DEFAULT_PROFILE_ID
    ? LEGACY_TASKS_KEY
    : `${LEGACY_TASKS_KEY}:${id}`;
}

export function createProfile(name: string): LocalProfile {
  return {
    id: `profile-${globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`}`,
    name: name.trim().slice(0, 40),
  };
}

function legacyProfile(): ProfileRegistry {
  let name = "";
  let welcomed = false;
  try {
    const raw = window.localStorage.getItem(LEGACY_PROFILE_KEY);
    if (raw !== null) {
      const parsed: unknown = JSON.parse(raw);
      if (parsed && typeof parsed === "object" && "name" in parsed) {
        const savedName = (parsed as { name: unknown }).name;
        name =
          typeof savedName === "string" ? savedName.trim().slice(0, 40) : "";
        welcomed = true;
      }
    }
  } catch {
    // An invalid legacy profile must not hide an existing task list.
  }
  return {
    profiles: [{ id: DEFAULT_PROFILE_ID, name }],
    activeId: DEFAULT_PROFILE_ID,
    welcomed,
  };
}

export function readProfiles(): ProfileRegistry {
  try {
    const raw = window.localStorage.getItem(PROFILES_KEY);
    if (raw !== null) {
      const parsed: unknown = JSON.parse(raw);
      if (parsed && typeof parsed === "object" && "profiles" in parsed) {
        const candidate = parsed as Partial<ProfileRegistry>;
        const ids = new Set<string>();
        const profiles = (
          Array.isArray(candidate.profiles) ? candidate.profiles : []
        )
          .filter(
            (profile): profile is LocalProfile =>
              !!profile &&
              typeof profile.id === "string" &&
              /^(local|profile-[\w-]{1,80})$/.test(profile.id) &&
              typeof profile.name === "string",
          )
          .filter((profile) => {
            if (ids.has(profile.id)) return false;
            ids.add(profile.id);
            return true;
          })
          .map((profile) => ({
            ...profile,
            name: profile.name.trim().slice(0, 40),
          }));
        if (profiles.length > 0) {
          return {
            profiles,
            activeId: profiles.some(
              (profile) => profile.id === candidate.activeId,
            )
              ? candidate.activeId!
              : profiles[0].id,
            welcomed: candidate.welcomed !== false,
          };
        }
      }
    }
  } catch {
    // Recover from legacy records when the new registry is malformed.
  }
  return legacyProfile();
}

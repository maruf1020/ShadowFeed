export const userSettingFeedSortValues = ["activity", "newest", "trending", "comments"] as const;

export type UserSettingFeedSort = (typeof userSettingFeedSortValues)[number];

export const userSettingFeedSortOptions = [
  { value: "activity", label: "Latest activity" },
  { value: "newest", label: "Newest posts" },
  { value: "trending", label: "Most heated" },
  { value: "comments", label: "Most discussed" },
] as const;

export type ResolvedUserSettings = {
  defaultFeedSort: UserSettingFeedSort;
  preferAnonymousPublishing: boolean;
  autoPromoteAnonymousPosts: boolean;
};

type UserSettingsInput = {
  defaultFeedSort?: string | null;
  preferAnonymousPublishing?: boolean | null;
  autoPromoteAnonymousPosts?: boolean | null;
};

export const defaultUserSettings: ResolvedUserSettings = {
  defaultFeedSort: "activity",
  preferAnonymousPublishing: false,
  autoPromoteAnonymousPosts: true,
};

export function isUserSettingFeedSort(value: string | null | undefined): value is UserSettingFeedSort {
  return userSettingFeedSortValues.includes(value as UserSettingFeedSort);
}

export function resolveUserSettings(
  settings?: UserSettingsInput | null,
): ResolvedUserSettings {
  return {
    defaultFeedSort: isUserSettingFeedSort(settings?.defaultFeedSort)
      ? settings.defaultFeedSort
      : defaultUserSettings.defaultFeedSort,
    preferAnonymousPublishing:
      settings?.preferAnonymousPublishing ?? defaultUserSettings.preferAnonymousPublishing,
    autoPromoteAnonymousPosts:
      settings?.autoPromoteAnonymousPosts ?? defaultUserSettings.autoPromoteAnonymousPosts,
  };
}
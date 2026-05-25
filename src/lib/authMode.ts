export type HomeUser = {
  id: string;
  email: string;
  isGuest: boolean;
};

export const GUEST_USER_ID = "guest";
export const GUEST_MODE_STORAGE_KEY = "life-tracker:guest-mode";

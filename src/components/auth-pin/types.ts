export interface UserProfile {
  id: string;
  full_name?: string | null;
  nama?: string | null;
  avatar_url?: string | null;
  role?: string | null;
}

export type AuthStep = "profile-select" | "pin-entry" | "location-select";

export interface PinValidationResult {
  success: boolean;
  user?: UserProfile;
  error?: string;
}

export interface LocationGroup {
  label: string;
  badgeColor: string;
  locations: string[];
}

/** The customer's own details. The username is internal (random), so it is not part of the profile. */
export interface Profile {
  firstName: string;
  lastName: string;
  /** Sign-in email; shown, not edited here (changing it needs a re-check of the password). */
  email: string;
}

export type ProfileInput = Pick<Profile, "firstName" | "lastName">;
export type ProfileError = "required" | "too_long";

const MAX = 50;

export const validateProfile = (input: ProfileInput): Partial<Record<keyof ProfileInput, ProfileError>> => {
  const errors: Partial<Record<keyof ProfileInput, ProfileError>> = {};
  for (const field of ["firstName", "lastName"] as const) {
    const v = input[field].trim();
    if (!v) errors[field] = "required";
    else if (v.length > MAX) errors[field] = "too_long";
  }
  return errors;
};

export const cleanProfile = (input: ProfileInput): ProfileInput => ({
  firstName: input.firstName.trim(),
  lastName: input.lastName.trim(),
});

export const fullName = (p: Pick<Profile, "firstName" | "lastName">) => [p.firstName, p.lastName].filter(Boolean).join(" ");

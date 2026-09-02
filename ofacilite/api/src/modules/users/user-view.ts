import type { User } from './user.entity';

export interface UserView {
  id: string;
  loginCode: string;
  role: User['role'];
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  birthDate: string | null;
  age: number | null;
  language: string;
  notes: string | null;
  disabled: boolean;
  lastLoginAt: string | null;
  lastSeenAt: string | null;
  createdAt: string;
  updatedAt: string;
}

function ageFromBirthDate(birthDate: string | null): number | null {
  if (!birthDate) return null;
  const d = new Date(birthDate);
  if (Number.isNaN(d.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - d.getFullYear();
  const m = now.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age--;
  return age >= 0 && age < 150 ? age : null;
}

export function toUserView(u: User): UserView {
  return {
    id: u.id,
    loginCode: u.loginCode,
    role: u.role,
    firstName: u.firstName,
    lastName: u.lastName,
    email: u.email,
    phone: u.phone,
    birthDate: u.birthDate,
    age: ageFromBirthDate(u.birthDate),
    language: u.language,
    notes: u.notes,
    disabled: u.disabled,
    lastLoginAt: u.lastLoginAt ? u.lastLoginAt.toISOString() : null,
    lastSeenAt: u.lastSeenAt ? u.lastSeenAt.toISOString() : null,
    createdAt: u.createdAt.toISOString(),
    updatedAt: u.updatedAt.toISOString(),
  };
}

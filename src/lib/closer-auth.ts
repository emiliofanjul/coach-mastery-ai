/**
 * Almacenamiento ligero del rol seleccionado entre Pantalla 2 → 3/4.
 * Usamos sessionStorage para que persista a través de OAuth redirect.
 */
export type CloserRole = "manager" | "vendedor";

const ROLE_KEY = "closer:selectedRole";
const COMPANY_NAME_KEY = "closer:pendingCompanyName";
const INVITE_CODE_KEY = "closer:pendingInviteCode";

export function setSelectedRole(role: CloserRole) {
  if (typeof window !== "undefined") sessionStorage.setItem(ROLE_KEY, role);
}
export function getSelectedRole(): CloserRole | null {
  if (typeof window === "undefined") return null;
  const v = sessionStorage.getItem(ROLE_KEY);
  return v === "manager" || v === "vendedor" ? v : null;
}
export function clearSelectedRole() {
  if (typeof window !== "undefined") sessionStorage.removeItem(ROLE_KEY);
}

export function setPendingCompanyName(name: string) {
  if (typeof window !== "undefined") sessionStorage.setItem(COMPANY_NAME_KEY, name);
}
export function getPendingCompanyName() {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem(COMPANY_NAME_KEY);
}
export function setPendingInviteCode(code: string) {
  if (typeof window !== "undefined") sessionStorage.setItem(INVITE_CODE_KEY, code);
}
export function getPendingInviteCode() {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem(INVITE_CODE_KEY);
}
export function clearPending() {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(COMPANY_NAME_KEY);
  sessionStorage.removeItem(INVITE_CODE_KEY);
}

export function passwordStrength(pw: string): 0 | 1 | 2 | 3 {
  if (pw.length < 8) return 0;
  let score = 1;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw) && /\d/.test(pw)) score = 2;
  if (score === 2 && /[^A-Za-z0-9]/.test(pw) && pw.length >= 12) score = 3;
  return score as 0 | 1 | 2 | 3;
}

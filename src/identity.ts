export type AccountType = "individual" | "business";

const ACCOUNT_TYPE_KEY = "greenwallet-account-type";
const IDENTITY_VERIFIED_KEY = "greenwallet-identity-verified";

function readSessionValue(key: string) {
  try {
    return window.sessionStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeSessionValue(key: string, value: string) {
  try {
    window.sessionStorage.setItem(key, value);
  } catch {
    // The verification flow still works for this page view when storage is unavailable.
  }
}

function removeSessionValue(key: string) {
  try {
    window.sessionStorage.removeItem(key);
  } catch {
    // Ignore unavailable storage.
  }
}

export function getAccountType(): AccountType {
  return readSessionValue(ACCOUNT_TYPE_KEY) === "business"
    ? "business"
    : "individual";
}

export function setAccountType(accountType: AccountType) {
  if (accountType !== getAccountType()) {
    clearIdentityVerification();
  }
  writeSessionValue(ACCOUNT_TYPE_KEY, accountType);
}

export function isIdentityVerified() {
  return readSessionValue(IDENTITY_VERIFIED_KEY) === "true";
}

export function setIdentityVerified() {
  writeSessionValue(IDENTITY_VERIFIED_KEY, "true");
}

export function clearIdentityVerification() {
  removeSessionValue(IDENTITY_VERIFIED_KEY);
}

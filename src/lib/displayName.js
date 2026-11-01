// Member display name resolution.
// The auth record's full_name cannot be changed by the platform, so member-facing
// screens show the operator-set display_name when present, falling back to full_name.

export function getDisplayName(user, fallback = 'Member') {
  const name = (user?.display_name || user?.full_name || '').trim();
  return name || fallback;
}

export function getDisplayInitial(user, fallback = 'M') {
  return (getDisplayName(user, fallback).charAt(0) || fallback).toUpperCase();
}

export function getDisplayFirstName(user, fallback = 'Member') {
  return getDisplayName(user, fallback).split(/\s+/)[0] || fallback;
}
/**
 * Shared localStorage-based starred/flagged message helper.
 * Used by AgentChat and MemberAdvisorChat to let users star
 * important messages for quick retrieval later.
 */

const STARRED_KEY = 'vantoris_starred_messages';

function getStarredMap() {
  try { return JSON.parse(localStorage.getItem(STARRED_KEY) || '{}'); } catch { return {}; }
}

export function getStarredIds(convId) {
  const map = getStarredMap();
  return new Set(map[convId] || []);
}

export function isStarred(convId, msgKey) {
  return getStarredIds(convId).has(msgKey);
}

export function toggleStar(convId, msgKey) {
  const map = getStarredMap();
  if (!map[convId]) map[convId] = [];
  const idx = map[convId].indexOf(msgKey);
  if (idx >= 0) {
    map[convId].splice(idx, 1);
  } else {
    map[convId].push(msgKey);
  }
  if (map[convId].length === 0) delete map[convId];
  localStorage.setItem(STARRED_KEY, JSON.stringify(map));
}

export function getMessageKey(message) {
  return message.id || `${message.created_date || ''}_${message.role || ''}`;
}

/**
 * localStorage-based deleted conversation helper.
 * The platform agent API lacks server-side delete, so we
 * hide deleted conversations client-side per agent_name.
 */
const DELETED_KEY = 'vantoris_deleted_conversations';

function getDeletedMap() {
  try { return JSON.parse(localStorage.getItem(DELETED_KEY) || '{}'); } catch { return {}; }
}

export function getDeletedIds(agentName) {
  const map = getDeletedMap();
  return new Set(map[agentName] || []);
}

export function addDeletedId(agentName, convId) {
  const map = getDeletedMap();
  if (!map[agentName]) map[agentName] = [];
  if (!map[agentName].includes(convId)) {
    map[agentName].push(convId);
    localStorage.setItem(DELETED_KEY, JSON.stringify(map));
  }
}
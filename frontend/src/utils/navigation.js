import { router } from 'expo-router';

let lastNavTimestamp = 0;
let lastNavKey = '';
const NAV_COOLDOWN_MS = 450;

function serializeTarget(target) {
  if (typeof target === 'string') return target;
  if (target && typeof target === 'object') {
    return `${target.pathname || ''}:${JSON.stringify(target.params || {})}`;
  }
  return String(target);
}

function shouldAllowNavigation(target) {
  const now = Date.now();
  const key = serializeTarget(target);
  if (key === lastNavKey && now - lastNavTimestamp < NAV_COOLDOWN_MS) {
    return false;
  }
  if (now - lastNavTimestamp < 250) {
    return false;
  }
  lastNavTimestamp = now;
  lastNavKey = key;
  return true;
}

export function safeNavigate(target) {
  if (!shouldAllowNavigation(target)) return;
  router.navigate(target);
}

export function safePush(target) {
  if (!shouldAllowNavigation(target)) return;
  router.push(target);
}

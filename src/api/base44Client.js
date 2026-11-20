import { createClient } from '@base44/sdk';
import { appParams } from '@/lib/app-params';

const { appId, token, functionsVersion, appBaseUrl, serverUrl } = appParams;

//Create a client with authentication required
export const base44 = createClient({
  appId,
  token,
  functionsVersion,
  serverUrl,
  requiresAuth: false,
  appBaseUrl
});

// The frontend (Netlify, appBaseUrl) and the Base44 API (serverUrl) live on different domains.
// The SDK's default logout() redirects the browser to `${appBaseUrl}/api/apps/auth/logout`, which
// does not exist on Netlify, and the Base44 logout endpoint itself redirects to the Base44-hosted
// frontend rather than back to us. Sessions here are bearer tokens kept in localStorage, so logout
// only needs to drop the token and send the user to a page on this (Netlify) origin.
//   logout()          → clear the session, no navigation
//   logout(url)       → clear the session, then navigate to url (resolved against this origin)
if (typeof window !== 'undefined') {
  base44.auth.logout = (redirectUrl) => {
    try {
      window.localStorage.removeItem('base44_access_token');
      window.localStorage.removeItem('token');
    } catch (e) {
      // ignore storage access errors
    }
    if (redirectUrl) {
      const target = new URL(redirectUrl, window.location.origin);
      // Never navigate off the frontend origin as part of logout.
      window.location.href = target.origin === window.location.origin ? target.toString() : '/login';
    }
  };
}

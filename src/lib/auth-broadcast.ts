/**
 * Multi-tab auth synchronization via BroadcastChannel.
 *
 * Why: Without this, a logout in tab A leaves the session "live" in tab B
 * — a real security gap on shared workstations and a frequent UX
 * complaint ("I logged out, why am I still in?").
 *
 * How:
 *   - On login/logout/refresh, we post a message to the `hemis-auth`
 *     channel.
 *   - Other tabs listen for it and apply the equivalent state change
 *     locally without making another API call.
 *
 * Falls back to a no-op object on browsers without BroadcastChannel
 * (Safari < 15.4, very old environments). The store still works; it
 * just won't cross-tab sync there.
 */

export type AuthBroadcastEvent = { type: 'login' } | { type: 'logout' } | { type: 'refresh' }

const CHANNEL_NAME = 'hemis-auth'

interface AuthBroadcaster {
  publish: (event: AuthBroadcastEvent) => void
  subscribe: (handler: (event: AuthBroadcastEvent) => void) => () => void
}

function createNoopBroadcaster(): AuthBroadcaster {
  return {
    publish: () => {},
    subscribe: () => () => {},
  }
}

function createRealBroadcaster(): AuthBroadcaster {
  const channel = new BroadcastChannel(CHANNEL_NAME)

  return {
    publish(event) {
      try {
        channel.postMessage(event)
      } catch {
        // postMessage can throw if the channel was closed by the browser.
        // We treat it as a no-op — local state is already correct.
      }
    },
    subscribe(handler) {
      const onMessage = (e: MessageEvent<AuthBroadcastEvent>) => {
        if (e.data && typeof e.data.type === 'string') handler(e.data)
      }
      channel.addEventListener('message', onMessage)
      return () => channel.removeEventListener('message', onMessage)
    },
  }
}

export const authBroadcaster: AuthBroadcaster =
  typeof window !== 'undefined' && typeof BroadcastChannel !== 'undefined'
    ? createRealBroadcaster()
    : createNoopBroadcaster()

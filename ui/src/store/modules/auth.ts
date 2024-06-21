import { CookieStorage } from 'cookie-storage'
import { Module } from 'vuex'
import { VuexOidcClientSettings, VuexOidcState, vuexOidcCreateStoreModule } from 'vuex-oidc'
import { WebStorageStateStore } from 'oidc-client'
import { RootState } from '../types'

const oidc = window.APP_CONFIG.oidc
const base = new URL(import.meta.env.BASE_URL || '/', window.location.toString())

const cookieStorage = new CookieStorage({
  path: base.pathname,
  domain: base.hostname,
  secure: base.protocol === 'https:',
  sameSite: 'Strict',
})

const oidcSettings = {
  redirectUri: new URL('oidc-callback', base).toString(),
  postLogoutRedirectUri: new URL('logout', base).toString(),
  responseType: 'code',
  automaticSilentRenew: true,
  stateStore: new WebStorageStateStore({ store: cookieStorage }),
  monitorSession: false,
  ...oidc,
} as VuexOidcClientSettings

export function auth (): Module<VuexOidcState, RootState> {
  return vuexOidcCreateStoreModule(oidcSettings, {
    namespaced: true,
    publicRoutePaths: ['/oidc-error', '/logout'],
    routeBase: import.meta.env.BASE_URL,
    dispatchEventsOnWindow: true,
  })
}

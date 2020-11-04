import { Module } from 'vuex'
import { VuexOidcClientSettings, VuexOidcState, vuexOidcCreateStoreModule } from 'vuex-oidc'
import { RootState } from '../types'

const oidc = window.APP_CONFIG.oidc
const base = new URL(process.env.BASE_URL || '/', window.location.toString())

const oidcSettings: VuexOidcClientSettings = {
  redirectUri: new URL('oidc-callback', base).toString(),
  postLogoutRedirectUri: new URL('logout', base).toString(),
  responseType: 'code',
  automaticSilentRenew: true,
  ...oidc,
}

export function auth (): Module<VuexOidcState, RootState> {
  return vuexOidcCreateStoreModule(oidcSettings, {
    namespaced: true,
    publicRoutePaths: ['/oidc-error', '/logout'],
    routeBase: process.env.BASE_URL,
  })
}

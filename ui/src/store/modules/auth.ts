import { Module } from 'vuex'
import { VuexOidcClientSettings, VuexOidcState, vuexOidcCreateStoreModule } from 'vuex-oidc'
import { RootState } from '../types'

const oidc = window.oidc
const baseUrl = window.BASE_URL || '/'

const oidcSettings: VuexOidcClientSettings = {
  redirectUri: window.location.origin + baseUrl + 'oidc-callback',
  responseType: 'code',
  ...oidc,
}

export function auth (): Module<VuexOidcState, RootState> {
  return vuexOidcCreateStoreModule(oidcSettings, {
    namespaced: true,
    publicRoutePaths: ['/oidc-error'],
    routeBase: baseUrl,
  })
}

import { Module } from 'vuex'
import { VuexOidcClientSettings, VuexOidcState, vuexOidcCreateStoreModule } from 'vuex-oidc'

const oidc = window.oidc

const oidcSettings: VuexOidcClientSettings = {
  redirectUri: window.location.origin + '/oidc-callback',
  responseType: 'code',
  ...oidc,
}

export function auth (): Module<VuexOidcState, any> {
  return vuexOidcCreateStoreModule(oidcSettings, {
    namespaced: true,
    publicRoutePaths: ['/oidc-error'],
  })
}

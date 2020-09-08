import { VuexOidcClientSettings, vuexOidcCreateStoreModule } from 'vuex-oidc'

const oidc = window.oidc

const oidcSettings: VuexOidcClientSettings = {
  redirectUri: window.location.origin + '/oidc-callback',
  responseType: 'code',
  ...oidc,
}

export const auth = () => vuexOidcCreateStoreModule(oidcSettings, {
  namespaced: true,
  publicRoutePaths: ['/oidc-error'],
})

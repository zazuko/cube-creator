// Keep this in sync with .env.local, ui/public/config.js.template and ui/public/index.html

type AppConfig = {
  oidc: {
    authority: string
    clientId: string
    scope: string
  }
  apiCoreBase: string
}

interface Window {
  APP_CONFIG: AppConfig
}

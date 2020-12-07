// Keep this in sync with .env.local, ui/public/config.js.template and ui/public/index.html

type AppConfig = {
  oidc: {
    authority: string
    clientId: string
    scope: string
  }
  apiCoreBase: string
  sentry?: {
    dsn: string
    environment: string
  }
}

interface Window {
  APP_CONFIG: AppConfig
}

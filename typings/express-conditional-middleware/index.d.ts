declare module 'express-conditional-middleware' {
  import type * as E from 'express'

  function conditional(
    condition: boolean | ((req: E.Request, res:E.Response, next: E.NextFunction) => boolean),
    onTrue: E.RequestHandler,
    onFalse?: E.RequestHandler
  ): E.Router

  export = conditional
}

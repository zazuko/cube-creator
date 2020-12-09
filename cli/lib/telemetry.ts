import * as Sentry from '@sentry/node'

export function capture<TRet, T>(name: string, data: (arg: T) => Record<string, any>, func: (arg: T) => Promise<TRet>): typeof func {
  return (arg: T) => {
    const transaction = Sentry.startTransaction({
      op: name,
      name,
      data: data(arg),
    })

    Sentry.configureScope(scope => scope.setSpan(transaction))
    return func(arg).finally(() => transaction.finish())
  }
}

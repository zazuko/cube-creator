declare module 'promise-the-world' {
  function defer(): {
    resolve(value?: any): void
    reject(error: Error): void
    promise: Promise<any>
  }

  const promiseTheWorld: {
    defer: typeof defer
  }

  export = promiseTheWorld
}

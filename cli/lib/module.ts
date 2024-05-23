interface DynamicImport {
  <T = any>(m: string): Promise<T>
}

// eslint-disable-next-line no-new-func
export const importDynamic: DynamicImport = new Function('modulePath', 'return import(modulePath)') as any

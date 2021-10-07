interface DynamicImport {
  (m: string): Promise<any>
}

// eslint-disable-next-line no-new-func
export const importDynamic: DynamicImport = new Function('modulePath', 'return import(modulePath)') as any

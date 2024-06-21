export interface RemoteData<T> {
  isLoading: boolean
  isLoaded: boolean
  data: T | null
  error: string | null
}

function loading<T> (): RemoteData<T> {
  return { isLoading: true, isLoaded: false, data: null, error: null }
}

function loaded<T> (data: T): RemoteData<T> {
  return { isLoading: false, isLoaded: true, data, error: null }
}

function notLoaded<T> (): RemoteData<T> {
  return { isLoading: false, isLoaded: false, data: null, error: 'Not loaded yet' }
}

function error<T> (error: string): RemoteData<T> {
  return { isLoading: false, isLoaded: true, data: null, error }
}

export default {
  error,
  loading,
  loaded,
  notLoaded,
}

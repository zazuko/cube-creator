
export interface RemoteData<T> {
  isLoading: boolean;
  data: T | null;
  error: string | null;
}

function loading<T> (): RemoteData<T> {
  return { isLoading: true, data: null, error: null }
}

function loaded<T> (data: T): RemoteData<T> {
  return { isLoading: false, data, error: null }
}

function error<T> (error: string): RemoteData<T> {
  return { isLoading: false, data: null, error }
}

export default {
  loading,
  loaded,
  error,
}

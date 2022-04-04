import { onBeforeUnmount, onMounted, ref, Ref } from 'vue'

export function usePolling (poll: (...args: any[]) => any, interval = 3000) {
  const poller: Ref<number | null> = ref(null)

  const stopPolling = () => {
    if (poller.value) {
      window.clearInterval(poller.value)
    }
  }

  const doPoll = async () => {
    try {
      await poll()
    } catch (e) {
      stopPolling()
      throw e
    }
  }

  const setupPolling = () => {
    poller.value = window.setInterval(doPoll, interval)
  }

  onMounted(setupPolling)
  onBeforeUnmount(stopPolling)

  return {
    poller
  }
}

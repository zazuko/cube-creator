import { useProgrammatic } from '@oruga-ui/oruga-next'
import { Message } from './store/modules/app'

export function displayToast (message: Message) {
  const { oruga } = useProgrammatic()

  oruga.notification.open({
    rootClass: 'toast-notification',
    position: 'top',
    duration: 2000,
    ...message,
  })
}

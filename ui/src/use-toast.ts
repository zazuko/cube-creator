import { Message } from './store/modules/app'

export function displayToast (component: any, message: Message) {
  component.$oruga.notification.open({
    rootClass: 'toast-notification',
    position: 'top',
    duration: 2000,
    ...message,
  })
}

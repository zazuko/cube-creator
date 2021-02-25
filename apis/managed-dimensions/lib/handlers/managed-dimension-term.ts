import asyncMiddleware from 'middleware-async'
import { updateTerm } from '../domain/managed-dimension-term'
import { store } from '../store'

export const put = asyncMiddleware(async (req, res) => {
  const pointer = await updateTerm({
    store: store(),
    term: await req.resource(),
  })

  return res.dataset(pointer.dataset)
})

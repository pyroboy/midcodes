import type { Handle } from '@sveltejs/kit'

const styleHandler: Handle = async ({ event, resolve }) => {
  return resolve(event)
}

export const handle = styleHandler
import { createProxy, ENV_VARS } from '../env.js'

export default createProxy<ENV_VARS>(process.env)

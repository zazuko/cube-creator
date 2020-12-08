declare module 'barnard59-graph-store' {

  interface GetCommand{
    endpoint: string
    graph: string
    user:string
    password: string
  }

  interface PostPutCommand{
    endpoint: string
    user:string
    password: string
    maxQuadsPerRequest?: number
  }

  export function get ({ endpoint, graph, user, password }: GetCommand): any
  export function post ({ endpoint, user, password, maxQuadsPerRequest }: PostPutCommand) : any
  export function put ({ endpoint, user, password, maxQuadsPerRequest }: PostPutCommand) : any
}

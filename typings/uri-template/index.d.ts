declare module 'uri-template' {
  export type StartRule =
    | 'uriTemplate'
    | 'expression'
    | 'op'
    | 'pathExpression'
    | 'paramList'
    | 'param'
    | 'cut'
    | 'listMarker'
    | 'substr'
    | 'nonexpression'
    | 'extension';

  interface TemplateExpressionParam {
    explode: string
    name: string
  }

  interface TemplateExpression {
    params: TemplateExpressionParam[]
  }

  export class Template {
    prefix: string
    expressions: TemplateExpression[]
  }

  export function parse(input: string, startRule?: StartRule): Template
}

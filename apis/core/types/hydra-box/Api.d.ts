declare module 'hydra-box/Api' {
    import { DatasetCore, NamedNode, Term } from 'rdf-js'

    namespace Api {
        interface Options {
            term?: Term;
            dataset?: DatasetCore;
            graph?: NamedNode;
            path: string;
            codePath: string;
        }
    }

    interface Api {
        initialized: boolean;
        path: string;
        codePath: string;
        graph: NamedNode;
        dataset: DatasetCore;
        term: Term;
        init(): void;
        fromFile(filePath: string, options?: Api.Options): Promise<this>;
        rebase(from: string, to: string): this;
    }

    class Api {
        public constructor(options?: Api.Options)
        public static fromFile (filePath: string, options?: Api.Options): Promise<Api>
    }

    export = Api
}

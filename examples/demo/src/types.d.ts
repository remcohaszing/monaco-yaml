declare module 'monaco-editor/esm/vs/base/common/cancellation' {
  export enum CancellationToken {
    None,
  }
}

declare module 'monaco-editor/esm/vs/editor/contrib/documentSymbols/documentSymbols' {
  import { ITextModel, languages } from 'monaco-editor';
  import { CancellationToken } from 'monaco-editor/esm/vs/base/common/cancellation';

  export function getDocumentSymbols(
    model: ITextModel,
    flat: boolean,
    token: CancellationToken,
  ): Promise<languages.DocumentSymbol[]>;
}

declare module 'monaco-editor/esm/vs/editor/editor.worker.js' {
  import { worker } from 'monaco-editor/esm/vs/editor/editor.api';

  export function initialize(
    fn: (ctx: worker.IWorkerContext, createData: unknown) => unknown,
  ): void;
}

declare module '*.json' {
  declare const uri: string;
  export default uri;
}

import { IEvent } from 'monaco-editor';
import { DiagnosticsOptions } from 'monaco-yaml';

export interface LanguageServiceDefaults {
  readonly onDidChange: IEvent<LanguageServiceDefaults>;
  readonly diagnosticsOptions: DiagnosticsOptions;
  setDiagnosticsOptions: (options: DiagnosticsOptions) => void;
}

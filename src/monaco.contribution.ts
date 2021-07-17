import { Emitter, IEvent, languages } from 'monaco-editor/esm/vs/editor/editor.api';

import { setupMode } from './yamlMode';

// --- YAML configuration and defaults ---------

export class LanguageServiceDefaultsImpl implements languages.yaml.LanguageServiceDefaults {
  private _onDidChange = new Emitter<languages.yaml.LanguageServiceDefaults>();
  private _diagnosticsOptions: languages.yaml.DiagnosticsOptions;
  private _languageId: string;

  constructor(languageId: string, diagnosticsOptions: languages.yaml.DiagnosticsOptions) {
    this._languageId = languageId;
    this.setDiagnosticsOptions(diagnosticsOptions);
  }

  get onDidChange(): IEvent<languages.yaml.LanguageServiceDefaults> {
    return this._onDidChange.event;
  }

  get languageId(): string {
    return this._languageId;
  }

  get diagnosticsOptions(): languages.yaml.DiagnosticsOptions {
    return this._diagnosticsOptions;
  }

  setDiagnosticsOptions(options: languages.yaml.DiagnosticsOptions): void {
    this._diagnosticsOptions = options || Object.create(null);
    this._onDidChange.fire(this);
  }
}

const diagnosticDefault: languages.yaml.DiagnosticsOptions = {
  validate: true,
  schemas: [],
  enableSchemaRequest: false,
};

const yamlDefaults = new LanguageServiceDefaultsImpl('yaml', diagnosticDefault);

// Export API
function createAPI(): typeof languages.yaml {
  return {
    yamlDefaults,
  };
}
languages.yaml = createAPI();

// --- Registration to monaco editor ---

languages.register({
  id: 'yaml',
  extensions: ['.yaml', '.yml'],
  aliases: ['YAML', 'yaml', 'YML', 'yml'],
  mimetypes: ['application/x-yaml'],
});

languages.onLanguage('yaml', () => {
  setupMode(yamlDefaults);
});

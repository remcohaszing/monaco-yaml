import { Emitter, languages } from 'monaco-editor/esm/vs/editor/editor.api';

import { languageId } from './constants';
import { setupMode } from './yamlMode';

// --- YAML configuration and defaults ---------

export function createLanguageServiceDefaults(
  initialDiagnosticsOptions: languages.yaml.DiagnosticsOptions,
): languages.yaml.LanguageServiceDefaults {
  const onDidChange = new Emitter<languages.yaml.LanguageServiceDefaults>();
  let diagnosticsOptions = initialDiagnosticsOptions;

  const languageServiceDefaults: languages.yaml.LanguageServiceDefaults = {
    get onDidChange() {
      return onDidChange.event;
    },

    get languageId() {
      return languageId;
    },

    get diagnosticsOptions() {
      return diagnosticsOptions;
    },

    setDiagnosticsOptions(options) {
      diagnosticsOptions = options || {};
      onDidChange.fire(languageServiceDefaults);
    },
  };

  return languageServiceDefaults;
}

const diagnosticDefault: languages.yaml.DiagnosticsOptions = {
  validate: true,
  schemas: [],
  enableSchemaRequest: false,
};

const yamlDefaults = createLanguageServiceDefaults(diagnosticDefault);

// Export API
function createAPI(): typeof languages.yaml {
  return {
    yamlDefaults,
  };
}
languages.yaml = createAPI();

// --- Registration to monaco editor ---

languages.register({
  id: languageId,
  extensions: ['.yaml', '.yml'],
  aliases: ['YAML', 'yaml', 'YML', 'yml'],
  mimetypes: ['application/x-yaml'],
});

languages.onLanguage('yaml', () => {
  setupMode(yamlDefaults);
});

/**
 * Configure `monaco-yaml` diagnostics options.
 *
 * @param options - The options to set.
 */
export function setDiagnosticsOptions(options: languages.yaml.DiagnosticsOptions = {}): void {
  languages.yaml.yamlDefaults.setDiagnosticsOptions(options);
}

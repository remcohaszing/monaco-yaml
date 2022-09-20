import { Emitter, languages } from 'monaco-editor/esm/vs/editor/editor.api.js';
import { DiagnosticsOptions, LanguageServiceDefaults } from 'monaco-yaml';

import { languageId } from './constants.js';
import { setupMode } from './yamlMode.js';

// --- YAML configuration and defaults ---------

const diagnosticDefault: DiagnosticsOptions = {
  completion: true,
  customTags: [],
  enableSchemaRequest: false,
  format: true,
  isKubernetes: false,
  hover: true,
  schemas: [],
  validate: true,
  yamlVersion: '1.2',
};

export function createLanguageServiceDefaults(
  initialDiagnosticsOptions: DiagnosticsOptions,
): LanguageServiceDefaults {
  const onDidChange = new Emitter<LanguageServiceDefaults>();
  let diagnosticsOptions = initialDiagnosticsOptions;

  const languageServiceDefaults: LanguageServiceDefaults = {
    get onDidChange() {
      return onDidChange.event;
    },

    get diagnosticsOptions() {
      return diagnosticsOptions;
    },

    setDiagnosticsOptions(options) {
      diagnosticsOptions = { ...diagnosticDefault, ...options };
      onDidChange.fire(languageServiceDefaults);
    },
  };

  return languageServiceDefaults;
}

export const yamlDefaults = createLanguageServiceDefaults(diagnosticDefault);

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
 * @param options The options to set.
 */
export function setDiagnosticsOptions(options: DiagnosticsOptions = {}): void {
  yamlDefaults.setDiagnosticsOptions(options);
}

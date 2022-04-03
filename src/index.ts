import { Emitter, languages } from 'monaco-editor/esm/vs/editor/editor.api.js';
import { DiagnosticsOptions } from 'monaco-yaml';

import { LanguageServiceDefaults } from './types';
import { setupMode } from './yamlMode';

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

const yamlDefaults = createLanguageServiceDefaults(diagnosticDefault);

languages.onLanguage('yaml', () => {
  setupMode(yamlDefaults);
});

/**
 * Configure `monaco-yaml` diagnostics options.
 *
 * @param options - The options to set.
 */
export function setDiagnosticsOptions(options: DiagnosticsOptions = {}): void {
  yamlDefaults.setDiagnosticsOptions(options);
}

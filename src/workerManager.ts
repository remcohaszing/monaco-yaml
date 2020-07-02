/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
'use strict';

import { LanguageServiceDefaultsImpl } from './monaco.contribution';
import { YAMLWorker } from './yamlWorker';

import IDisposable = monaco.IDisposable;
import Uri = monaco.Uri;

const STOP_WHEN_IDLE_FOR = 2 * 60 * 1000; // 2min

export class WorkerManager {
  private _defaults: LanguageServiceDefaultsImpl;
  private _idleCheckInterval: NodeJS.Timer;
  private _lastUsedTime: number;
  private _configChangeListener: IDisposable;

  private _worker: monaco.editor.MonacoWebWorker<YAMLWorker>;
  private _client: Promise<YAMLWorker>;

  constructor(defaults: LanguageServiceDefaultsImpl) {
    this._defaults = defaults;
    this._worker = null;
    this._idleCheckInterval = setInterval(() => this._checkIfIdle(), 30 * 1000);
    this._lastUsedTime = 0;
    this._configChangeListener = this._defaults.onDidChange(() =>
      this._stopWorker()
    );
  }

  public dispose(): void {
    clearInterval(this._idleCheckInterval);
    this._configChangeListener.dispose();
    this._stopWorker();
  }

  public getLanguageServiceWorker(...resources: Uri[]): Promise<YAMLWorker> {
    let _client: YAMLWorker;
    return this._getClient()
      .then(client => {
        _client = client;
      })
      .then(_ => {
        return this._worker.withSyncedResources(resources);
      })
      .then(_ => _client);
  }

  private _stopWorker(): void {
    if (this._worker) {
      this._worker.dispose();
      this._worker = null;
    }
    this._client = null;
  }

  private _checkIfIdle(): void {
    if (!this._worker) {
      return;
    }
    const timePassedSinceLastUsed = Date.now() - this._lastUsedTime;
    if (timePassedSinceLastUsed > STOP_WHEN_IDLE_FOR) {
      this._stopWorker();
    }
  }

  private _getClient(): Promise<YAMLWorker> {
    this._lastUsedTime = Date.now();

    if (!this._client) {
      this._worker = monaco.editor.createWebWorker<YAMLWorker>({
        // module that exports the create() method and returns a `YAMLWorker` instance
        moduleId: 'vs/language/yaml/yamlWorker',

        label: this._defaults.languageId,

        // passed in to the create() method
        createData: {
          languageSettings: this._defaults.diagnosticsOptions,
          languageId: this._defaults.languageId,
          enableSchemaRequest: this._defaults.diagnosticsOptions
            .enableSchemaRequest,
          prefix: this._defaults.diagnosticsOptions.prefix,
          isKubernetes: this._defaults.diagnosticsOptions.isKubernetes,
        },
      });

      this._client = this._worker.getProxy();
    }

    return this._client;
  }
}

import * as monaco from 'monaco-editor'
import { afterEach } from 'vitest'

window.MonacoEnvironment = {
  getWorker(workerId, label) {
    switch (label) {
      case 'editorWorkerService':
        return new Worker(
          new URL('monaco-editor/esm/vs/editor/editor.worker.js', import.meta.url),
          { type: 'module' }
        )
      case 'yaml':
        return new Worker(new URL('monaco-yaml/yaml.worker.js', import.meta.url), {
          type: 'module'
        })
      default:
        throw new Error(`Unknown label ${label}`)
    }
  }
}

afterEach(() => {
  for (const editor of monaco.editor.getEditors()) {
    editor.dispose()
  }

  for (const model of monaco.editor.getModels()) {
    model.dispose()
  }
})

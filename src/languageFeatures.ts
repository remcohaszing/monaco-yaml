import {
  editor,
  IDisposable,
  languages,
  MarkerSeverity,
  Position,
  Range,
  Uri,
} from 'monaco-editor/esm/vs/editor/editor.api.js';
import * as ls from 'vscode-languageserver-types';
import { CustomFormatterOptions } from 'yaml-language-server/lib/esm/languageservice/yamlLanguageService.js';

import { languageId } from './constants';
import { YAMLWorker } from './yamlWorker';

export type WorkerAccessor = (...more: Uri[]) => PromiseLike<YAMLWorker>;

// --- diagnostics --- ---

function toSeverity(lsSeverity: ls.DiagnosticSeverity): MarkerSeverity {
  switch (lsSeverity) {
    case ls.DiagnosticSeverity.Error:
      return MarkerSeverity.Error;
    case ls.DiagnosticSeverity.Warning:
      return MarkerSeverity.Warning;
    case ls.DiagnosticSeverity.Information:
      return MarkerSeverity.Info;
    case ls.DiagnosticSeverity.Hint:
      return MarkerSeverity.Hint;
    default:
      return MarkerSeverity.Info;
  }
}

function toDiagnostics(diag: ls.Diagnostic): editor.IMarkerData {
  return {
    severity: toSeverity(diag.severity),
    startLineNumber: diag.range.start.line + 1,
    startColumn: diag.range.start.character + 1,
    endLineNumber: diag.range.end.line + 1,
    endColumn: diag.range.end.character + 1,
    message: diag.message,
    code: String(diag.code),
    source: diag.source,
  };
}

export function createDiagnosticsAdapter(
  getWorker: WorkerAccessor,
  defaults: languages.yaml.LanguageServiceDefaults,
): void {
  const listeners = new Map<string, IDisposable>();

  const resetSchema = async (resource: Uri): Promise<void> => {
    const worker = await getWorker();
    worker.resetSchema(String(resource));
  };

  const doValidate = async (resource: Uri): Promise<void> => {
    const worker = await getWorker(resource);
    const diagnostics = await worker.doValidation(String(resource));
    const markers = diagnostics.map(toDiagnostics);
    const model = editor.getModel(resource);
    // Return value from getModel can be null if model not found
    // (e.g. if user navigates away from editor)
    if (model && model.getLanguageId() === languageId) {
      editor.setModelMarkers(model, languageId, markers);
    }
  };

  const onModelAdd = (model: editor.IModel): void => {
    if (model.getLanguageId() !== languageId) {
      return;
    }

    let handle: ReturnType<typeof setTimeout>;
    listeners.set(
      String(model.uri),
      model.onDidChangeContent(() => {
        clearTimeout(handle);
        handle = setTimeout(() => doValidate(model.uri), 500);
      }),
    );

    doValidate(model.uri);
  };

  const onModelRemoved = (model: editor.IModel): void => {
    editor.setModelMarkers(model, languageId, []);
    const uriStr = String(model.uri);
    const listener = listeners.get(uriStr);
    if (listener) {
      listener.dispose();
      listeners.delete(uriStr);
    }
  };

  editor.onDidCreateModel(onModelAdd);
  editor.onWillDisposeModel((model) => {
    onModelRemoved(model);
    resetSchema(model.uri);
  });
  editor.onDidChangeModelLanguage((event) => {
    onModelRemoved(event.model);
    onModelAdd(event.model);
    resetSchema(event.model.uri);
  });
  defaults.onDidChange(() => {
    for (const model of editor.getModels()) {
      if (model.getLanguageId() === languageId) {
        onModelRemoved(model);
        onModelAdd(model);
      }
    }
  });

  for (const model of editor.getModels()) {
    onModelAdd(model);
  }
}

// --- completion ------

function fromPosition(position: Position): ls.Position {
  if (!position) {
    return;
  }
  return { character: position.column - 1, line: position.lineNumber - 1 };
}

function toRange(range: ls.Range): Range {
  if (!range) {
    return;
  }
  return new Range(
    range.start.line + 1,
    range.start.character + 1,
    range.end.line + 1,
    range.end.character + 1,
  );
}

function toCompletionItemKind(kind: ls.CompletionItemKind): languages.CompletionItemKind {
  const mItemKind = languages.CompletionItemKind;

  switch (kind) {
    case ls.CompletionItemKind.Text:
      return mItemKind.Text;
    case ls.CompletionItemKind.Method:
      return mItemKind.Method;
    case ls.CompletionItemKind.Function:
      return mItemKind.Function;
    case ls.CompletionItemKind.Constructor:
      return mItemKind.Constructor;
    case ls.CompletionItemKind.Field:
      return mItemKind.Field;
    case ls.CompletionItemKind.Variable:
      return mItemKind.Variable;
    case ls.CompletionItemKind.Class:
      return mItemKind.Class;
    case ls.CompletionItemKind.Interface:
      return mItemKind.Interface;
    case ls.CompletionItemKind.Module:
      return mItemKind.Module;
    case ls.CompletionItemKind.Property:
      return mItemKind.Property;
    case ls.CompletionItemKind.Unit:
      return mItemKind.Unit;
    case ls.CompletionItemKind.Value:
      return mItemKind.Value;
    case ls.CompletionItemKind.Enum:
      return mItemKind.Enum;
    case ls.CompletionItemKind.Keyword:
      return mItemKind.Keyword;
    case ls.CompletionItemKind.Snippet:
      return mItemKind.Snippet;
    case ls.CompletionItemKind.Color:
      return mItemKind.Color;
    case ls.CompletionItemKind.File:
      return mItemKind.File;
    case ls.CompletionItemKind.Reference:
      return mItemKind.Reference;
    default:
      return mItemKind.Property;
  }
}

function toTextEdit(textEdit: ls.TextEdit): editor.ISingleEditOperation {
  if (!textEdit) {
    return;
  }
  return {
    range: toRange(textEdit.range),
    text: textEdit.newText,
  };
}

export function createCompletionItemProvider(
  getWorker: WorkerAccessor,
): languages.CompletionItemProvider {
  return {
    triggerCharacters: [' ', ':'],

    async provideCompletionItems(model, position) {
      const resource = model.uri;

      const worker = await getWorker(resource);
      const info = await worker.doComplete(String(resource), fromPosition(position));
      if (!info) {
        return;
      }

      const wordInfo = model.getWordUntilPosition(position);
      const wordRange = new Range(
        position.lineNumber,
        wordInfo.startColumn,
        position.lineNumber,
        wordInfo.endColumn,
      );

      const items = info.items.map((entry) => {
        const item: languages.CompletionItem = {
          label: entry.label,
          insertText: entry.insertText || entry.label,
          sortText: entry.sortText,
          filterText: entry.filterText,
          documentation: entry.documentation,
          detail: entry.detail,
          kind: toCompletionItemKind(entry.kind),
          range: wordRange,
        };
        if (entry.textEdit) {
          item.range = toRange(
            'range' in entry.textEdit ? entry.textEdit.range : entry.textEdit.replace,
          );
          item.insertText = entry.textEdit.newText;
        }
        if (entry.additionalTextEdits) {
          item.additionalTextEdits = entry.additionalTextEdits.map(toTextEdit);
        }
        if (entry.insertTextFormat === ls.InsertTextFormat.Snippet) {
          item.insertTextRules = languages.CompletionItemInsertTextRule.InsertAsSnippet;
        }
        return item;
      });

      return {
        incomplete: info.isIncomplete,
        suggestions: items,
      };
    },
  };
}

// --- definition ------

export function createDefinitionProvider(getWorker: WorkerAccessor): languages.DefinitionProvider {
  return {
    async provideDefinition(model, position) {
      const resource = model.uri;

      const worker = await getWorker(resource);
      const definitions = await worker.doDefinition(String(resource), fromPosition(position));

      return definitions?.map((definition) => ({
        originSelectionRange: definition.originSelectionRange,
        range: toRange(definition.targetRange),
        targetSelectionRange: definition.targetSelectionRange,
        uri: Uri.parse(definition.targetUri),
      }));
    },
  };
}

// --- hover ------

export function createHoverProvider(getWorker: WorkerAccessor): languages.HoverProvider {
  return {
    async provideHover(model, position) {
      const resource = model.uri;

      const worker = await getWorker(resource);
      const info = await worker.doHover(String(resource), fromPosition(position));
      if (!info) {
        return;
      }
      return {
        range: toRange(info.range),
        contents: [{ value: (info.contents as ls.MarkupContent).value }],
      };
    },
  };
}

// --- document symbols ------

function toSymbolKind(kind: ls.SymbolKind): languages.SymbolKind {
  const mKind = languages.SymbolKind;

  switch (kind) {
    case ls.SymbolKind.File:
      return mKind.Array;
    case ls.SymbolKind.Module:
      return mKind.Module;
    case ls.SymbolKind.Namespace:
      return mKind.Namespace;
    case ls.SymbolKind.Package:
      return mKind.Package;
    case ls.SymbolKind.Class:
      return mKind.Class;
    case ls.SymbolKind.Method:
      return mKind.Method;
    case ls.SymbolKind.Property:
      return mKind.Property;
    case ls.SymbolKind.Field:
      return mKind.Field;
    case ls.SymbolKind.Constructor:
      return mKind.Constructor;
    case ls.SymbolKind.Enum:
      return mKind.Enum;
    case ls.SymbolKind.Interface:
      return mKind.Interface;
    case ls.SymbolKind.Function:
      return mKind.Function;
    case ls.SymbolKind.Variable:
      return mKind.Variable;
    case ls.SymbolKind.Constant:
      return mKind.Constant;
    case ls.SymbolKind.String:
      return mKind.String;
    case ls.SymbolKind.Number:
      return mKind.Number;
    case ls.SymbolKind.Boolean:
      return mKind.Boolean;
    case ls.SymbolKind.Array:
      return mKind.Array;
    default:
      return mKind.Function;
  }
}

function toDocumentSymbol(item: ls.DocumentSymbol): languages.DocumentSymbol {
  return {
    detail: item.detail || '',
    range: toRange(item.range),
    name: item.name,
    kind: toSymbolKind(item.kind),
    selectionRange: toRange(item.selectionRange),
    children: item.children.map(toDocumentSymbol),
    tags: [],
  };
}

export function createDocumentSymbolProvider(
  getWorker: WorkerAccessor,
): languages.DocumentSymbolProvider {
  return {
    async provideDocumentSymbols(model) {
      const resource = model.uri;

      const worker = await getWorker(resource);
      const items = await worker.findDocumentSymbols(String(resource));
      if (!items) {
        return;
      }
      return items.map(toDocumentSymbol);
    },
  };
}

function fromFormattingOptions(
  options: languages.FormattingOptions,
): CustomFormatterOptions & ls.FormattingOptions {
  return {
    tabSize: options.tabSize,
    insertSpaces: options.insertSpaces,
    ...options,
  };
}

export function createDocumentFormattingEditProvider(
  getWorker: WorkerAccessor,
): languages.DocumentFormattingEditProvider {
  return {
    async provideDocumentFormattingEdits(model, options) {
      const resource = model.uri;

      const worker = await getWorker(resource);
      const edits = await worker.format(String(resource), fromFormattingOptions(options));
      if (!edits || edits.length === 0) {
        return;
      }
      return edits.map(toTextEdit);
    },
  };
}

function toLink(link: ls.DocumentLink): languages.ILink {
  return {
    range: toRange(link.range),
    tooltip: link.tooltip,
    url: link.target,
  };
}

export function createLinkProvider(getWorker: WorkerAccessor): languages.LinkProvider {
  return {
    async provideLinks(model) {
      const resource = model.uri;

      const worker = await getWorker(resource);
      const links = await worker.findLinks(String(resource));

      return {
        links: links.map(toLink),
      };
    },
  };
}

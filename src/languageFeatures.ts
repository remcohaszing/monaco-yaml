import {
  editor,
  IRange,
  languages,
  MarkerSeverity,
  MarkerTag,
  Position,
  Range,
  Uri,
} from 'monaco-editor/esm/vs/editor/editor.api.js';
import { MarkerDataProvider } from 'monaco-marker-data-provider';
import { WorkerGetter } from 'monaco-worker-manager';
import * as ls from 'vscode-languageserver-types';

import { languageId } from './constants.js';
import { YAMLWorker } from './yaml.worker.js';

export type WorkerAccessor = WorkerGetter<YAMLWorker>;

// --- diagnostics --- ---

function toSeverity(lsSeverity: ls.DiagnosticSeverity | undefined): MarkerSeverity {
  switch (lsSeverity) {
    case ls.DiagnosticSeverity.Error:
      return MarkerSeverity.Error;
    case ls.DiagnosticSeverity.Warning:
      return MarkerSeverity.Warning;
    case ls.DiagnosticSeverity.Hint:
      return MarkerSeverity.Hint;
    default:
      return MarkerSeverity.Info;
  }
}

function toMarkerDataTag(tag: ls.DiagnosticTag): MarkerTag {
  return tag === ls.DiagnosticTag.Deprecated ? MarkerTag.Deprecated : MarkerTag.Unnecessary;
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
    tags: diag.tags?.map(toMarkerDataTag),
  };
}

export function createMarkerDataProvider(getWorker: WorkerAccessor): MarkerDataProvider {
  return {
    owner: languageId,
    async provideMarkerData(model) {
      const worker = await getWorker(model.uri);
      const diagnostics = await worker.doValidation(String(model.uri));

      return diagnostics?.map(toDiagnostics);
    },

    async doReset(model) {
      const worker = await getWorker(model.uri);
      await worker.resetSchema(String(model.uri));
    },
  };
}

// --- completion ------

function fromPosition(position: Position): ls.Position {
  return { character: position.column - 1, line: position.lineNumber - 1 };
}

function toRange(range: ls.Range): Range {
  return new Range(
    range.start.line + 1,
    range.start.character + 1,
    range.end.line + 1,
    range.end.character + 1,
  );
}

function fromRange(range: IRange): ls.Range {
  return {
    start: { line: range.startLineNumber - 1, character: range.startColumn - 1 },
    end: { line: range.endLineNumber - 1, character: range.endColumn - 1 },
  };
}

function fromMarkerData(marker: editor.IMarkerData): ls.Diagnostic {
  return {
    message: marker.message,
    range: fromRange(marker),
    code: typeof marker.code === 'object' ? marker.code.value : marker.code,
    source: marker.source,
  };
}

function toCompletionItemKind(
  kind: ls.CompletionItemKind | undefined,
): languages.CompletionItemKind {
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

function toTextEdit(textEdit: ls.TextEdit): languages.TextEdit {
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
          insertText: entry.insertText ?? entry.label,
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

function toLocationLink(locationLink: ls.LocationLink): languages.LocationLink {
  return {
    originSelectionRange:
      locationLink.originSelectionRange && toRange(locationLink.originSelectionRange),
    range: toRange(locationLink.targetRange),
    targetSelectionRange: toRange(locationLink.targetSelectionRange),
    uri: Uri.parse(locationLink.targetUri),
  };
}

export function createDefinitionProvider(getWorker: WorkerAccessor): languages.DefinitionProvider {
  return {
    async provideDefinition(model, position) {
      const resource = model.uri;

      const worker = await getWorker(resource);
      const definitions = await worker.doDefinition(String(resource), fromPosition(position));

      return definitions?.map(toLocationLink);
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
        range: info.range && toRange(info.range),
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
    detail: item.detail ?? '',
    range: toRange(item.range),
    name: item.name,
    kind: toSymbolKind(item.kind),
    selectionRange: toRange(item.selectionRange),
    children: item.children?.map(toDocumentSymbol),
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

export function createDocumentFormattingEditProvider(
  getWorker: WorkerAccessor,
): languages.DocumentFormattingEditProvider {
  return {
    async provideDocumentFormattingEdits(model) {
      const resource = model.uri;

      const worker = await getWorker(resource);
      const edits = await worker.format(String(resource), {});
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

      if (!links) {
        return;
      }

      return {
        links: links.map(toLink),
      };
    },
  };
}

function toWorkspaceEdit(edit: ls.WorkspaceEdit): languages.WorkspaceEdit {
  const edits: languages.IWorkspaceTextEdit[] = [];

  if (edit.changes) {
    for (const [uri, textEdits] of Object.entries(edit.changes)) {
      for (const textEdit of textEdits) {
        const monacoEdit: languages.TextEdit = {
          text: textEdit.newText,
          range: toRange(textEdit.range),
        };
        edits.push({
          resource: Uri.parse(uri),
          versionId: undefined,
          textEdit: monacoEdit,
          // @ts-expect-error This is for compatibility with monaco-editor<0.34
          edit: monacoEdit,
        });
      }
    }
  }

  return {
    edits,
  };
}

function toCodeAction(codeAction: ls.CodeAction): languages.CodeAction {
  return {
    title: codeAction.title,
    diagnostics: codeAction.diagnostics?.map(toDiagnostics),
    disabled: codeAction.disabled?.reason,
    edit: codeAction.edit ? toWorkspaceEdit(codeAction.edit) : undefined,
    kind: codeAction.kind,
    isPreferred: codeAction.isPreferred,
  };
}

export function createCodeActionProvider(getWorker: WorkerAccessor): languages.CodeActionProvider {
  return {
    async provideCodeActions(model, range, context) {
      const resource = model.uri;

      const worker = await getWorker(resource);
      const codeActions = await worker.getCodeAction(
        String(resource),
        fromRange(range),
        context.markers.map(fromMarkerData),
      );

      if (!codeActions) {
        return;
      }

      return {
        actions: codeActions.map(toCodeAction),
        dispose() {
          // This is required by the TypeScript interface, but it’s not implemented.
        },
      };
    },
  };
}

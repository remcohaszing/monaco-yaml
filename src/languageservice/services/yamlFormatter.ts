/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Red Hat, Inc. All rights reserved.
 *  Copyright (c) Adam Voss. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
'use strict';

import * as jsyaml from 'js-yaml';
import {
  FormattingOptions,
  Position,
  Range,
  TextDocument,
  TextEdit,
} from 'vscode-languageserver-types';
import { EOL } from '../../fillers/os';
import * as Yaml from '../../yaml-ast-parser/index';
import { LanguageSettings } from '../yamlLanguageService';

export class YamlFormatter {
  private customTags: string[];

  configure(settings: LanguageSettings) {
    if (settings) {
      this.customTags = settings.customTags || [];
    }
  }

  doFormat(
    document: TextDocument,
    options: FormattingOptions,
  ): TextEdit[] {
    const text = document.getText();
    const customTags = this.customTags || [];

    const schemaWithAdditionalTags = jsyaml.Schema.create(
      customTags.map(tag => {
        const typeInfo = tag.split(' ');
        return new jsyaml.Type(typeInfo[0], { kind: typeInfo[1] || 'scalar' });
      })
    );

    // We need compiledTypeMap to be available from schemaWithAdditionalTags before we add the new custom properties
    customTags.map(tag => {
      const typeInfo = tag.split(' ');
      schemaWithAdditionalTags.compiledTypeMap[typeInfo[0]] = new jsyaml.Type(
        typeInfo[0],
        { kind: typeInfo[1] || 'scalar' }
      );
    });

    const additionalOptions: Yaml.LoadOptions = {
      schema: schemaWithAdditionalTags,
    };

    const documents = [];
    jsyaml.loadAll(text, doc => documents.push(doc), additionalOptions);

    const dumpOptions = { indent: options.tabSize, noCompatMode: true };

    let newText;
    if (documents.length == 1) {
      const yaml = documents[0];
      newText = jsyaml.safeDump(yaml, dumpOptions);
    } else {
      const formatted = documents.map(d => jsyaml.safeDump(d, dumpOptions));
      newText =
        '%YAML 1.2' +
        EOL +
        '---' +
        EOL +
        formatted.join('...' + EOL + '---' + EOL) +
        '...' +
        EOL;
    }

    return [
      TextEdit.replace(
        Range.create(Position.create(0, 0), document.positionAt(text.length)),
        newText
      ),
    ];
  }
}

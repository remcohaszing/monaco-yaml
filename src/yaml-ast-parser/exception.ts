'use strict';

import Mark from './mark';

export default class YAMLException {
  public static isInstance(instance: any): instance is YAMLException {
    if (
      instance != null &&
      instance.getClassIdentifier &&
      typeof instance.getClassIdentifier == 'function'
    ) {
      for (const currentIdentifier of instance.getClassIdentifier()) {
        if (currentIdentifier == YAMLException.CLASS_IDENTIFIER) {
          return true;
        }
      }
    }

    return false;
  }

  private static CLASS_IDENTIFIER = 'yaml-ast-parser.YAMLException';
  public message: string;
  public reason: string;
  public name: string;
  public mark: Mark;
  public isWarning: boolean;

  constructor(reason: string, mark: Mark = null, isWarning = false) {
    this.name = 'YAMLException';
    this.reason = reason;
    this.mark = mark;
    this.message = this.toString(false);
    this.isWarning = isWarning;
  }

  public getClassIdentifier(): string[] {
    const superIdentifiers = [];

    return superIdentifiers.concat(YAMLException.CLASS_IDENTIFIER);
  }

  public toString(compact: boolean = false) {
    let result;

    result = 'JS-YAML: ' + (this.reason || '(unknown reason)');

    if (!compact && this.mark) {
      result += ' ' + this.mark.toString();
    }

    return result;
  }
}

import { SingleYAMLDocument, YAMLDocument } from '../yamlLanguageTypes';

/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Red Hat, Inc. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
export function removeDuplicates(arr, prop) {
  var new_arr = [];
  var lookup = {};

  for (var i in arr) {
    lookup[arr[i][prop]] = arr[i];
  }

  for (i in lookup) {
    new_arr.push(lookup[i]);
  }

  return new_arr;
}

export function getLineOffsets(textDocString: String): number[] {

  let lineOffsets: number[] = [];
  let text = textDocString;
  let isLineStart = true;
  for (let i = 0; i < text.length; i++) {
    if (isLineStart) {
      lineOffsets.push(i);
      isLineStart = false;
    }
    let ch = text.charAt(i);
    isLineStart = (ch === '\r' || ch === '\n');
    if (ch === '\r' && i + 1 < text.length && text.charAt(i + 1) === '\n') {
      i++;
    }
  }
  if (isLineStart && text.length > 0) {
    lineOffsets.push(text.length);
  }

  return lineOffsets;
}

export function removeDuplicatesObj(objArray) {

  let nonDuplicateSet = new Set();
  let nonDuplicateArr = [];
  for (let obj in objArray) {

    let currObj = objArray[obj];
    let stringifiedObj = JSON.stringify(currObj);
    if (!nonDuplicateSet.has(stringifiedObj)) {
      nonDuplicateArr.push(currObj);
      nonDuplicateSet.add(stringifiedObj);
    }

  }

  return nonDuplicateArr;

}

export function matchOffsetToDocument(offset: number, doc: YAMLDocument): SingleYAMLDocument {
  for (let currDoc of doc.documents) {
    if (currDoc.root && (currDoc.root.length + currDoc.root.offset) >= offset && currDoc.root.offset <= offset) {
      return currDoc;
    }
  }
  return null;
}

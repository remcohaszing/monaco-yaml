import { expect } from '@playwright/test'
import { test } from 'playwright-monaco'

test('schema validation', async ({ editor }) => {
  await editor.createModel('p1: \np2: \n', 'file:///example.yaml', true)
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  const markers = await editor.waitForMarkers('file:///example.yaml', async () => {})
  expect(markers).toStrictEqual([
    {
      code: '0',
      endColumn: 5,
      endLineNumber: 1,
      message: 'Incorrect type. Expected "number".',
      owner: 'yaml',
      resource: 'file:///example.yaml',
      severity: 4,
      source: 'yaml-schema: http://schemas/my-schema.json',
      startColumn: 5,
      startLineNumber: 1,
      tags: undefined
    },
    {
      code: '0',
      endColumn: 5,
      endLineNumber: 2,
      message: 'Incorrect type. Expected "boolean".',
      owner: 'yaml',
      resource: 'file:///example.yaml',
      severity: 4,
      source: 'yaml-schema: http://schemas/my-schema.json',
      startColumn: 5,
      startLineNumber: 2,
      tags: undefined
    }
  ])
})

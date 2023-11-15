import path from 'node:path';
import fs from 'node:fs';

import { vi, describe, test, expect } from 'vitest';

import yamlToGfmTable from '../src/index.js';

import { remark } from 'remark';
import remarkGfm from 'remark-gfm'
import remarkDirective from 'remark-directive'
import { VFile } from 'vfile';

const vfile = (value) =>
  new VFile({
    value,
    path: path.resolve('./test.md'),
  });

const input = (q) => `
::table{path=./__fixtures__/blah.yml}
`;

test('Basic file import', () => {
  expect(
    remark()
      .use(remarkGfm)
      .use(remarkDirective)
      .use(yamlToGfmTable, {})
      .processSync(vfile(input('')))
      .toString().trim()
  ).toMatchInlineSnapshot(`
    "| col1  | col2 | col3 |
    | ----- | ---- | ---- |
    | this  | is   | text |
    | mdast | hast | ohmy |"
  `);
});

/*
test('File import using line numbers', () => {
  expect(
    remark()
      .use(codeImport, {})
      .processSync(vfile(input('#L2-L3')))
      .toString()
  ).toMatchInlineSnapshot(`
    "\`\`\`js file=./__fixtures__/say-#-hi.js#L2-L3
    console.log('This is another line...');
    console.log('This is the last line');
    \`\`\`
    "
  `);
});

test('File import using single line number', () => {
  expect(
    remark()
      .use(codeImport, {})
      .processSync(vfile(input('#L1')))
      .toString()
  ).toMatchInlineSnapshot(`
    "\`\`\`js file=./__fixtures__/say-#-hi.js#L1
    console.log('Hello remark-code-import!');
    \`\`\`
    "
  `);
});

test("Only following lines (e.g. #-L10) doesn't work", () => {
  expect(() => {
    remark()
      .use(codeImport, {})
      .processSync(vfile(input('#-L2')))
      .toString();
  }).toThrow();
});

test('File import using single line number and following lines', () => {
  expect(
    remark()
      .use(codeImport, {})
      .processSync(vfile(input('#L2-')))
      .toString()
  ).toMatchInlineSnapshot(`
    "\`\`\`js file=./__fixtures__/say-#-hi.js#L2-
    console.log('This is another line...');
    console.log('This is the last line');
    console.log('Oops, here is another');
    \`\`\`
    "
  `);
});

test('Preserve trailing newline and indentation', () => {
  expect(
    remark()
      .use(codeImport, { preserveTrailingNewline: true })
      .processSync(vfile(input('')))
      .toString()
  ).toMatchInlineSnapshot(`
    "\`\`\`js file=./__fixtures__/say-#-hi.js
    console.log('Hello remark-code-import!');
    console.log('This is another line...');
    console.log('This is the last line');
    console.log('Oops, here is another');

    \`\`\`
    "
  `);

  expect(
    remark()
      .use(codeImport, {})
      .processSync(
        vfile(`
\`\`\`js file=./__fixtures__/indentation.js#L2-L3
\`\`\`
`)
      )
      .toString()
  ).toMatchInlineSnapshot(`
    "\`\`\`js file=./__fixtures__/indentation.js#L2-L3
      console.log('indentation');
    	return 'indentation';
    \`\`\`
    "
  `);
});

test('Remove redundant indentations', () => {
  expect(
    remark()
      .use(codeImport, { removeRedundantIndentations: true })
      .processSync(
        vfile(`
\`\`\`js file=./__fixtures__/indentation.js#L7-L10
\`\`\`
`)
      )
      .toString()
  ).toMatchInlineSnapshot(`
    "\`\`\`js file=./__fixtures__/indentation.js#L7-L10
    if (true) {
      while (false)
        console.log('nested');
    }
    \`\`\`
    "
  `);
});

test('Allow escaped spaces in paths', () => {
  expect(
    remark()
      .use(codeImport)
      .processSync(
        vfile(`
\`\`\`js file=./__fixtures__/filename\\ with\\ spaces.js
\`\`\`
`)
      )
      .toString()
  ).toMatchInlineSnapshot(`
    "\`\`\`js file=./__fixtures__/filename\\\\ with\\\\ spaces.js
    console.log('filename with spaces');
    \`\`\`
    "
  `);
});

describe('options.rootDir', () => {
  test('Defaults to process.cwd()', () => {
    expect(
      remark()
        .use(codeImport)
        .processSync(
          vfile(`
\`\`\`js file=<rootDir>/__fixtures__/say-#-hi.js#L1
\`\`\`
  `)
        )
        .toString()
    ).toMatchInlineSnapshot(`
      "\`\`\`js file=<rootDir>/__fixtures__/say-#-hi.js#L1
      console.log('Hello remark-code-import!');
      \`\`\`
      "
    `);
  });

  test('Passing custom rootDir', () => {
    expect(
      remark()
        .use(codeImport, { rootDir: path.resolve('__fixtures__') })
        .processSync(
          vfile(`
\`\`\`js file=<rootDir>/say-#-hi.js#L1
\`\`\`
  `)
        )
        .toString()
    ).toMatchInlineSnapshot(`
      "\`\`\`js file=<rootDir>/say-#-hi.js#L1
      console.log('Hello remark-code-import!');
      \`\`\`
      "
    `);
  });

  test('Throw when passing non-absolute path', () => {
    expect(() => {
      remark()
        .use(codeImport, { rootDir: '__fixtures__' })
        .processSync(
          vfile(`
\`\`\`js file=<rootDir>/say-#-hi.js#L1
\`\`\`
  `)
        )
        .toString();
    }).toThrow();
  });
});

describe('options.allowImportingFromOutside', () => {
  test('defaults to throw when importing from outside', () => {
    expect(() => {
      remark()
        .use(codeImport)
        .processSync(
          vfile(`
\`\`\`js file=../some-file
\`\`\`
  `)
        )
        .toString();
    }).toThrow();
  });

  test('Allow if the option is specified', () => {
    const mocked = vi
      .spyOn(fs, 'readFileSync')
      .mockImplementationOnce(() => `Some file`);

    expect(
      remark()
        .use(codeImport, { allowImportingFromOutside: true })
        .processSync(
          vfile(`
\`\`\`js file=../some-file
\`\`\`
  `)
        )
        .toString()
    ).toMatchInlineSnapshot(`
      "\`\`\`js file=../some-file
      Some file
      \`\`\`
      "
    `);

    mocked.mockRestore();
  });
});
*/

import path from 'node:path';
import fs from 'node:fs';

import { vi, describe, test, expect } from 'vitest';

import yamlToGfmTable from '../src/index.js';

import { remark } from 'remark';
import remarkGfm from 'remark-gfm'
import remarkDirective from 'remark-directive'
import remarkRehype from 'remark-rehype'
import rehypeStringify from 'rehype-stringify'
import { VFile } from 'vfile';

const vfile = (value, filePath = path.resolve('./test.md')) =>
  new VFile({
    value,
    path: filePath
  });

const input = (q) => `
::table{file=./__fixtures__/test.yml}
`;

test('Basic file import', () => {
  expect(
    remark()
      .use(remarkGfm)
      .use(remarkDirective)
      .use(yamlToGfmTable, {})
      .use(remarkRehype)
      .use(rehypeStringify)
      .processSync(vfile(input('')))
      .toString().trim()
  ).toMatchInlineSnapshot(`
    "<table>
    <thead>
    <tr>
    <th><p>first column</p></th>
    <th><p>second column</p></th>
    <th><p>third column</p></th>
    </tr>
    </thead>
    <tbody>
    <tr>
    <td><h2>H2 header</h2></td>
    <td><p><strong>bold</strong></p></td>
    <td><p>multiple
    lines</p></td>
    </tr>
    <tr>
    <td><p><code>quoted code font</code></p></td>
    <td><p><em>italics</em></p></td>
    <td><p><a href=\\"file.md\\">random link</a></p></td>
    </tr>
    </tbody>
    </table>"
  `);
});

// toThrow() does not catch in this approach
/*
test('Error on invalid YAML', () => {
  expect(
    remark()
    .use(remarkGfm)
    .use(remarkDirective)
    .use(yamlToGfmTable, {})
      .processSync(
        vfile(`
::table{file=./__fixtures__/invalid.yml}
`)).toString()
  ).toThrow();
});
*/

// A directive cannot have any spaces. If any exist,
// the directive remark plugin parses the directive as Markdown
// instead of a directive.
/*
test('Allow escaped spaces in paths', () => {
  expect(
    remark()
      .use(remarkGfm)
      .use(remarkDirective)
      .use(yamlToGfmTable, {})
      .processSync(vfile(`
::table{file=./__fixtures__/filename\\ with\\ spaces.js}
`))
      .toString().trim().toString()).toMatchInlineSnapshot(`
  `);
});
*/

describe('options.rootDir', () => {
  test('Defaults to process.cwd()', () => {
    expect(
      remark()
      .use(remarkGfm)
      .use(remarkDirective)
      .use(yamlToGfmTable, {})
        .processSync(
          vfile(`
::table{file=[rootDir]/__fixtures__/noop.yml}
`))
        .toString()
    ).toMatchInlineSnapshot(`
      "| header1 |
      | ------- |
      | title   |
      "
    `);
  });
});

/*
  test('Passing custom rootDir', () => {
    expect(
      remark()
        .use(remarkGfm)
        .use(remarkDirective)
        .use(yamlToGfmTable, { rootDir: path.resolve('__fixtures__') })
        .processSync(
          vfile(`
::table{file=<rootDir>/say-#-hi.js}
  `)
        )
        .toString()
    ).toMatchInlineSnapshot(`
      "\`\`\`::table{file=<rootDir>/say-#-hi.js}
      console.log('Hello remark-code-import!');
      \`\`\`
      "
    `);
  });

  test('Throw when passing non-absolute path', () => {
    expect(() => {
      remark()
        .use(remarkGfm)
        .use(remarkDirective)
        .use(yamlToGfmTable, { rootDir: '__fixtures__' })
        .processSync(
          vfile(`
::table{file=<rootDir>/say-#-hi.js}
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
      .use(remarkGfm)
      .use(remarkDirective)
      .use(yamlToGfmTable, {})
        .processSync(
          vfile(`
::table{file=../some-file}
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
        .use(remarkGfm)
        .use(remarkDirective)
        .use(yamlToGfmTable, { allowImportingFromOutside: true })
        .processSync(
          vfile(`
::table{file=../some-file}
  `)
        )
        .toString()
    ).toMatchInlineSnapshot(`
      "\`\`\`::table{file=../some-file}
      Some file
      \`\`\`
      "
    `);

    mocked.mockRestore();
  });
*/

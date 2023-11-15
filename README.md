# Remark YAML to GitHub Flavored Markdown plugin

Basic plugin to handle converting a YAML table in a specific format to
GFM markdown. With basic support for inline styling, such as bold, code font, and italics.

## Table format

Exactly the existing format:

```yaml
---
- first column: |
    ## H2 header
  second column: |-
    **bold**
  third column: |-
    multiple
    lines
- first column: "`quoted code font`"
  second column: |-
    *italics*
  third column: >
    [random link](file.md)
```

## Limitations

This plugin uses the Remark Directive plugin. The options metadata for a directive cannot include the following characters:

- Spaces, such as `file=this directory/file.yml`
- Angle brackets, such as `file=<rootDir>`

When any of these characters are included, the plugin breaks in unexpected ways.

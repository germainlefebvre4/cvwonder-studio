# YAML Format Guide

This guide provides details on how to write your CV in YAML format for CVWonder.

## What is YAML?

YAML (YAML Ain't Markup Language) is a human-readable data serialization format. It's designed to be easy to write and read, making it perfect for configuration files and data exchange.

## YAML Basics for CVWonder

### Key-Value Pairs

YAML uses key-value pairs, which are represented as:

```yaml
key: value
```

For example:

```yaml
name: John Doe
email: john.doe@example.com
```

### Indentation

YAML uses indentation (spaces, not tabs) to indicate nesting. Consistent indentation is crucial:

```yaml
personal:
  name: John Doe  # Indented under personal
  email: john.doe@example.com  # Same level as name
```

### Lists

Lists are created using hyphens:

```yaml
skills:
  - Python
  - JavaScript
  - Docker
```

### Nested Lists

You can create nested lists by indenting further:

```yaml
experience:
  - company: Company A
    position: Developer
    highlights:
      - Built feature X
      - Improved system Y
  - company: Company B
    position: Engineer
```

### Multi-line Text

For longer text, you can use the pipe symbol (`|`) to maintain line breaks:

```yaml
summary: |
  This is a multi-line summary about me.
  Line breaks will be preserved exactly as written here.
  This is useful for paragraphs of text.
```

Or the greater-than symbol (`>`) to fold line breaks:

```yaml
summary: >
  This is also a multi-line summary but
  line breaks will be converted to spaces.
  This is useful for long sentences.
```

### Special Characters

If your text includes special characters like colons or quotes, you may need to wrap the text in quotes:

```yaml
position: "Senior Developer: Frontend Team"
```

### Date Format

For dates in CVWonder, use the ISO format:

```yaml
startDate: 2020-01  # January 2020
endDate: present    # Current position
```

## Common Mistakes to Avoid

### Inconsistent Indentation

```yaml
# Incorrect
personal:
  name: John Doe
 email: john.doe@example.com  # Wrong indentation

# Correct
personal:
  name: John Doe
  email: john.doe@example.com  # Same indentation as name
```

### Missing Spaces After Colons

```yaml
# Incorrect
name:John Doe  # Missing space after colon

# Correct
name: John Doe  # Space after colon
```

### Tabs vs. Spaces

Always use spaces, not tabs. Many YAML parsers don't handle tabs well.

### Forgetting Quotes for Special Characters

```yaml
# Incorrect
title: Team Lead: Frontend  # Colon causes parsing error

# Correct
title: "Team Lead: Frontend"  # Quotes protect special characters
```

## YAML Validation

Before using your CV file with CVWonder, you can validate it using:

```bash
cvwonder validate cv.yml
```

This will check for YAML syntax errors and structural issues.

You can also use online YAML validators:

1. Visit a YAML validation website (e.g., [YAMLLint](http://www.yamllint.com/))
2. Paste your CV content
3. Check for any errors

## YAML Comments

You can add comments to your CV file for your own reference. Comments start with `#` and are ignored by CVWonder:

```yaml
personal:
  name: John Doe
  # TODO: Add LinkedIn profile URL
  email: john.doe@example.com
```

## Complete Example

Here's a minimal valid CV in YAML format:

```yaml
personal:
  name: John Doe
  title: Software Engineer
  email: john.doe@example.com
  phone: "+1 (555) 123-4567"

summary: |
  Software engineer with 5 years of experience in web development.

experience:
  - company: Tech Company
    position: Software Engineer
    startDate: 2018-01
    endDate: present
    summary: Developing web applications using modern technologies.

education:
  - institution: University of Example
    degree: Bachelor of Science
    field: Computer Science
    startDate: 2014
    endDate: 2018

skills:
  - JavaScript
  - Python
  - Git
```

For more detailed examples and sections, refer to the [CV structure](https://cvwonder.readthedocs.io/en/latest/getting-started/write-cv/) guide.

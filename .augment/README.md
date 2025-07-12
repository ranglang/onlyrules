# AugmentCode Integration for OnlyRules

This directory contains AugmentCode rules and guidelines for the OnlyRules project. AugmentCode helps AI assistants provide more accurate and relevant responses by considering specific preferences, package versions, styles, and implementation details.

## Directory Structure

```
.augment/
└── rules/
    ├── always.md   # Rules that are always included in every user message
    ├── manual.md   # Rules that need to be manually attached via @-mention
    └── auto.md     # Rules that are automatically detected based on context
```

## Rule Types

1. **Always Rules**: These rules are automatically included in every user message when using AugmentCode with OnlyRules.

2. **Manual Rules**: These rules need to be manually attached through @-mention in AugmentCode.

3. **Auto Rules**: These rules are automatically detected and attached based on context.

## How to Use

AugmentCode will automatically detect and use these rules when working with the OnlyRules project. You can also manually attach rules using the @-mention feature in AugmentCode.

## Customizing Rules

Feel free to modify these rules to better suit your project needs. Rules are written in markdown format and can include any guidelines or preferences you want AugmentCode to follow.

## Learn More

For more information about AugmentCode rules and guidelines, visit:
https://docs.augmentcode.com/setup-augment/guidelines

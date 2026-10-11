# Lesson Languages

The Programming vs ML and Machine Learning chapters, and the Neural Networks
Perceptron lesson, support English (`en-US`) and Brazilian Portuguese
(`pt-BR`). The lesson breadcrumb exposes `EN-US` and `PT-BR` buttons.
English is the default; the selection is saved in browser
storage under `ai-intro-language` and survives refreshes and navigation.

Both languages use the same React lesson components. Changing the language
updates copy without remounting the page, preserving simulation progress,
model parameters, inputs, and expanded explanations. Chapters without
translated lessons retain their English content.

## Maintaining Copy

`apps/ai-intro/src/i18n/pt-br.ts` maps English copy to Brazilian Portuguese.
Lesson components use `useTranslation().t` for visible strings. English strings
are also the fallback for missing entries. Whitespace is normalized for lookup;
surrounding whitespace is preserved when rendering. Dynamic strings use
numbered placeholders, for example `t("Fewer neurons in layer {0}", [layer])`.

`i18n/curriculum.ts` localizes chapter, lesson group (e.g. "Metrics") and lesson display names. Slugs and lesson
indices remain canonical. Shared chart and metric components translate display
labels; series IDs, class IDs, glossary lookup keys, datasets, equations and
training functions stay language independent. Keep identifiers separate from
translated labels when adding examples.

The language provider tolerates unavailable browser storage. Lesson containers
declare the selected language with `lang`; untranslated placeholders declare
`en-US`. The selector exposes its active option with `aria-pressed`.

## Verification

The i18n tests cover defaults, persistence, all translated lesson headings,
navigation identities, interpolation, training state, numeric inputs and chart
class colors. Run the app's test, lint and build scripts from its README.

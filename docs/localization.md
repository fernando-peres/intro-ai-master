# Lesson Languages

The Programming vs ML and Machine Learning chapters, the Neural Networks
Perceptron and Back-propagation lessons, and the Generative AI Transformers group
(Architecture, Pretraining, Post-training, plus the lineage row in GPT → ChatGPT) support
English (`en-US`) and Brazilian Portuguese (`pt-BR`). The Generative AI chapter's sidebar
titles are translated, the Training Intuition group included; its other lessons keep English bodies. The lesson breadcrumb exposes `EN-US` and `PT-BR` buttons.
English is the default; the selection is saved in browser
storage under `ai-intro-language` and survives refreshes and navigation.

Both languages use the same React lesson components. Changing the language
updates copy without remounting the page, preserving simulation progress,
model parameters, inputs, and expanded explanations. Chapters without
translated lessons retain their English content.

## Maintaining Copy

`apps/ai-intro/src/i18n/pt-br.ts` maps English copy to Brazilian Portuguese; the Transformers
group's entries live in `pt-br-transformers.ts` and are spread into that map. A test scans
those lessons' `t()` literals and fails when one has no entry.
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

## Editable Summary

Generalization → Summary has separate English and Brazilian Portuguese documents.
Its authored blocks live in `lessons/machine-learning/summary/content.ts`, and its
editor controls use localized copy and BlockNote dictionaries. Switching language
flushes pending edits and opens that language’s saved copy; user text is never
automatically translated. Theme changes preserve the active editor.

## Verification

The i18n tests cover defaults, persistence, all translated lesson headings,
navigation identities, interpolation, training state, numeric inputs and chart
class colors. Run the app's test, lint and build scripts from its README.

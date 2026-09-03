# Page authoring — pointer, not a copy

**The page-authoring reference for this widget lives in `@auraq/guidance`, not here.**

```
list_widgets()                                      <- is it registered, and is it gated?
get_widget_reference("com.auraq.aqnivo.AqNivo")     <- the reference itself
```

This file is deliberately a pointer. Two copies of one reference drift apart, and the drift is
silent — the copy that is wrong is the one someone reads.

## Why the auto-schema is not the answer either

Installing this widget makes Mendix generate `/pagegen/customWidgetsVFS/com.auraq.aqnivo.AqNivo.schema.json`.
That schema is **structurally complete and semantically empty**: every property, every type, every
enumeration value and every `<description>` is there — and none of the following is, because none of
it can be:

- **Required-ness.** `required="true"` in the widget XML is nowhere in the schema.
- **Every conditional-visibility rule** from `getProperties()`, and **every cross-property rule** from
  `check()` — those live in code.
- **Every model prerequisite** — which attributes must be Unlimited, what shape a datasource must
  already be aggregated to, what carries a click payload.

For this widget the third of those is most of the document. A chart bound to a paged datasource that
the app has not pre-aggregated produces a subtotal presented as a total: not slow, **wrong**, and
entirely plausible-looking. No schema can express that, so the reference must.

## Status

**Not yet published.** The reference is written at the end of the 2.0 rebuild, as
`.aq/guidance-handover.md` in this repo, and handed to a guidance session. It has three parts:

| Part | Contents | Becomes |
|---|---|---|
| **A** | Directory entry — `widgetId`, slug, aliases, summary, `useWhen`, `useInstead`, `verification` | a record in `widgets.json`, served by `list_widgets` |
| **B** | The reference — page-JSON skeleton **read back** from a working page with `pg_read_page`, valid property combinations, model prerequisites | the published reference |
| **C** | The captured VFS auto-schema and how it differed from the XML | a cross-check for the maintainer; not published |

**Part A is the half that decides whether anyone finds the widget** — a reference that is published
but not in the directory is unreachable in practice.

No `gate` applies. Nivo is MIT.

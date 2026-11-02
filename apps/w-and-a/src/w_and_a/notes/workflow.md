A workflow is **a path drawn in advance, in code**. The model does the language work inside each step; our code decides the order, which tool to call and what counts as a good answer.

#### Who decides
**Our code.** Same kind of request → same path, every time. The steps are visible in the chat events: classify, route, look up, draft, check.

#### How this one works
1. **Classify:** the model labels the message `order`, `policy`, `price` or `other`.
2. **Route:** code picks the path. This is an `if` statement, not a model choice.
3. **Look up:** code calls the tool for that path. For a delayed order it *also* looks up the late-delivery policy, because a rule says so.
4. **Draft:** the model writes the reply from the facts only.
5. **Check:** code tests the reply (not empty, short, states the order id or the computed price). On failure the model revises once.

#### When to use it
Known, repeatable processes: triage, standard replies, invoices, form handling. You get predictability, lower cost, and easy testing and auditing.

#### Limits
It breaks on cases nobody foresaw: a message that needs two paths gets only one. Adding a path means changing code.

#### Try this
Ask *"What's the status of order 1043?"* twice: the same steps, the cheapest correct answer. Then ask *"Can I still return the lamp from order 1043, and who pays shipping?"*: the path takes one route, so half the question goes unanswered.

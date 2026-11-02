An agent is **a model using tools in a loop**: think → act → observe, repeated until it can answer. Nobody drew its path; it chooses the next step from what it has found so far.

#### Who decides
**The model.** It picks which tool to call, with what arguments, in what order, and when it is done. Our code still runs every tool (the model only *asks*) and stops the loop after 6 rounds.

#### How this one works
- It has all five tools: `lookup_order`, `find_orders`, `search_policies`, `get_weather` and `calculate`.
- Each tool result goes back to the model as *ground truth* for the next step.
- Reasoning summaries, where the model provides them, show *why* it chose a step.

#### When to use it
Open-ended tasks where the steps depend on what turns up: investigations, research, multi-part questions.

#### Limits and risks
- Less predictable: the same question can take a different path.
- Costs more time and tokens than a workflow.
- Wrong turns and loops are possible, hence the step limit, and guardrails and evals in production.

#### Try this
Ask *"Where is order 1045? It's the wool throw going to Coimbra."*: the lookup fails and it changes course. Then ask *"Can I still return the lamp from order 1043, and who pays shipping?"*: it fetches both facts. Compare both with **Workflow**.

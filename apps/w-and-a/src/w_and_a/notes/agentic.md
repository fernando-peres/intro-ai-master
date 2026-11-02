An agentic system is **several agents working as one system**, with roles, handoffs and checks. Here it is a supervisor pattern: a lead, two specialists and a reviewer.

#### Who decides
A **lead agent** plans and delegates. Each **specialist** decides its own tool calls, within its own tools only. A **reviewer** agent checks the reply against the findings.

#### How this one works
1. **Plan:** the lead splits the request into 1–3 subtasks, as JSON. If the JSON is unusable, code falls back to "both specialists, whole question".
2. **Hand off:** in order, each subtask goes, with the earlier specialists' reports, to the orders specialist (`lookup_order`, `find_orders`, `get_weather`) or the policies specialist (`search_policies`, `calculate`). Each is an agent loop of up to 4 rounds.
3. **Write:** the lead writes the reply from the specialists' reports only.
4. **Review:** the reviewer answers PASS or FAIL with a reason. On FAIL the lead revises once.

#### When to use it
Large or multi-domain tasks where separating roles (and the tools each role may use) adds quality or control.

#### Limits and risks
- The most calls, tokens and seconds of all five chats.
- More moving parts to test and observe, and handoffs can lose context.
- Start simple: use this only when a single agent or a workflow measurably falls short.

#### Try this
Ask *"Orders 1042 and 1044: where is each, any weather risk, and what will I be owed?"* here and in **Agent**. Compare the answers and the tokens: here one agent copes, and the team costs about twice as much.

A chatbot **talks**: it answers in a conversation. What sits behind the conversation varies, and this page's chat lets you try both kinds.

#### Two kinds, often combined
| | Scripted flow | LLM chatbot |
|---|---|---|
| **Who decides each step** | Our code: a fixed decision tree of menus, keywords and templates | A model, writing each reply |
| **Same message, same state** | Always the same answer | The wording can change |
| **Strengths** | Predictable, auditable, cheap, no model to run | Understands free text, sounds natural |
| **Weak spot** | Brittle: anything off-script falls back to the menu | Without tools it can't look anything up, and may invent |

Most production chatbots are **hybrid**: scripted flows for transactions where control matters (order status, payments, identity checks), and a model for open questions or as the fallback when no rule matches. Google's Dialogflow CX calls this a *generative fallback*. Microsoft Copilot Studio builds the flows as *topics* of message, question and condition nodes.

#### When to use it
- **Scripted:** a short list of common requests, compliance-sensitive answers, or high volumes at low cost.
- **LLM:** explaining, drafting and general questions, where a wrong detail does little harm.

#### Try this
- In **Scripted flow**: type `where is my order?`, then `1042`. The bot asks, remembers that it asked, and the rule that fires adds the voucher line. Then ask *"Write a short, friendly apology for a late delivery."*: the words "late delivery" trip the order rule, and it asks for an order id.
- In **LLM**: ask about order 1042. It can't see orders, so watch whether it says so or guesses.

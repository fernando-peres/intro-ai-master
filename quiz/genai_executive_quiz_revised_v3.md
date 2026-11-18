# GenAI & Foundation Models — Executive Decision-Making Quiz (Revised)

**Course:** Introduction to AI and Machine Learning — Executive Master in Artificial Intelligence for Business  
**Based on:** 
- Class 4 — Intro to Generative AI; 
- Class 5 — GenAI Models: Features and Limitations; 
- Class 6 and 7 — Building & Improving GenAI Systems  

**Format:** 10 questions · 4 options (A–D) · **exactly one correct answer per question**  
**Difficulty:** 3 Easy · 5 Medium · 2 Hard  
**Scoring:** 1 point per correct answer; 10 points total  
**Audience:** Executives; decision-making focus, not implementation-level technical trivia.

> **Instructions:** Choose the **single best answer**, considering **all the constraints stated in each business scenario**. Some alternatives could work under different assumptions; only one meets the full scenario as written.

---

# Part I — Student Quiz (No Answers)

## Easy (Questions 1–3)

### Q1 — Selecting a Model Strategy

A financial-services company wants to test AI for **summarizing reports, extracting information from contracts, and drafting client communications**. It has a limited budget and wants to validate these use cases **before investing in specialized training**. What is the most sensible starting point?

- **A.** Build three separate task-specific models, each trained exclusively on its own labeled dataset.
- **B.** Start with an existing general-purpose foundation model, evaluate it on the three tasks, and adapt the surrounding solution where needed.
- **C.** Continue pretraining an existing model on all internal documents before testing any of the three tasks.
- **D.** Select one of the tasks, optimize a dedicated model for it, and use its results as evidence of performance on the other two.

### Q2 — Improving Instructions

An operations team uses GenAI to summarize weekly incident reports. The summaries are generally accurate but differ in **structure, tone, and level of detail**. The team wants a **quick, reversible improvement without changing model weights**. What should it try first?

- **A.** Use a standardized prompt template with explicit sections, constraints, and a few representative examples; then test the outputs.
- **B.** Apply supervised fine-tuning with examples of correctly formatted incident summaries.
- **C.** Increase the context window and submit more historical incident reports with each request.
- **D.** Retrieve additional company documents through retrieval-augmented generation (RAG) to improve access to operational knowledge.

### Q3 — Matching Capabilities to the Task

A retailer wants an assistant to **compare a photograph of a damaged product with the customer's written description** and draft a suggested response. Which requirement is essential when selecting the model?

- **A.** It must generate images from written prompts, even if it cannot interpret uploaded photographs.
- **B.** It must specialize in extracting text from images; product appearance can be inferred from that text alone.
- **C.** It must process both image and text inputs and produce a text response.
- **D.** It must accept speech and transcribe it before analyzing the customer complaint.

## Medium (Questions 4–8)

### Q4 — Current and Restricted Company Knowledge

A company's HR assistant must answer questions from **frequently updated internal policies**. Different employees have different access rights, and answers must identify their sources. The organization wants to **avoid retraining the model for every policy update**. Which design is the best fit?

- **A.** Continue pretraining on each new policy release, while keeping separate access checks in the employee portal.
- **B.** Store all policies in one long system prompt and update it whenever policies change.
- **C.** Fine-tune the assistant on approved policy Q&A examples and ask it to include citations in its responses.
- **D.** Use RAG with document metadata, access-controlled retrieval, and source-backed responses.

### Q5 — Memory Across Sessions

A customer-service assistant needs **persistent memory across sessions** to remember a client's **explicitly approved contact preference**. The company also needs to **correct or delete that preference** without retraining the model. Which approach best satisfies both requirements?

- **A.** Include the preference in the current conversation and rely on the model's context window to preserve it for future sessions.
- **B.** Store the preference in an external memory record with update/deletion controls and retrieve it when relevant and add to the context windows.
- **C.** Add the preference to the model through periodic fine-tuning on conversation histories.
- **D.** Keep every conversation transcript indefinitely and paste the full history into every new request.

### Q6 — Comparing Supplier Costs

A procurement team wants an AI assistant to recommend the cheapest supplier for a planned purchase. The assistant must check **stock levels in the company's database**, find **current prices on supplier websites**, and **calculate the total cost, including shipping and discounts**. What should the company add to enable this task?

- **A.** Detailed rules in the prompt explaining where to find stock and prices and how to calculate the total cost.
- **B.** An LLM as a judge to review the recommendation and score whether its prices and calculations look correct.
- **C.** Develop Tools for database queries, web searches, and calculations, connected directly or through Model Context Protocol (MCP) servers.
- **D.** Fine-tuning on past purchases so the model learns typical stock levels, supplier prices, and total costs.

### Q7 — Input Guardrails

A customer-support company uses an external LLM to summarize customer messages. The messages may contain **personal identifiers, such as email addresses and national identification numbers**, which are unnecessary for the summaries. Company policy requires removing these identifiers **before sending the messages to the external LLM**. Which control best meets this requirement?

- **A.** Send the messages with a system prompt instructing the LLM to ignore personal identifiers when summarizing.
- **B.** Apply an output filter that removes personal identifiers from each summary before an employee sees it.
- **C.** Audit a sample of messages and summaries each week, and investigate any personal identifiers found.
- **D.** Apply an input guardrail that detects and redacts personal identifiers before transmission, blocking or routing requests for internal review if sanitization fails.

### Q8 — When to Use an LLM as a Judge

A company uses AI to draft customer-service replies. It wants to check whether thousands of replies are **clear, polite, and answer the customer's question**. Reviewing every reply manually would take too long. Which approach best fits this quality check?

- **A.** Use an LLM as a judge to assess each question and reply against clear criteria, and have people check a sample of its ratings.
- **B.** Check whether each reply contains polite words such as “please” and “thank you.”
- **C.** Measure how quickly the AI writes each reply and how much it costs.
- **D.** Compare each reply word for word with one approved answer, accepting only exact matches.

## Hard (Questions 9–10)

### Q9 — Agent vs. Workflow

A retailer is designing two customer-service processes. (1) **Routine returns must follow predefined classification, order-lookup, and approval rules**, including branches for different return types. (2) For **unusual delivery problems**, the required investigation cannot be fully specified in advance: the model must choose which tool to use next based on what it discovers. Which design best matches both needs?

- **A.** Use an agent to choose the steps for routine returns, and a predefined workflow with fixed investigation paths for unusual delivery problems.
- **B.** Use predefined workflows for both, requiring every delivery investigation to follow one of the paths specified before deployment.
- **C.** Use a workflow for routine returns and a bounded agent for delivery investigations, with tool permissions and step, time, or cost limits.
- **D.** Use agents for both, letting the model decide the return-approval rules and the investigation steps separately for each case.

### Q10 — Deciding What to Improve

A new company's customer-service assistant is **taking longer to reply, costing more, and sometimes giving wrong answers**. The team does not know why and **where the problems occur**. What should the team do first?

- **A.** Use its intuition about what is missing and add more tools so the assistant can access more information.
- **B.** Use its knowledge of AI and add an agent to give the assistant more flexibility in solving customer problems.
- **C.** Create guardrails to block incorrect replies and limit spending, then check whether complaints decrease.
- **D.** Add observability: record the steps behind each reply, including information retrieved, model and tool calls, retries, versions, time, and cost. Link these records to results and user feedback while protecting sensitive data.

---

# Part II — Instructor Answer Key & Question-by-Question Validation

## Summary

| Question | Difficulty | Correct | Learning objective |
|:--|:--|:--:|:--|
| Q1 | Easy | **B** | Reuse and evaluate a foundation model before investing in training |
| Q2 | Easy | **A** | Prompt engineering as a low-cost, reversible intervention |
| Q3 | Easy | **C** | Match multimodal capabilities to the actual input/output requirements |
| Q4 | Medium | **D** | RAG, permissions, freshness, and source grounding |
| Q5 | Medium | **B** | Persistent memory with governance and deletion |
| Q6 | Medium | **C** | Recognize when a task needs external tools, connected directly or through MCP |
| Q7 | Medium | **D** | Input guardrails that redact sensitive data before model access |
| Q8 | Medium | **A** | When to use an LLM judge for language-quality evaluation |
| Q9 | Hard | **C** | Match predefined processes to workflows and adaptive investigation to agents |
| Q10 | Hard | **D** | Observability through traces, operational metrics, and feedback |

## Q1 — Validation: B

**Why B is correct:** One existing foundation model can support multiple tasks. The company can first evaluate its actual performance across the three intended uses and invest only in adaptations that prove necessary. This directly satisfies cost discipline and the no-specialized-training-yet constraint.

**Why the other choices do not meet the stated requirements:**

- **A:** Dedicated models may be appropriate later, but require separate datasets and training investment before validating demand and fit.
- **C:** Continued pretraining is a genuine adaptation strategy, but incurs training cost before the requested proof of concept.
- **D:** Performance on one task does not establish performance on the other two, so it fails the multi-use-case evaluation goal.

**Uniqueness check:** The words **“limited budget”** and **“before investing in specialized training”** eliminate A and C; assessing all three distinct tasks eliminates D. **Only B meets all constraints.**

## Q2 — Validation: A

**Why A is correct:** Explicit structure, constraints, examples, and output testing target variability in format and tone; changing a prompt template is fast and reversible and leaves weights unchanged.

- **B:** SFT could improve adherence but modifies weights and is not the first low-cost reversible intervention.
- **C:** More context does not directly standardize formatting, and additional material can introduce distraction.
- **D:** RAG helps with missing or current knowledge; the scenario states that content accuracy is already generally good and the problem is presentation consistency.

**Uniqueness check:** The scenario isolates a **format/consistency** problem and explicitly requires **no weight updates** and a **quick, reversible** first step. **Only A addresses all three.**

## Q3 — Validation: C

**Why C is correct:** The specified task needs joint understanding of visual and textual input, followed by a written response. This is a multimodal image-plus-text input requirement.

- **A:** Text-to-image generation does not establish the ability to understand uploaded product images.
- **B:** OCR alone may read labels but does not adequately assess visual product damage.
- **D:** Speech transcription is useful for spoken complaints but is not the input modality described.

**Uniqueness check:** The stem names **photographs + written descriptions** as inputs and **text** as output. **Only C supports the complete required input/output pattern.**

## Q4 — Validation: D

**Why D is correct:** RAG can retrieve current policies without updating model weights. Metadata and access-controlled retrieval support policy versioning and permissions, while source-backed answers support verification.

- **A:** Continued pretraining can teach domain patterns but does not efficiently reflect each policy update or by itself guarantee source-backed answers.
- **B:** Updating the prompt can keep policies current, but including all policies for every employee does not enforce differentiated access rights or explicitly provide source identification.
- **C:** SFT can improve instruction following but does not guarantee updated policy details, permissions, or genuine citations.

**Uniqueness check:** The combined requirements are **frequent updates, differentiated access, verifiable sources, and no recurring retraining**. **Only D explicitly satisfies all four.** RAG itself is not an authorization system; permissions must be enforced in retrieval and surrounding code.

## Q5 — Validation: B

**Why B is correct:** External structured memory persists across independent requests and supports explicit updating and deletion without altering the model's learned parameters.

- **A:** Context exists for the current inference; independent future sessions do not inherently retain it.
- **C:** Fine-tuning is inappropriate for mutable individual preferences and does not offer reliable per-record deletion.
- **D:** Storing transcripts may preserve history, but indiscriminate replay is wasteful and fails to provide clear preference-level correction/deletion controls as stated.

**Uniqueness check:** The requirement for **persistence plus controlled correction/deletion without retraining** excludes A, C, and D as written. **Only B meets the full requirement.**

## Q6 — Validation: C

**Why C is correct:** The task needs access to information outside the model and reliable calculations. Database and web tools retrieve stock levels and current prices; a calculation tool applies shipping and discounts. These tools can be connected directly or exposed through MCP servers, with appropriate access permissions.

- **A:** Instructions describe what to do but do not give the assistant access to the database or websites, or provide a calculation capability.
- **B:** An LLM judge can help evaluate a recommendation, but judging whether figures look correct does not retrieve current data or independently verify the arithmetic.
- **D:** Historical examples do not provide current stock or prices and cannot replace calculations using the actual purchase details.

**Uniqueness check:** The scenario requires **database access, current web information, and calculations**. **Only C provides the capabilities needed for all three.** MCP is one way to connect tools, not a requirement for every tool call.

## Q7 — Validation: D

**Why D is correct:** An input guardrail processes the message before the external model receives it. Redaction removes the unnecessary identifiers, while blocking or internal review provides a fallback when sanitization fails. Detection and redaction must be tested; a guardrail is not a guarantee that every sensitive value will be recognized.

- **A:** The external LLM has already received the identifiers by the time it can follow the instruction to ignore them.
- **B:** Output filtering protects what employees see but does not prevent the original identifiers from reaching the external LLM.
- **C:** Auditing can reveal incidents after transmission but does not remove identifiers before they are sent.

**Uniqueness check:** The requirement is **removal before transmission to the external LLM**. **Only D places the control at that boundary.** The input guardrail must run within the company's approved processing environment, not send the unredacted message to the external LLM for sanitization.

## Q8 — Validation: A

**Why A is correct:** An LLM judge is useful for quality checks that require interpreting language, such as clarity, tone, and whether a reply addresses a question. Clear criteria guide its ratings, and human spot checks help identify mistakes or bias in the judge.

- **B:** Polite keywords alone do not establish that a reply is clear, respectful, or answers the question.
- **C:** Speed and cost are useful operational metrics, but they do not measure the requested reply quality.
- **D:** Different wording can produce equally good replies, so exact matching would reject valid answers.

**Uniqueness check:** The company needs to assess **meaning and tone across many replies**. **Only A addresses all the stated quality criteria at scale, with human oversight.** An LLM judge supports evaluation; its ratings are not guaranteed to be correct.

## Q9 — Validation: C

**Why C is correct:** A workflow keeps routine returns under predefined rules, including conditional branches. A bounded agent can choose investigation tools and subsequent steps based on intermediate findings when the path cannot be fully specified in advance. Application-enforced permissions and limits constrain its autonomy.

- **A:** This reverses the fit: routine returns need predefined control, while the unusual investigations require adaptive tool selection beyond fixed paths.
- **B:** Workflows can branch, but limiting every investigation to paths specified before deployment conflicts with the stated need for model-selected next steps that cannot all be anticipated.
- **D:** Letting an agent decide return-approval rules for each case conflicts with the requirement to follow predefined rules.

**Uniqueness check:** The scenario combines **predefined return rules** with **model-directed investigation based on findings**. **Only C explicitly matches both.** A workflow can use LLMs and tools; their presence alone does not make it an agent. The key distinction is who determines the next step.

## Q10 — Validation: D

**Why D is correct:** Observability lets the team see what happened behind each reply. These records, called request-level traces, help locate slow or expensive steps and investigate wrong answers. Linking them to system versions and user feedback helps the team choose improvements based on evidence. Sensitive data should be redacted or excluded, with appropriate access and retention controls.

- **A:** More tools may help if missing information is the cause, but intuition alone does not establish that. Extra tools can also increase time and cost.
- **B:** An agent may help tasks that need flexible investigation, but adding one does not explain the current problems and can introduce more steps and expense.
- **C:** Guardrails can enforce limits and check replies, but adding them alone does not reveal where the existing problems originate. They may be part of the solution after investigation.

**Uniqueness check:** Management wants **evidence of where problems occur before investing in changes**. **Only D directly provides that evidence.** Observability shows what happened; evaluations and human review assess whether answers were correct. Traces support investigation rather than proving the cause on their own.

---

# Instructor Quality Audit

**Per-question checklist applied:** (1) The stem contains an executive business problem. (2) All four choices are credible strategies or technologies rather than random concepts, except where a simpler discriminator is appropriate. (3) The keyed option satisfies every explicit constraint. (4) Every distractor fails at least one explicit constraint. (5) The explanation identifies the exact constraint that distinguishes the answer; no distractor is rejected solely because another option is more fashionable.

| Question | Main decision tension | Why a second answer is not defensible under the stated constraints |
|:--|:--|:--|
| Q1 | Model reuse vs. premature specialized investment | Other strategies require early training or fail to test all tasks |
| Q2 | Prompting vs. training and extra knowledge | Only the prompt template is fast, reversible, format-focused and weight-preserving |
| Q3 | Image understanding vs. adjacent modalities | Only one alternative handles the complete image+text input requirement |
| Q4 | Freshness vs. trainability vs. access | Only access-controlled RAG explicitly handles all requirements together |
| Q5 | Current context vs. persistent governed memory | Only external managed memory provides editable and deletable records across sessions |
| Q6 | Instructions and evaluation vs. access and execution | Only tools provide database access, current web information, and calculation capability |
| Q7 | Prevention before transmission vs. checks afterward | Only the input guardrail removes identifiers before the external LLM receives them |
| Q8 | Language-quality judgment vs. simple automated checks | Only an LLM judge with clear criteria and human oversight assesses meaning and tone at scale |
| Q9 | Predefined rules vs. model-selected investigation steps | Only C matches workflow control to routine returns and bounded autonomy to unusual investigations |
| Q10 | Evidence before changes vs. adding capabilities or controls | Only observability reveals the steps behind replies to guide investigation before choosing a fix |

**Difficulty note:** Difficulty is qualitative rather than psychometrically calibrated. Q1–Q3 establish fundamental judgment, Q4–Q8 require selecting among adjacent interventions, and Q9–Q10 require matching orchestration to business constraints and diagnosing production behavior. Pilot the quiz with a small group if statistical calibration is needed.

**Source alignment (course slides):** Class 4 covers Foundation Models, transfer learning, pretraining and post-training; Class 5 covers prompt engineering, multimodality, memory, tool calling, context and limitations; Class 6 covers harnesses, context engineering, RAG, tool execution, orchestration, guardrails, evaluations and observability.

**Instructor recommendation:** For an assessment delivered to students, distribute **Part I only**. Keep **Part II** as the private answer key and validation record.

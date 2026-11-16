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
- **D.** Retrieve additional company documents through RAG to improve access to operational knowledge.

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

### Q5 — Continuity Across Sessions

A customer-service assistant should remember a client's **explicitly approved contact preference** in later sessions. The company also needs to **correct or delete that preference** without retraining the model. Which approach best satisfies both requirements?

- **A.** Include the preference in the current conversation and rely on the model's context window to preserve it for future sessions.
- **B.** Store the preference in an external memory record with update/deletion controls and retrieve it when relevant.
- **C.** Add the preference to the model through periodic fine-tuning on conversation histories.
- **D.** Keep every conversation transcript indefinitely and paste the full history into every new request.

### Q6 — When Model Adaptation Is Justified

A company has tested prompt templates and RAG for an existing model. It has reliable labeled examples of its required **input–output behavior**, but the model still **consistently fails to follow a specialized response protocol**. The company is willing to update model weights. Which training approach most directly targets this problem?

- **A.** Continued pretraining on a broad collection of unlabeled industry reports.
- **B.** Training a brand-new foundation model from scratch.
- **C.** Supervised fine-tuning on curated examples of the required input–output behavior.
- **D.** Expanding the retrieval index with more reference documents, without changing the model.

### Q7 — Safely Executing Actions

A procurement assistant can read supplier prices and prepare purchase orders. Management wants it to **prepare and submit routine orders autonomously**, but **no order above €10,000 may be submitted without human approval**. Which implementation best enforces this requirement?

- **A.** Let the model call the ordering API, but instruct it in its prompt to seek approval for large orders.
- **B.** Allow the model to draft and submit orders; review the logs afterward and reverse any noncompliant purchase.
- **C.** Use a capable reasoning model with the full ordering API; evaluate its compliance before production.
- **D.** Allow the model to prepare orders, but enforce the €10,000 approval threshold in the application before any submission tool executes.

### Q8 — Context Quality vs. Context Quantity

An internal analyst assistant receives hundreds of retrieved documents, including **outdated procedures and contradictory versions**. Despite fitting within the model's context window, its answers have become inconsistent. Which intervention most directly addresses the failure?

- **A.** Retrieve and prioritize relevant, authoritative, current passages using metadata and filtering; then test answer quality.
- **B.** Increase the context-window limit so the assistant can receive even more material.
- **C.** Fine-tune the model on the entire document collection before assessing which documents are authoritative.
- **D.** Increase generation randomness to encourage the model to explore different interpretations.

## Hard (Questions 9–10)

### Q9 — Choosing an Orchestration Design

An insurance company is automating claims handling. **Every claim must pass the same mandatory eligibility, fraud, and payment-approval checks in a fixed, auditable order.** For a small subset of unusual claims, the system must also **choose which additional evidence to request and which investigation tool to use based on intermediate findings**. What is the most appropriate design?

- **A.** An end-to-end agent chooses the order of all checks, including mandatory approval checks, to maximize flexibility.
- **B.** A fixed workflow performs all checks and uses the same additional evidence requests for every unusual claim.
- **C.** A workflow enforces mandatory stages and approvals, while a bounded agent can select investigative steps inside a controlled exception branch.
- **D.** A multi-agent system assigns every mandatory control to a different agent, and the agents decide collectively whether a claim may proceed.

### Q10 — Diagnosing and Improving a GenAI System

A GenAI financial assistant combines internal RAG, database tools, and an investigation agent. In a pilot, users report **plausible but incorrect numbers**, occasional **unauthorized tool requests**, and **inconsistent outcomes on similar cases**. Management needs a **measurable improvement plan before scaling**. Which proposal is strongest?

- **A.** Upgrade to a more capable model, compare overall user satisfaction, and keep the current tool permissions and retrieval pipeline unchanged.
- **B.** Add a stronger system prompt and more retrieved documents, then monitor whether complaints decline after deployment.
- **C.** Fine-tune on corrected responses, while postponing tool-permission changes and systematic tracing until after launch.
- **D.** Build representative test cases and metrics, inspect retrieval and execution traces, verify figures, enforce tool permissions, and iterate based on measured failure modes.

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
| Q6 | Medium | **C** | When supervised fine-tuning is warranted |
| Q7 | Medium | **D** | External enforcement of action authorization |
| Q8 | Medium | **A** | Context engineering: relevance and authority over volume |
| Q9 | Hard | **C** | Hybrid workflow and bounded agent orchestration |
| Q10 | Hard | **D** | Evidence-driven, system-level evaluation and improvement |

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
- **B:** A static, large prompt is hard to maintain, risks including unauthorized content, and poorly handles growing document collections.
- **C:** SFT can improve instruction following but does not guarantee updated policy details, permissions, or genuine citations.

**Uniqueness check:** The combined requirements are **frequent updates, differentiated access, verifiable sources, and no recurring retraining**. **Only D explicitly satisfies all four.** RAG itself is not an authorization system; permissions must be enforced in retrieval and surrounding code.

## Q5 — Validation: B

**Why B is correct:** External structured memory persists across independent requests and supports explicit updating and deletion without altering the model's learned parameters.

- **A:** Context exists for the current inference; independent future sessions do not inherently retain it.
- **C:** Fine-tuning is inappropriate for mutable individual preferences and does not offer reliable per-record deletion.
- **D:** Storing transcripts may preserve history, but indiscriminate replay is wasteful and fails to provide clear preference-level correction/deletion controls as stated.

**Uniqueness check:** The requirement for **persistence plus controlled correction/deletion without retraining** excludes A, C, and D as written. **Only B meets the full requirement.**

## Q6 — Validation: C

**Why C is correct:** The organization has reliable labeled examples of desired input–output behavior and wants to modify weights to improve consistent protocol adherence. That is the direct use case for SFT.

- **A:** Continued pretraining generally learns from unlabeled domain material and is not as directly targeted at labeled response behavior.
- **B:** Building a foundation model from scratch is unnecessary and disproportionate to adapting an existing model.
- **D:** More documents may aid factual grounding but do not directly train consistent adherence to a response protocol, especially after RAG has already been evaluated.

**Uniqueness check:** The scenario explicitly establishes that **prompting and RAG were tested**, labeled **behavior examples** exist, and **weight updates are allowed**. **Only C directly targets this residual problem.**

## Q7 — Validation: D

**Why D is correct:** The application can let the assistant draft orders but must enforce the financial threshold and approval before executing a write action. This is an external authorization control rather than a promise made by the model.

- **A:** Prompt instructions alone cannot reliably enforce an authorization boundary.
- **B:** Post-hoc logging is valuable for auditing but does not prevent an unauthorized purchase.
- **C:** Better model capability and predeployment evaluation can reduce errors but do not replace mandatory transaction controls.

**Uniqueness check:** The requirement is that **no order above the threshold may be submitted without approval**. **Only D places enforcement before execution.**

## Q8 — Validation: A

**Why A is correct:** Selecting, filtering, and ranking authoritative current passages directly addresses contradictory and outdated context. Measuring output quality validates the intervention.

- **B:** Larger windows may admit more irrelevant or conflicting information rather than resolve authority conflicts.
- **C:** Training on unfiltered contradictory documents can reproduce the same ambiguity and adds unnecessary cost.
- **D:** Higher randomness changes output variation, not the reliability or authority of evidence.

**Uniqueness check:** The problem is **context quality despite sufficient capacity**, not window size. **Only A directly resolves relevance, version authority, and evidence quality.**

## Q9 — Validation: C

**Why C is correct:** Code-defined workflow stages preserve compulsory checks and an auditable order. Within a bounded exception branch, one agent can choose additional investigation steps based on observations. Multi-agent execution is not a requirement for agentic behavior.

- **A:** End-to-end agent control conflicts with the mandated fixed order of checks and approvals.
- **B:** A strictly uniform exception path cannot select evidence and tools dynamically as the scenario requires.
- **D:** Multiple agents do not inherently guarantee fixed ordering, auditability, or mandatory human/governance controls; collective agent decisions cannot substitute for those requirements.

**Uniqueness check:** There are **two simultaneous constraints**—mandatory deterministic controls and flexible exception investigation. **Only C explicitly preserves both.**

## Q10 — Validation: D

**Why D is correct:** A measurable system-improvement process distinguishes causes using representative evaluations and execution traces; source and calculation checks address wrong figures; permissions constrain unsafe actions; repeatable tests assess consistency.

- **A:** Better model capability is a possible experiment, but a model upgrade alone leaves retrieval and authorization flaws untreated and measures too narrow an outcome.
- **B:** Prompts and more documents might help selected issues, but can worsen context quality and do not enforce permissions or establish a rigorous evaluation baseline.
- **C:** SFT could help some response patterns, but deferring permission enforcement and trace-based diagnosis leaves known operational risks unresolved before scaling.

**Uniqueness check:** The pilot has **three distinct failure classes**, and management explicitly requires **measurable evidence before scaling**. **Only D combines diagnostics, controls, and evaluation across all three.**

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
| Q6 | SFT vs. continued pretraining vs. RAG | Only SFT directly learns from labeled desired response behavior |
| Q7 | Model assurances vs. preventive authorization | Only application-side gating prevents forbidden submissions |
| Q8 | Volume vs. authoritative context | Only selection/filtering addresses outdated contradictory sources |
| Q9 | Mandatory sequence vs. adaptive investigation | Only hybrid orchestration offers both fixed controls and dynamic investigation |
| Q10 | Single-point optimization vs. observed system failures | Only system-level tests, traces, validation and permissions cover all named failures |

**Difficulty note:** Difficulty is qualitative rather than psychometrically calibrated. Q1–Q3 establish fundamental judgment, Q4–Q8 require selecting among adjacent interventions, and Q9–Q10 require multi-constraint architecture and governance decisions. Pilot the quiz with a small group if statistical calibration is needed.

**Source alignment (course slides):** Class 4 covers Foundation Models, transfer learning, pretraining and post-training; Class 5 covers prompt engineering, multimodality, memory, tool calling, context and limitations; Classes 6–7 cover harnesses, context engineering, RAG, tool execution, orchestration, guardrails, evaluations, observability and the system-improvement cycle.

**Instructor recommendation:** For an assessment delivered to students, distribute **Part I only**. Keep **Part II** as the private answer key and validation record.

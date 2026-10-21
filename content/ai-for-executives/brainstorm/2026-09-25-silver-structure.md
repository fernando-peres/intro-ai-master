Below is a consolidated version that keeps the course deliberately **executive-oriented**: enough theory to create intuition, but always moving toward business application, critical judgment, and the individual project.

# AI & Generative AI for Executives

**Format:** 4 classes × 2 hours
**Audience:** Executives and business leaders with low-to-moderate technical background
**Approach:** Concepts → Industry Cases → Executive Discussion → Individual Project
**Individual Project:** Progressive AI initiative proposal developed throughout all four classes.

## 1. Summary / Storyboard

The course follows a simple progression:

```text
UNDERSTAND
What changed?
     ↓
IMAGINE
What is possible?
     ↓
DESIGN
How would we make it work?
     ↓
LEAD
Should we invest, and how do we manage it?
```

The objective is **not to teach executives how to build AI systems**. It is to give them enough technical and business intuition to:

* recognize AI opportunities;
* understand what modern AI can and cannot do;
* distinguish demonstrations and hype from viable business systems;
* communicate effectively with technical teams and vendors;
* ask the right questions about architecture, data, reliability, risk and cost;
* evaluate and prioritize AI initiatives;
* manage the journey from idea to production and business value.

### Class 1 — UNDERSTAND

**What is AI, what changed with Generative AI, and what are its limitations?**

> *GenAI is extraordinarily powerful, but fundamentally imperfect.*

Students develop intuition about AI, ML, deep learning, foundation models and LLMs; understand why GenAI represents an important shift; and learn its fundamental limitations—hallucination, probabilistic behavior, stale knowledge, lack of proprietary context, limited context and inability to inherently access systems or take actions.

The central realization:

> **An LLM is a powerful general-purpose intelligence component—not a complete enterprise system.**

---

### Class 2 — IMAGINE

**What can AI do—and how do we separate capability from hype?**

> *Prototyping is cheap. Reliable business systems are harder.*

Students explore modalities and AI capabilities, then learn to recognize where those capabilities can transform business processes.

At the same time, they develop critical judgment about AI demonstrations and social-media claims that complex business problems can be solved with "one prompt."

The central distinctions become:

> **Demo ≠ Product ≠ Production System**

and:

> **Possible ≠ Reliable ≠ Valuable**

---

### Class 3 — DESIGN

**What do we need around the model to make AI useful, reliable and connected to the organization?**

> *AI value comes from the system, not just the model.*

Students move from models to **AI systems**: context engineering, RAG, memory, tools, workflows, agents, agentic systems, harnesses, guardrails, evaluation, observability and human oversight.

They learn to distinguish a bot, assistant, workflow and agent, and understand autonomy as a design decision rather than an objective.

The central question becomes:

> **What system must surround the AI capability for us to trust and use it?**

---

### Class 4 — LEAD

**How do we decide where to invest and how to manage AI initiatives?**

> *Move from technological possibility to measurable organizational value.*

Students move from technology to executive decision-making: opportunity prioritization, prototypes, pilots, evaluation, production, build vs buy, economics, governance, risk, adoption, organizational change and ROI.

The final question becomes:

> **Should we do this—and how will we know whether it succeeded?**

---

## Course narrative

One phrase can follow students throughout the discipline:

> **“Possible is not the same as reliable. Reliable is not the same as valuable.”**

And the conceptual progression becomes:

```text
CLASS 1             CLASS 2              CLASS 3              CLASS 4

UNDERSTAND           IMAGINE              DESIGN               LEAD

Technology           Capabilities         Systems              Decisions
    ↓                    ↓                    ↓                    ↓
Limits               Opportunities        Architecture         Investment
    ↓                    ↓                    ↓                    ↓
Why AI?              Where AI?            How AI?              Should we?
```

---

# 2. Course Structure / Syllabus

Every class follows approximately the same rhythm:

```text
CONCEPTS
   ↓
INDUSTRY CASES
   ↓
EXECUTIVE DISCUSSION
   ↓
"SO WHAT FOR OUR ORGANIZATION?"
   ↓
INDIVIDUAL PROJECT
```

A reasonable 2-hour allocation is:

**Concepts: 40 min → Cases: 20 min → Discussion: 25 min → Project: 35 min**

The case and discussion can naturally overlap.

---

# Class 1 — UNDERSTAND

## AI, Generative AI and the technological shift

### Objective

Develop a conceptual understanding of AI and Generative AI without requiring a technical background.

Students should leave able to explain:

* what AI and ML are;
* what changed with GenAI;
* roughly how LLMs work;
* why they are so capable;
* why they also fail;
* why an LLM alone is not an enterprise solution.

### Concepts

#### 1. From software to AI

```text
Traditional Software
Rules + Data
      ↓
    Output


Machine Learning
Data + Outcomes
      ↓
Learn Patterns
      ↓
Prediction


Generative AI
Large-scale Data
      ↓
Foundation Model
      +
Context / Instructions
      ↓
New Content / Reasoning
```

Cover at an intuitive level:

* Artificial Intelligence
* Machine Learning
* Deep Learning
* Training vs inference
* What a model is
* Generative AI
* Foundation models
* LLMs
* Transformers — intuition, not mathematics
* Tokens
* Prompt and context
* Probabilistic generation

#### 2. Why GenAI changed the landscape

Previous ML systems were often developed for specific tasks.

Foundation models provide much more general capabilities:

**Understand → Generate → Transform → Reason → Interact**

Natural language also becomes an interface to computing.

#### 3. Fundamental limitations

| Limitation                 | Executive intuition                                                |
| -------------------------- | ------------------------------------------------------------------ |
| Hallucination              | Fluent does not mean correct                                       |
| Probabilistic behavior     | AI does not behave exactly like deterministic software             |
| Knowledge freshness        | Training does not automatically give access to today's information |
| Proprietary knowledge      | The model does not inherently know your organization               |
| Limited context            | It cannot consider unlimited information simultaneously            |
| Reasoning failures         | Convincing reasoning can still be incorrect                        |
| No inherent system access  | Knowing something is different from accessing your systems         |
| No inherent ability to act | Generating an answer is different from executing an action         |
| Privacy/security           | Organizational context can contain sensitive information           |
| Autonomy risk              | Allowing AI to act introduces additional failure modes             |

### What an LLM is NOT

An LLM is not inherently:

* a database;
* a search engine;
* always up to date;
* your company's knowledge base;
* deterministic software;
* an agent;
* correct because it sounds confident.

### Preview: limitations → system solutions

Don't teach these deeply yet. Use them to foreshadow Class 3.

```text
LIMITATION                    POSSIBLE SYSTEM RESPONSE

Company knowledge        →    Context / RAG
Fresh information        →    Search / APIs / Tools
Hallucination            →    Grounding / Evals / Human review
Limited context          →    Retrieval / Context Engineering
Cannot act               →    Tools / Agents
No persistent state      →    Memory
Probabilistic behavior   →    Evals / Guardrails / Workflows
Sensitive information    →    Security / Permissions
Autonomy risk            →    Human-in-the-loop / Controls
```

### Industry case

**Morgan Stanley — AI and organizational knowledge**

Use the case to demonstrate how GenAI changes how professionals interact with internal knowledge and how human review remains part of the system.

Focus less on technology and more on:

```text
Advisor
   ↓
Question
   ↓
Company Knowledge + AI
   ↓
Answer / Draft
   ↓
Advisor
```

### Discussion

Questions such as:

* Is an LLM a database?
* Does an LLM actually "know" things?
* Why can the same model analyze a contract, write marketing copy and generate code?
* Why does hallucination occur?
* When would traditional software or traditional ML still be preferable?
* Where could interacting with organizational knowledge through natural language create value?

### Individual Project — Step 1

## Problem & Opportunity

Each student selects a real organizational problem or opportunity.

Deliverable:

```text
Organization / Business Context

Problem or Opportunity

Who experiences the problem?

How is it handled today?

Why does it matter?

What would improve if solved?

Where might AI help?

Initial hypothesis:

"We believe AI could __________
for __________
in order to improve __________."
```

---

# Class 2 — IMAGINE

## AI capabilities, multimodality and separating opportunity from hype

### Objective

Develop the ability to recognize what modern AI can do and translate AI capabilities into business opportunities.

At the same time, develop healthy skepticism about impressive demos and exaggerated AI claims.

### Concepts

## 1. Modalities

Modern AI can operate across:

* Text
* Images
* Audio / speech
* Video
* Code
* Structured data
* Multimodal combinations

Show transitions:

```text
Text  → Text
Text  → Image
Image → Text
Audio → Text
Text  → Audio
Text  → Code
Video → Understanding

Text + Image + Audio + Data
              ↓
         Multimodal AI
```

## 2. Think in capabilities, not products

Teach executives not to start with:

> "Where can we use ChatGPT?"

Instead:

> **"Which AI capabilities could transform this process?"**

A simple capability model:

```text
UNDERSTAND
   ↓
Extract
Classify
Search
Summarize

CREATE
   ↓
Text
Images
Audio
Video
Code

REASON
   ↓
Analyze
Compare
Recommend
Plan

ACT
   ↓
Use tools
Call APIs
Interact with systems
```

Introduce intuitively:

* Embeddings
* Semantic similarity
* Semantic search
* Generation
* Reasoning
* Recommendation
* Multimodal understanding
* Tool use as a preview of agents

## 3. From AI Magic to AI Engineering

This should be a central concept.

Generative AI has dramatically reduced the cost of experimentation:

```text
Idea
 ↓
Prompt
 ↓
Model
 ↓
Impressive Demo
```

But:

> **A prototype proves that something may be possible. It does not prove that it will work reliably inside your organization.**

Introduce:

```text
DEMO
"Can AI do it?"
   ↓

PROTOTYPE
"Can it work for our use case?"
   ↓

PRODUCT
"Does it solve a real user problem?"
   ↓

PRODUCTION
"Can we depend on it?"
```

Production introduces requirements such as:

**Context + Data + Integration + Security + Evaluation + Monitoring + Cost + Governance + Support**

## 4. The "One Prompt" myth

Treat social-media demos fairly:

> The demonstration may be real. The problematic part is often extrapolating from **“I demonstrated this”** to **“we have solved this business problem.”**

Example:

```text
"Customer Service Agent
built with one prompt"

            ↓

Prompt
+ Company Knowledge
+ Customer Data
+ Business Rules
+ Authentication
+ APIs
+ Permissions
+ Workflow
+ Evaluation
+ Guardrails
+ Monitoring
+ Human Escalation

            ↓

Production AI System
```

### Executive AI Reality Check

Whenever an executive sees:

> "AI can now do X."

Ask:

1. **Capability:** Can it perform the task?
2. **Reliability:** How often does it perform correctly?
3. **Context:** Does it work with our data and rules?
4. **Integration:** Can it work with our systems?
5. **Scale:** Does it work under real usage?
6. **Risk:** What happens when it is wrong?
7. **Economics:** Does the value justify the total cost?

### Industry cases

Use contrasting modalities and industries.

**GitHub Copilot** — AI-assisted software development.

**Ascendum** — GenAI supporting technicians with industrial knowledge and troubleshooting.

Optionally use **Siemens Industrial Copilot** to reinforce that GenAI is not synonymous with office chatbots.

### Discussion

Give students a case and ask:

> **Ignore the product. What capabilities are actually being used?**

For example:

```text
Industrial Maintenance
Retrieve + Reason + Recommend

Legal
Retrieve + Analyze + Draft

Sales
Understand + Recommend + Generate

Customer Service
Understand + Retrieve + Reason + Act
```

Then show an impressive "autonomous refund agent" demo and ask:

> **Would you deploy this tomorrow?**

Reveal progressively:

* How does it authenticate customers?
* How does it access orders?
* Who authorizes a €2,000 refund?
* What happens when the CRM is unavailable?
* How do we detect fraud?
* What if the AI is wrong?
* When should a human intervene?

The discussion naturally creates demand for Class 3.

### Individual Project — Step 2

## AI Opportunity Design

Extend Step 1:

```text
Business Problem
      ↓
Users
      ↓
Current Workflow
      ↓
AI Capabilities Required
      ↓
Modalities
      ↓
Proposed AI-enabled Workflow
      ↓
Expected Business Outcome
```

Require explicit answers:

**Why AI?**

**Why GenAI?**

**Why not conventional software, automation or traditional ML?**

**What evidence would demonstrate that the idea is more than a good demo?**

---

# Class 3 — DESIGN

## From models to agents and AI systems

### Objective

Understand the major components surrounding an AI model and develop enough architectural intuition to evaluate an AI solution proposed by internal teams or vendors.

The student does **not** need to become an architect.

They should be able to ask:

> **"What kind of system are we actually building?"**

### Concepts

## 1. Model ≠ AI System

```text
MODEL

What intelligence/capability
does AI provide?


          vs.


AI SYSTEM

How do we make that capability
useful, reliable, controlled
and connected to our business?
```

## 2. Context & Context Engineering

> **The model provides general capability. Context tells it what matters for this specific task.**

Context may include:

* Instructions
* User information
* Conversation/history
* Organizational knowledge
* Documents
* Business rules
* Examples
* Current state
* Tools
* Data

Introduce:

* Prompt engineering
* Context engineering
* Context windows
* Enterprise knowledge
* Embeddings
* Semantic search
* RAG
* Memory

Important distinction:

> **Prompt engineering:** How do I ask the model?

> **Context engineering:** What information, instructions, tools, state and knowledge should the system make available so the model can perform the task?

## 3. Tools

A model can tell you what to do.

A model connected to tools can potentially **do it**.

```text
"Your flight was cancelled."

             vs.

Find alternatives
      ↓
Check policies
      ↓
Call booking API
      ↓
Rebook
      ↓
Update calendar
      ↓
Notify traveler
```

Tools connect AI to:

**APIs | Databases | CRM | ERP | Search | Email | Calendar | Internal Systems**

## 4. Bot vs Assistant vs Workflow vs Agent

### Bot

Typically constrained by predefined conversational behavior.

### Assistant / Copilot

AI assists a human who remains responsible for the action.

### AI Workflow

The organization primarily defines the sequence.

```text
Input
 ↓
AI
 ↓
Business Rule
 ↓
API
 ↓
AI
 ↓
Human Approval
```

### Agent

The objective is defined, while the AI has some autonomy to determine the next action.

```text
GOAL
 ↓
AGENT
 ↓
Decide
 ↓
Act / Use Tool
 ↓
Observe
 ↓
Decide Again
 ↓
Result
```

The executive question:

> **Who determines the next action—the predefined process or the AI?**

## 5. Agentic Systems

An agentic system can combine:

* models;
* context;
* knowledge;
* memory;
* tools;
* workflows;
* one or multiple agents;
* enterprise systems;
* humans.

Multi-agent architectures can be introduced briefly, with the warning:

> **More agents do not automatically mean a better system.**

## 6. Autonomy is a spectrum

```text
LOW AUTONOMY                               HIGH AUTONOMY

Automation → Bot → Assistant → Copilot → Workflow → Agent
```

The important lesson:

> **Maximum autonomy should not be the goal. Appropriate autonomy should be.**

## 7. AI Harness

Introduce the harness as the surrounding engineering environment that makes model intelligence useful and controllable.

```text
                  AI HARNESS

┌──────────────────────────────────────────┐
│                                          │
│ Instructions / Context                   │
│                                          │
│ Knowledge / RAG / Memory                 │
│                                          │
│              MODEL                       │
│                                          │
│ Tools / APIs                             │
│                                          │
│ Workflow / Orchestration                 │
│                                          │
│ Permissions / Guardrails                 │
│                                          │
│ Evaluation / Observability               │
│                                          │
└──────────────────────────────────────────┘
```

Executive takeaway:

> **The model is only one architectural decision. Reliability, differentiation and business value often come from the system around it.**

## 8. Human-in-the-loop

Introduce patterns such as:

```text
AI → HUMAN → ACTION
     approves


HUMAN → AI → HUMAN
       copilot


AI → ACTION
      ↓
HUMAN monitors
```

Where humans remain involved is a **business, risk and governance decision**, not simply a technical choice.

## 9. Complete mental model

```text
                    BUSINESS GOAL
                          │
                          ▼
                         USER
                          │
                          ▼
                     AI SYSTEM
                          │
        ┌─────────────────┼─────────────────┐
        │                 │                 │
     CONTEXT            MODEL          ORCHESTRATION
        │                                    │
 ┌──────┼──────┐                         WORKFLOW
 │      │      │                             │
Data   RAG   Memory                         AGENT
                                               │
                                     ┌─────────┼─────────┐
                                     │         │         │
                                   Tools     APIs     Systems
                                               │
                                             ACTION
                                               │
                                        Human Oversight

       Evals • Guardrails • Security • Observability
```

### Industry cases

Revisit **Morgan Stanley**, now through an architectural lens rather than a capability lens.

Then use an agentic customer-service example such as **KPN** to discuss the transition from assistant to agent and the importance of processes, tools and human intervention.

### Discussion — AI Architecture Committee

Present:

> "We want an AI agent to automate customer service."

The class becomes the executive committee.

Questions they should discover:

* What does it need to know?
* Where does that knowledge come from?
* What systems does it access?
* What actions can it perform?
* What permissions does it have?
* Is an agent actually necessary?
* Could a workflow be safer?
* What happens when the AI is wrong?
* Where does a human intervene?
* How do we evaluate it?
* How do we monitor it?

### Individual Project — Step 3

## Conceptual AI System

Students design:

```text
BUSINESS OBJECTIVE
       ↓
USER
       ↓
AI CAPABILITIES
       ↓
CONTEXT / KNOWLEDGE
       ↓
MODEL
       ↓
WORKFLOW / AGENT
       ↓
TOOLS & SYSTEMS
       ↓
ACTIONS
       ↓
HUMAN OVERSIGHT
       ↓
BUSINESS OUTCOME
```

And explicitly answer:

1. What does the AI need to **know**?
2. What does the AI need to **do**?
3. What is predefined vs dynamically decided?
4. How much autonomy should it have?
5. What happens when it is wrong?
6. What surrounds the model to make the solution reliable?

---

# Class 4 — LEAD

## From AI opportunity to organizational value

### Objective

Develop executive judgment for selecting, funding, evaluating, governing and scaling AI initiatives.

The central shift is:

```text
"Can we build it?"

        ↓

"Should we build it?"

        ↓

"How do we know it creates value?"
```

### Concepts

## 1. AI initiative lifecycle

```text
Opportunity
    ↓
Hypothesis
    ↓
Prototype
    ↓
Evaluation
    ↓
Pilot
    ↓
Production
    ↓
Scale
    ↓
Monitoring
    ↓
Continuous Improvement
```

Discuss differences between:

* Experiment
* PoC
* Prototype
* MVP
* Pilot
* Production
* Scale

## 2. Evaluation

AI changes how quality must be evaluated.

Cover intuitively:

* Task success
* Quality
* Accuracy
* Reliability
* Hallucination/error rate
* Human evaluation
* AI/automated evaluation
* Business KPIs
* Production monitoring

Important distinction:

> **Technical AI quality and business success are related, but they are not the same metric.**

## 3. Risk & governance

* Privacy
* Security
* Data governance
* Permissions
* Hallucinations
* Bias
* Regulatory considerations
* Auditability
* Human oversight
* Guardrails
* Accountability

## 4. Economics

Executives should understand:

```text
AI VALUE

Revenue created
+ Cost reduced
+ Time saved
+ Quality improved
+ Risk reduced

             vs.

AI COST

Models
+ Infrastructure
+ Integration
+ Engineering
+ Data
+ Evaluation
+ Monitoring
+ Governance
+ Change Management
```

## 5. Build vs Buy vs Partner

Ask:

* Is this capability strategic?
* Is differentiation important?
* Is a commodity product already available?
* How much customization is necessary?
* What data/integration is required?
* What creates defensibility?
* What creates vendor dependency?

## 6. Prioritization

Use:

```text
                       BUSINESS VALUE
                            HIGH
                             ↑
                             │
        PRIORITIZE           │       STRATEGIC BET
                             │
                             │
LOW EFFORT ──────────────────┼──────────────── HIGH EFFORT
                             │
        QUICK WIN            │       QUESTION / DEFER
                             │
                             ↓
                            LOW
```

Add other dimensions:

**Value | Feasibility | Risk | Data readiness | Time-to-value | Strategic importance**

## 7. Adoption and organizational change

AI implementation isn't purely technical.

Discuss:

* Workflow redesign
* User adoption
* Trust
* Training
* New responsibilities
* Human + AI collaboration
* Organizational capabilities
* Leadership and incentives

### Industry cases

Use a scaled enterprise example such as **ING** to discuss moving from experiments to organizational capability.

Return briefly to **Morgan Stanley** for evaluation and governance.

Also introduce an intentionally poor fictional AI proposal to reinforce:

> **Knowing when not to use AI is part of AI literacy.**

### Discussion — AI Investment Committee

Give teams several hypothetical proposals and a limited investment budget.

Examples:

* Enterprise knowledge assistant
* Autonomous customer-service agent
* Industrial maintenance copilot
* AI-generated HR forms

Instead of simply asking *“Which one wins?”*, require them to identify what evidence and questions they need before making an investment decision.

Evaluate proposals through:

```text
VALUE
  ↓
FEASIBILITY
  ↓
DATA
  ↓
RISK
  ↓
INTEGRATION
  ↓
EVALUATION
  ↓
ADOPTION
  ↓
ECONOMICS
```

### Individual Project — Step 4

## Executive AI Initiative Proposal

Final deliverable:

```text
1. Business Problem / Opportunity

2. Target Users

3. Current Process

4. Proposed AI-enabled Process

5. Why AI / Why GenAI

6. AI Capabilities Required

7. Data / Context / Knowledge Required

8. Conceptual AI System

9. Workflow / Agent / Human Roles

10. Autonomy & Human Oversight

11. Risks & Guardrails

12. Evaluation & Success Metrics

13. Prototype / Pilot

14. Build / Buy Considerations

15. Expected Business Impact / ROI

16. Next Steps
```

### Final presentation

Each participant gives a short executive pitch.

The expected narrative is not:

> *“I want to implement an AI agent using model X.”*

It should be:

> **“We have this business problem. AI changes what is possible in this way. This is the capability and system we need. These are the main risks and assumptions. This is how we propose testing them. These are the metrics that will tell us whether the initiative creates value.”**

---

# 3. Individual Project Storyline

The project should feel like **one artifact progressively improved**, not four assignments.

```text
CLASS 1 — UNDERSTAND

Business Problem
      ↓
AI Opportunity Hypothesis


CLASS 2 — IMAGINE

Business Problem
      ↓
AI Capabilities
      ↓
AI-enabled Workflow
      ↓
Expected Value


CLASS 3 — DESIGN

Opportunity
      ↓
Context + Knowledge
      ↓
AI System
      ↓
Workflow / Agent + Tools
      ↓
Human + AI


CLASS 4 — LEAD

Solution
      ↓
Evaluation + Risk
      ↓
Pilot
      ↓
Economics
      ↓
Business Case
      ↓
Executive Proposal
```

By the end, the participant hasn't merely learned terminology. They have used each concept to progressively answer four executive questions:

> **UNDERSTAND — Why is AI different?**
> **IMAGINE — Where could it create value?**
> **DESIGN — What would we actually need to make it work?**
> **LEAD — Should we invest, and how will we know it worked?**

That, to me, is the core of **AI literacy for executives**: not knowing how to train a model, but being capable of making substantially better decisions about AI.

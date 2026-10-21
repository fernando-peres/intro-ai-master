# AI for Executives - Cross-Industry Case Library

This file consolidates cases from `i-03.md` and additional public cases from the internet. The goal is not to collect many anecdotes, but to give executives a reusable way to analyze AI initiatives across industries.

## Case Presentation Template

Use the same template for every case so participants learn to compare initiatives instead of admiring the technology.

```text
Case name:
Industry:
AI pattern:

1. Business context
   What was happening in the organization or market?

2. Problem
   What business process, decision, cost, risk, or customer experience needed improvement?

3. AI solution
   What did the AI system do? What capabilities were involved?

4. Workflow change
   How did work change for employees, customers, managers, or partners?

5. Data / context / systems
   What internal knowledge, documents, tools, APIs, or operational systems mattered?

6. Human role
   Where did humans remain responsible for judgment, review, escalation, or action?

7. Challenges and risks
   What could go wrong? Accuracy, adoption, security, regulation, integration, cost, or trust?

8. Business impact
   What measurable or plausible value was created?

9. Executive lesson
   What should a senior leader remember from this case?

10. Discussion questions
   What decisions would an executive committee need to make before scaling this?
```

## Comparison Map

| Case | Industry | Main AI Pattern | Primary Lesson |
| --- | --- | --- | --- |
| Morgan Stanley | Financial services / wealth management | Enterprise knowledge assistant, RAG, evals | GenAI changes the interface to organizational knowledge. |
| BBVA | Banking | Enterprise-wide ChatGPT deployment, custom GPTs | Adoption and value creation can be distributed across the workforce. |
| ING | Banking | Scaling GenAI across business domains | AI transformation requires scope, safety, speed, and operating model discipline. |
| Moderna | Biotech / pharma | Employee-built GPTs, clinical and legal assistants | AI can scale expert work when embedded into real business processes. |
| GitHub Copilot | Software engineering | Coding copilot | AI changes professional production, but measurement must be task-specific. |
| Ascendum | Industrial equipment / field service | Technical support assistant, retrieval over documents | The same AI pattern can support frontline industrial work. |
| Siemens Industrial Copilot | Manufacturing / industrial automation | Engineering copilot, automation-code support | GenAI is not only for office work; it can augment engineering and operations. |
| KPN | Telecommunications | Agentic customer care | Moving from answers to actions requires process redesign and human escalation. |
| Klarna | Fintech / customer service | Customer-service AI assistant | High-volume automation creates value, but also workforce, trust, and escalation questions. |
| Lowe's | Retail / home improvement | Associate and customer advisory assistant | AI can put expert advice closer to the point of need. |
| Wendy's FreshAI | Restaurants / quick-service | Voice ordering assistant | Physical-world AI must handle noise, accents, variation, latency, and brand experience. |
| Xcel Energy | Energy / utilities | AI and digital operations factory | AI value often comes from a portfolio of operational tools, not one glamorous model. |
| McDonald's AI drive-thru pilot | Restaurants / quick-service | Cautionary automation pilot | A stopped pilot can be good governance, not failure. |
| Air Canada chatbot | Airlines / customer service | Cautionary chatbot | Companies remain accountable for AI-generated customer-facing information. |

---

## 1. Morgan Stanley - AI Assistant for Financial Advisors

**Industry:** Financial services / wealth management  
**AI pattern:** Enterprise knowledge assistant, retrieval-augmented generation, meeting summarization, evaluations  
**Source:** [OpenAI case study](https://openai.com/index/morgan-stanley/)

### Business Context

Morgan Stanley's wealth management business depends on financial advisors being able to access and apply a large body of firm knowledge, research, policies, and client-relevant material.

### Problem

Advisors had to search, read, interpret, and synthesize information across many internal documents. The business problem was not "write text faster"; it was "make institutional knowledge usable at the moment of client work."

### AI Solution

Morgan Stanley built GPT-powered tools that help advisors query internal knowledge and produce drafts from client meetings. In `i-03.md`, this is used as the course's anchor case because it is easy to understand without technical background.

```text
Advisor question
      v
Enterprise knowledge
      v
Retrieval + LLM
      v
Draft answer / summary
      v
Advisor review
```

### Workflow Change

The advisor can ask questions in natural language instead of manually navigating document repositories. Meeting notes and follow-up drafts can be produced faster, while the advisor remains responsible for client judgment and final communication.

### Data / Context / Systems

The critical asset is Morgan Stanley's internal knowledge base, not just the model. The case also introduces RAG, permissions, evaluations, and human-in-the-loop review.

### Human Role

The advisor remains central. The AI provides drafts, summaries, and knowledge access; humans review, decide, and communicate with clients.

### Challenges and Risks

- Accuracy and hallucination in a regulated environment.
- Permissioning and access control across internal knowledge.
- Advisor trust and adoption.
- Evaluation of retrieval, summarization, translation, and answer quality.

### Business Impact

OpenAI reports that more than 98% of Morgan Stanley advisor teams use the assistant. The broader lesson is that adoption at this scale requires integration into the work, not a side experiment.

### Executive Lesson

GenAI is most powerful when it changes the interface between people and organizational knowledge.

### Discussion Questions

- Why is this different from search?
- What should be evaluated before deployment?
- Which internal knowledge assets would matter in your organization?
- Where must human judgment remain non-negotiable?

---

## 2. BBVA - AI in the Hands of Every Team

**Industry:** Banking  
**AI pattern:** Enterprise ChatGPT deployment, custom GPTs, workforce enablement  
**Sources:** [OpenAI BBVA collaboration](https://openai.com/index/bbva-collaboration-expansion/), [BBVA adoption article](https://www.bbva.com/en/innovation/bbva-sparks-a-wave-of-innovation-among-its-employees-with-the-deployment-of-chatgpt-enterprise/)

### Business Context

BBVA is a large global bank with many functions, markets, and specialized workflows. Instead of treating GenAI only as a central technology project, BBVA gave employees secure access and encouraged teams to find use cases.

### Problem

Central AI teams cannot discover every valuable workflow. The bank needed a way to safely unlock productivity and innovation across many domains.

### AI Solution

BBVA deployed ChatGPT Enterprise to employees and supported creation of custom GPTs for tasks such as financial data analysis, legal support, customer insight, documentation, and internal productivity.

### Workflow Change

Employees could build or use task-specific assistants inside their own work. This changes the innovation model from "IT delivers all AI tools" to "business experts identify repeatable AI-enabled workflows."

### Data / Context / Systems

Secure enterprise access, usage governance, task-specific instructions, and organizational data boundaries are more important than a one-off prompt.

### Human Role

Domain experts remain responsible for judgment. AI helps prepare, summarize, analyze, or draft; humans validate and own decisions.

### Challenges and Risks

- Preventing uncontrolled tool sprawl.
- Ensuring security and privacy.
- Measuring actual value rather than enthusiasm.
- Training employees to use AI responsibly.
- Deciding which local GPTs should become enterprise-grade systems.

### Business Impact

BBVA reported strong early adoption among initial licensed users and later announced a much broader rollout. This makes the case useful for discussing bottom-up innovation under executive governance.

### Executive Lesson

AI transformation is not only about building central applications; it is also about safely increasing the capability of thousands of employees.

### Discussion Questions

- Which teams should be allowed to create their own AI assistants?
- How would you separate experimentation from production?
- What governance is needed without killing adoption?

---

## 3. ING - Scaling GenAI in Banking

**Industry:** Banking  
**AI pattern:** Enterprise scaling across customer service, engineering, KYC, compliance, and operations  
**Sources:** [McKinsey interview with ING](https://www.mckinsey.com/industries/financial-services/our-insights/deploying-ai-at-speed-and-scale-talking-with-ings-marnix-van-stiphout), [McKinsey ING case](https://www.mckinsey.com/industries/financial-services/how-we-help-clients/banking-on-innovation-how-ing-uses-generative-ai-to-put-people-first)

### Business Context

ING is a useful case for moving beyond pilots. The bank describes GenAI as part of a wider transformation effort, not a single chatbot.

### Problem

Banks face large volumes of service, compliance, engineering, risk, and operations work. They also operate under strict safety, regulatory, and customer-trust constraints.

### AI Solution

ING focused on several high-value areas, including customer service, software engineering, KYC, and compliance. The emphasis is on responsible scaling: choosing domains, building technical foundations, and developing capabilities across support functions.

### Workflow Change

AI becomes part of repeated work across functions, not an isolated innovation lab. Teams need new ways to prioritize, build, test, deploy, and govern use cases.

### Data / Context / Systems

Banking AI depends on secure customer data, compliance rules, internal processes, auditability, and integration with existing systems.

### Human Role

Humans stay responsible for risk, compliance, approvals, customer exceptions, and model governance.

### Challenges and Risks

- Managing risk while moving quickly.
- Reusable platforms versus fragmented experiments.
- Regulatory and compliance constraints.
- Business ownership of use cases.
- Measuring value at scale.

### Business Impact

The case is best used to discuss organizational maturity: scope, safety, speed, talent, and operating model.

### Executive Lesson

The hard question changes from "Can AI do this?" to "Can our organization repeatedly turn AI opportunities into reliable production systems?"

### Discussion Questions

- What should be centralized and what should be owned by business units?
- How should a bank prioritize AI use cases?
- What does "safe enough to scale" mean?

---

## 4. Moderna - GPTs Across Biotech Workflows

**Industry:** Biotech / pharmaceuticals  
**AI pattern:** Employee-created GPTs, data analysis assistant, contract and policy assistants  
**Source:** [OpenAI Moderna case study](https://openai.com/index/moderna/)

### Business Context

Moderna has ambitious product-development goals and a lean operating model. The company adopted ChatGPT Enterprise broadly and encouraged employees to create GPTs for specific workflows.

### Problem

Biotech work involves large evidence packs, clinical data, regulatory responses, legal documents, manufacturing knowledge, and scientific communication. Expert teams need to move quickly without compromising safety or quality.

### AI Solution

Moderna created hundreds of internal GPTs. Examples include Dose ID for clinical data analysis support, Contract Companion for contract summaries, and policy assistants for internal knowledge.

### Workflow Change

AI becomes a reusable assistant for expert teams. Instead of only automating low-skill work, Moderna applies AI to help skilled employees process evidence, generate drafts, visualize data, and compare options.

### Data / Context / Systems

The value depends on controlled use of scientific data, clinical context, legal documents, and internal policies. Security and privacy are central because the domain is sensitive.

### Human Role

Clinical and legal experts remain accountable. The AI assists analysis and drafting; humans review, interpret, and decide.

### Challenges and Risks

- Safety in clinical decision support.
- Data privacy and IP protection.
- Validating outputs in regulated workflows.
- Avoiding overreliance on plausible analysis.
- Standardizing quality across many employee-built GPTs.

### Business Impact

OpenAI reports that Moderna had 750 GPTs across the company within two months of ChatGPT Enterprise adoption, with 40% of weekly active users creating GPTs.

### Executive Lesson

The bigger opportunity may be redesigning expert workflows, not simply automating routine back-office tasks.

### Discussion Questions

- Which expert workflows in your company involve large evidence packs?
- How would you validate AI-generated analysis?
- When should a custom GPT remain local, and when should it become an enterprise product?

---

## 5. GitHub Copilot - AI Pair Programmer

**Industry:** Software engineering  
**AI pattern:** Coding copilot  
**Sources:** [GitHub research summary](https://github.blog/news-insights/research/research-quantifying-github-copilots-impact-on-developer-productivity-and-happiness/), [research paper](https://arxiv.org/abs/2302.06590)

### Business Context

Software development is expensive, talent-constrained, and central to digital transformation. Coding assistants are among the clearest examples of AI augmenting professional work.

### Problem

Developers spend time writing boilerplate, looking up syntax, translating intent into code, and iterating through implementation details.

### AI Solution

GitHub Copilot suggests code, tests, functions, and completions inside the developer environment.

```text
Developer intent
      v
AI code suggestion
      v
Developer reviews / edits
      v
Working software
```

### Workflow Change

The developer moves from writing every line from scratch to supervising, editing, and integrating AI-generated code.

### Data / Context / Systems

The development environment, repository context, programming language, tests, documentation, and code review process all matter.

### Human Role

The developer remains responsible for correctness, maintainability, security, and integration with the larger system.

### Challenges and Risks

- Generated code may be wrong, insecure, or hard to maintain.
- Productivity gains vary by task and developer.
- Faster code generation can create review burden.
- Measurement must go beyond "lines of code."

### Business Impact

In a controlled experiment with 95 professional developers, the Copilot group completed a specific programming task 55.8% faster on average. This is useful evidence, but it should not be generalized to all software work.

### Executive Lesson

AI productivity must be measured in real workflows. A strong result on one task is not a universal productivity multiplier.

### Discussion Questions

- Which tasks should be measured before claiming productivity gains?
- Does AI shift the bottleneck from writing to review?
- How should engineering leaders update quality controls?

---

## 6. Ascendum - Field-Service AI for Heavy Equipment

**Industry:** Industrial equipment / field service  
**AI pattern:** Technical support assistant, retrieval over service documentation  
**Sources:** [McKinsey case study](https://www.mckinsey.com/capabilities/growth-marketing-and-sales/how-we-help-clients/adding-a-powerful-new-tool-to-the-field-mechanics-toolbelt-ai), [McKinsey field-service article](https://www.mckinsey.com/capabilities/operations/our-insights/from-pilot-to-profit-scaling-gen-ai-in-aftermarket-and-field-services)

### Business Context

Ascendum is a Portugal-based heavy-equipment business operating across multiple countries. Field technicians and support agents need to diagnose complex equipment issues quickly.

### Problem

Technical knowledge was spread across large volumes of documentation. Diagnosis and resolution could be slowed by the time needed to find the right information.

### AI Solution

Ascendum worked with McKinsey and Salesforce on GenAI capabilities embedded into field-service workflows, helping agents diagnose and resolve customer issues faster.

```text
Equipment problem
      v
Retrieve technical documents
      v
Reason over symptoms and manuals
      v
Recommend next action
      v
Technician decides and acts
```

### Workflow Change

The technician or support agent can ask questions in natural language and receive grounded guidance based on technical documents.

### Data / Context / Systems

Technical manuals, service records, equipment documentation, Salesforce Service Cloud, and field-service processes are central.

### Human Role

Technicians remain responsible for diagnosis, physical work, safety, and customer communication.

### Challenges and Risks

- Document quality and completeness.
- Retrieval accuracy.
- Safety-critical recommendations.
- Adoption by experienced technicians.
- Integration into existing service workflows.

### Business Impact

McKinsey reports that the work followed an evaluation of roughly 30 possible GenAI use cases, making it a good example of prioritization before building.

### Executive Lesson

GenAI is not only a knowledge-worker technology; it can bring expert knowledge closer to frontline operations.

### Discussion Questions

- What knowledge does your frontline workforce struggle to access?
- Which recommendations would require mandatory human review?
- How would you test the system before using it in the field?

---

## 7. Siemens Industrial Copilot - Engineering and Operations Support

**Industry:** Manufacturing / industrial automation  
**AI pattern:** Industrial copilot, automation-code generation, operational support  
**Source:** [Siemens press release](https://press.siemens.com/global/en/pressrelease/siemens-and-microsoft-scale-industrial-ai)

### Business Context

Industrial companies face engineering complexity, labor shortages, and pressure to improve productivity. Siemens and Microsoft positioned Industrial Copilot as a way to bring GenAI into industrial engineering and operations.

### Problem

Engineers and operators often work with complex automation systems, technical documentation, and code-like industrial configuration tasks.

### AI Solution

Siemens Industrial Copilot uses GenAI to support industrial work, including automation-code generation and operational assistance. Siemens reported in 2024 that more than 100 companies were using the Industrial Copilot.

### Workflow Change

Engineers can move from manually writing or searching through automation logic toward collaborating with a copilot that drafts, explains, or supports engineering tasks.

### Data / Context / Systems

Industrial software, automation systems, equipment context, engineering documentation, and Microsoft AI infrastructure matter.

### Human Role

Engineers remain responsible for validating automation logic and ensuring safety, reliability, and compliance in production environments.

### Challenges and Risks

- Safety and reliability in physical systems.
- Integration with legacy industrial technology.
- Trust from engineers and operators.
- Cybersecurity and access control.
- Preventing generated code from being deployed without validation.

### Business Impact

The case is useful because it breaks the mental shortcut "GenAI equals office text generation." The same underlying capabilities apply to engineering work.

### Executive Lesson

Executives should think in capabilities, not chatbots: generate, explain, retrieve, reason, recommend, and assist action.

### Discussion Questions

- What industrial work contains "code-like" logic?
- How should validation differ when AI affects physical operations?
- What is the right balance between speed and safety?

---

## 8. KPN - Agentic AI for Customer Care

**Industry:** Telecommunications  
**AI pattern:** Agentic customer care, process redesign, human escalation  
**Source:** [McKinsey KPN case study](https://www.mckinsey.com/industries/technology-media-and-telecommunications/how-we-help-clients/how-kpn-is-building-an-agentic-ai-engine-for-customer-care)

### Business Context

KPN, a Dutch telecommunications company, used customer care as a starting point for building agentic capabilities.

### Problem

Customer care involves many recurring but context-dependent requests. Traditional chatbots can answer some questions, but real customer service often requires actions across systems.

### AI Solution

KPN analyzed large volumes of anonymized call and chat interactions, identified high-impact customer needs, mapped processes, and evaluated use cases by value, complexity, and feasibility.

```text
Customer goal
      v
Agent understands need
      v
Checks knowledge / customer context
      v
Uses tools or systems
      v
Acts or escalates
```

### Workflow Change

The system moves from "answer a question" toward "resolve a customer need." This requires process design, tool access, escalation rules, and human oversight.

### Data / Context / Systems

Customer conversations, process maps, product data, CRM, billing, troubleshooting systems, and escalation workflows matter.

### Human Role

Humans remain involved in sensitive, ambiguous, high-risk, or emotionally complex customer situations.

### Challenges and Risks

- Deciding which actions an agent may take.
- Handling edge cases and vulnerable customers.
- Integrating with telecom systems.
- Measuring customer satisfaction and resolution quality.
- Avoiding automation that frustrates customers.

### Business Impact

The case is valuable because it shows a transition from copilots to agents, and from AI demo to AI operating model.

### Executive Lesson

An AI agent is not a chatbot with a better model. It is a redesigned process with tools, permissions, escalation, measurement, and accountability.

### Discussion Questions

- What actions should an AI agent be allowed to take?
- Which customer situations must go to a human?
- What would you need to know before approving a EUR 1M agentic customer-care program?

---

## 9. Klarna - Customer-Service AI Assistant

**Industry:** Fintech / customer service  
**AI pattern:** Customer-service assistant, multilingual automation, action-oriented support  
**Source:** [OpenAI Klarna case study](https://openai.com/index/klarna/)

### Business Context

Klarna serves millions of consumers across markets. Customer service has high volume, multilingual demand, and recurring questions about payments, refunds, returns, and account support.

### Problem

Scaling customer support with only human agents is costly and difficult across languages and markets.

### AI Solution

Klarna launched an OpenAI-powered AI assistant capable of handling customer-service tasks, including questions and some action-oriented workflows.

### Workflow Change

Many customer interactions move from human-first service to AI-first service with human escalation for unresolved or sensitive cases.

### Data / Context / Systems

Customer account state, transaction data, refund and return policies, language handling, support systems, and escalation channels matter.

### Human Role

Humans remain needed for escalation, exceptions, trust recovery, sensitive cases, and service quality improvement.

### Challenges and Risks

- Customer frustration if escalation is difficult.
- Handling edge cases fairly.
- Workforce implications.
- Monitoring quality across languages.
- Avoiding overclaiming "replacement" when some interactions still need humans.

### Business Impact

OpenAI reported that the assistant handled 2.3 million conversations in its first month, about two-thirds of Klarna's customer-service chats, and performed work Klarna compared to 700 full-time agents.

### Executive Lesson

High-volume automation can produce visible value quickly, but service design, escalation, and workforce strategy determine whether customers experience it as progress.

### Discussion Questions

- What should be automated first in customer service?
- How would you measure customer trust, not just cost reduction?
- What is the ethical and organizational response to labor substitution?

---

## 10. Lowe's - Project Expertise at the Point of Need

**Industry:** Retail / home improvement  
**AI pattern:** Customer and associate assistant, product and project advice  
**Source:** [OpenAI Lowe's case study](https://openai.com/index/lowes/)

### Business Context

Home improvement customers often need guidance, not just products. Store associates need fast access to product knowledge, project advice, and store-specific context.

### Problem

Expertise is unevenly distributed. Customers may not know what materials, steps, or tools they need, and associates may need help answering complex project questions.

### AI Solution

Lowe's uses OpenAI to support Mylow and Mylow Companion, bringing project expertise into customer-facing and associate-facing experiences.

### Workflow Change

The shopping or store-associate interaction becomes more advisory. AI helps interpret the project goal and provide relevant guidance closer to the moment of need.

### Data / Context / Systems

Product catalog, store inventory, project instructions, customer context, mobile app surfaces, and associate tools are all important.

### Human Role

Associates remain responsible for customer relationship, practical judgment, safety advice, and in-store execution.

### Challenges and Risks

- Avoiding incorrect DIY or safety guidance.
- Integrating inventory and product availability.
- Maintaining brand trust.
- Supporting associates rather than replacing their judgment.
- Ensuring advice is appropriate for local codes and conditions.

### Business Impact

The case is useful for executives because it connects AI to revenue, service quality, associate enablement, and customer confidence.

### Executive Lesson

Retail AI should not be only a chatbot; it should reduce uncertainty in a customer's job-to-be-done.

### Discussion Questions

- What expertise do customers need before they buy?
- Which advice requires disclaimers or human validation?
- How would you connect AI guidance to inventory and conversion?

---

## 11. Wendy's FreshAI - Voice AI in the Drive-Thru

**Industry:** Restaurants / quick-service  
**AI pattern:** Voice ordering assistant in a physical operating environment  
**Sources:** [Wendy's blog](https://www.wendys.com/blog/drive-thru-innovation-wendys-freshai), [Google Cloud blog](https://cloud.google.com/transform/wendys-generative-ai-drive-thru-reinvention-worker-freedom), [Wendy's / Google Cloud announcement PDF](https://s1.q4cdn.com/202642389/files/doc_news/Wendys-Taps-Google-Cloud-to-Revolutionize-the-Drive-Thru-Experience-with-Artificial-Intelligence-2023.pdf)

### Business Context

Drive-thru is a critical channel for quick-service restaurants. Order speed, accuracy, labor availability, and customer experience directly affect operations.

### Problem

Drive-thru orders are messy: background noise, accents, interruptions, menu modifications, combo logic, and pressure to keep the line moving.

### AI Solution

Wendy's FreshAI uses Google Cloud generative AI technology to automate or assist drive-thru ordering.

### Workflow Change

AI takes or supports the order, while restaurant staff can focus on food preparation, fulfillment, and customer exceptions.

### Data / Context / Systems

Menu data, point-of-sale integration, voice recognition, ordering logic, store operations, and real-time context matter.

### Human Role

Employees remain necessary for exceptions, corrections, fulfillment, customer recovery, and operations.

### Challenges and Risks

- Speech recognition in noisy environments.
- Order accuracy and latency.
- Customer acceptance.
- Handling jokes, ambiguity, and unusual requests.
- Brand impact when the AI interaction feels awkward.

### Business Impact

The case is a strong reminder that AI in the physical world is harder than a polished text demo.

### Executive Lesson

When AI touches operations, performance must be evaluated in the messy real environment, not only in a lab.

### Discussion Questions

- What real-world variability could break this system?
- When should a human take over?
- How would you measure success: speed, accuracy, labor, satisfaction, or all of them?

---

## 12. Xcel Energy - AI and Digital Operations for Utilities

**Industry:** Energy / utilities  
**AI pattern:** Digital operations factory, AI and automation portfolio  
**Source:** [McKinsey Xcel Energy case study](https://www.mckinsey.com/capabilities/tech-and-ai/how-we-help-clients/rewired-in-action/xcel-energy-driving-towards-net-zero-with-the-power-of-digital)

### Business Context

Utilities must improve reliability, safety, cost performance, regulatory transparency, and decarbonization. These goals depend on complex operational systems rather than one isolated application.

### Problem

Xcel Energy needed to improve asset and plant performance while advancing toward cleaner energy goals.

### AI Solution

The work centered on AI, automation, and digital tools delivered through a Digital Operations Factory. The goal was to build user-centered tools and analytics quickly across business needs.

### Workflow Change

Instead of treating AI as one project, the organization builds a repeatable delivery capability for operational tools.

### Data / Context / Systems

Plant data, asset data, operational workflows, regulatory requirements, safety processes, and cross-functional teams matter.

### Human Role

Operators, engineers, and managers remain responsible for operational decisions, safety, and regulatory accountability.

### Challenges and Risks

- Change management in operational environments.
- Data quality from legacy systems.
- Safety and reliability.
- Cross-functional delivery discipline.
- Scaling beyond first wins.

### Business Impact

The case is valuable because it reframes AI value as a portfolio of operational improvements rather than one dramatic GenAI use case.

### Executive Lesson

In operational industries, the AI capability to build, deploy, and improve many small tools may matter more than one flagship AI application.

### Discussion Questions

- What operational decisions most affect cost, safety, or reliability?
- How would you organize a digital operations factory?
- Which workflows should be redesigned before adding AI?

---

## 13. McDonald's AI Drive-Thru Pilot - Cautionary Case

**Industry:** Restaurants / quick-service  
**AI pattern:** Voice ordering automation pilot  
**Source:** [AP News](https://apnews.com/article/bebc898363f2d550e1a0cd3c682fa234)

### Business Context

McDonald's tested AI-powered drive-thru ordering with IBM at select restaurants, while the broader quick-service industry explored automation for labor, speed, and accuracy.

### Problem

Drive-thru ordering is high-volume and operationally important, but it is also noisy, variable, and customer-facing.

### AI Solution

The pilot used automated voice ordering technology in drive-thru lanes.

### Workflow Change

The intended change was to automate order capture and reduce employee load. In practice, the company ended the IBM test while continuing to believe voice ordering could be part of the future.

### Data / Context / Systems

Voice input, point-of-sale systems, menu logic, restaurant operations, and store-level variation mattered.

### Human Role

Humans were needed for correction, escalation, fulfillment, and customer recovery.

### Challenges and Risks

- Misheard orders and customer frustration.
- Viral failures and reputational risk.
- Accuracy under real-world noise.
- Franchise implementation complexity.
- Distinguishing "bad idea" from "not ready yet."

### Business Impact

McDonald's ended the IBM automated-ordering test in 2024. This should be taught not as "AI failed forever," but as an example of pilot discipline and operational realism.

### Executive Lesson

Stopping or redesigning an AI pilot can be good governance. The executive question is not "Did the demo work?" but "Did the system meet operational thresholds in the real environment?"

### Discussion Questions

- What criteria should decide whether to stop, continue, or redesign a pilot?
- What would you test before scaling to thousands of locations?
- How do public failures change the risk calculation?

---

## 14. Air Canada Chatbot - Cautionary Case on Accountability

**Industry:** Airlines / customer service  
**AI pattern:** Customer-facing chatbot, misinformation risk  
**Source:** [Moffatt v. Air Canada, 2024 BCCRT 149](https://www.canlii.org/en/bc/bccrt/doc/2024/2024bccrt149/2024bccrt149.html)

### Business Context

Airlines use digital self-service to reduce support burden and answer customer questions at scale.

### Problem

Customers rely on information provided by official company channels. If a chatbot provides incorrect policy information, the customer may make financial decisions based on it.

### AI Solution

Air Canada had a website chatbot that answered questions about policies, including bereavement fares.

### Workflow Change

The chatbot became part of the customer-service and policy-communication workflow.

### Data / Context / Systems

The relevant context was current fare policy, support content, and customer-facing policy pages. The key failure was not only a model issue; it was a governance and accountability issue.

### Human Role

Humans needed to ensure the chatbot was accurate, monitored, updated, and aligned with official policies.

### Challenges and Risks

- Customers may reasonably rely on chatbot answers.
- The company remains responsible for official digital channels.
- Policy changes require chatbot updates and validation.
- Linking to correct policy pages does not necessarily cure misleading generated answers.

### Business Impact

The British Columbia Civil Resolution Tribunal found Air Canada liable for negligent misrepresentation after its chatbot gave incorrect bereavement-fare information.

### Executive Lesson

Customer-facing AI is not "just a bot." It is a company representative and must be governed like one.

### Discussion Questions

- Which customer-facing answers create legal or financial commitments?
- Should bots answer policy questions directly or retrieve approved text?
- How would legal, compliance, CX, and product share responsibility?

---

## Teaching Patterns Across Cases

### Pattern 1: Knowledge Access

Cases: Morgan Stanley, Ascendum, Lowe's, Moderna, BBVA

```text
User question
   v
Internal / domain knowledge
   v
Retrieval + LLM
   v
Grounded answer or draft
   v
Human review
```

**Executive lesson:** The strategic asset is often the organization's knowledge, not only the model.

### Pattern 2: Professional Copilot

Cases: GitHub Copilot, Siemens Industrial Copilot, Moderna Dose ID

```text
Expert intent
   v
AI draft / analysis / code
   v
Expert review
   v
Integrated output
```

**Executive lesson:** AI changes expert work by shifting effort from creation to direction, review, and integration.

### Pattern 3: Customer-Service Automation

Cases: Klarna, KPN, Wendy's, McDonald's, Air Canada

```text
Customer need
   v
AI understands / answers / acts
   v
Escalation or completion
   v
Monitoring and improvement
```

**Executive lesson:** The system must be designed around customer outcomes, not containment metrics alone.

### Pattern 4: Enterprise Scaling

Cases: BBVA, ING, Moderna, Xcel Energy

```text
Use-case portfolio
   v
Shared platform and governance
   v
Business-owned workflows
   v
Measurement and iteration
```

**Executive lesson:** Scaling AI is an operating-model problem as much as a technology problem.

### Pattern 5: Caution and Accountability

Cases: McDonald's, Air Canada, plus any low-value fictional proposal

```text
AI idea
   v
Pilot / controlled deployment
   v
Real-world performance check
   v
Scale, redesign, or stop
```

**Executive lesson:** Knowing when not to use AI, or when not to scale yet, is an executive AI capability.

## Suggested Class Use

For a 2-hour executive class, avoid racing through all cases. Use 2 or 3 deeply.

### Class 1 - What Changed with GenAI?

Use Morgan Stanley as the core case.

Focus:
- LLMs as powerful but incomplete components.
- Organizational knowledge as the real asset.
- Human oversight and evaluation.

### Class 2 - What Can AI Do?

Use GitHub Copilot, Ascendum, and Siemens.

Focus:
- Capabilities transfer across industries.
- GenAI is not only text generation.
- The same pattern can support software, industrial service, and engineering.

### Class 3 - From LLM to AI System

Use Morgan Stanley again, plus KPN.

Focus:
- RAG, tools, agents, context, permissions, evals.
- Difference between chatbot, copilot, agent, and agentic system.

### Class 4 - From Demo to Business Transformation

Use ING, Moderna, BBVA, McDonald's, and Air Canada.

Focus:
- Portfolio prioritization.
- Governance and operating model.
- Scaling safely.
- Knowing when not to scale.

## Executive Discussion Prompts

1. Which cases are really about cost reduction, and which are about capability expansion?
2. Where is the model only a small part of the full system?
3. Which cases require the strongest human oversight?
4. Which cases could fail because of adoption rather than technology?
5. Which cases could create legal or reputational risk?
6. Which cases would you approve as a pilot, and which would you reject?
7. What would you need to measure before moving from pilot to production?
8. Which case most resembles a workflow inside your organization?

## Simple Prioritization Lens

Use this after presenting any case:

```text
Business value:
  Revenue, cost, quality, speed, risk reduction, customer experience

Feasibility:
  Data readiness, system integration, process clarity, talent, cost

Risk:
  Legal, regulatory, safety, customer trust, security, workforce impact

Adoption:
  Who changes behavior? Why would they trust it? What training is needed?

Evaluation:
  How will we know it works before and after deployment?
```

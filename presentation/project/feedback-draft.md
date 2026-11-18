## Group 1 — B2B food-distribution triage

**Members:** Fernando and Marco.

### Problem and Solution
Customer messages can wait around four hours for a response. Their assistant sorts messages and drafts replies; a human approves them. The team reported a 30-minute response time in its simulation.

### Considerations
- **Strength:** Human review remains in place for customer-facing messages.
- **Limitation:** The 48 test messages were invented, not real customer cases. The team reported two errors and described its initial score as 8/10. The prototype was shown later in the session, after the initial presentation.

### Feedback
Show the underlying system more clearly. Define the model-validation strategy, including test data and performance on unseen cases; explain how saved time creates business value.

## Group 2 — Railwayman

**Members:** Names were not clearly established in the transcript.

### Problem and Solution
Technicians search across manuals, supplier sheets and past work orders to diagnose faults. Railwayman retrieves relevant guidance and presents it to the technician, who makes the decision. The team estimated 54 minutes of information retrieval per work order and targeted 15 minutes, but had not proved that reduction with real technicians.

### Considerations
- **Strength:** The prototype showed source information, guardrails and execution traces for a safety-critical use case.
- **Limitation:** The time-saving target still needs testing with technicians and real trains.

### Feedback
Consider a voice interface for technicians working in the field, alongside the proposed photo-input feature.

## Group 3 — Company-car expense classification

**Members:** Rui, Pedro and Felipe were named when the group was introduced.

### Problem and Solution
Mobility statements record where and when a company vehicle was used, but not whether a transaction was business or personal. Rules classify transactions; an evidence-gathering step investigates flagged cases; the driver and HR confirm the result.

### Considerations
- **Strength:** The team compared rules alone with rules plus the evidence step, reporting 61% and 82% respectively. It included human review and a reversal path for mistakes.
- **Limitation:** The prototype’s evidence-gathering agent was simulated with a fixed script because the required systems were not connected. Employee-data handling and incorrect charges remain risks the team identified.

### Feedback
Start small and fast. Later, assess whether some high-confidence transactions could be pre-approved and whether further checks, such as fraud analysis, would add value.

## Group 4 — Construction paperwork

**Members:** Names were not clearly established in the transcript.

### Problem and Solution
Responding to construction-site requests requires finding the right attendance records, insurance and other documents across emails and businesses. The workflow checks what is available and drafts follow-up requests, with manager approval before sending.

### Considerations
- **Strength:** The presenter described it as an existing operational problem and demonstrated a workflow that changes its response when a worker’s attendance is confirmed.
- **Limitation:** The workflow assumes documents and confirmations are trustworthy and accessible; the team also identified wrong dates or insurance documents as risks.

### Feedback
Consider templates for the documents each client or contract requires. The response was that this would work where a contract defines those requirements.

## Group 5 — Compass mental-health guidance

**Members:** Francisco and Ali were introduced before this presentation.

### Problem and Solution
Users struggle to find current guidance across long, versioned mental-health documents. Compass answers from a curated library with citations; sensitive questions are routed to a fixed protocol rather than a generated answer.

### Considerations
- **Strength:** The design explicitly handles sensitive questions, outdated versions and insufficient evidence.
- **Limitation:** It depends on the guidance team keeping the library current and properly structured. The initial classification of sensitive questions was identified as a difficult step.

### Feedback
Add an output safeguard to catch an unsafe answer if a sensitive question gets through the initial routing.

## Group 6 — Mortgage-document checks

**Members:** The presenter’s name was not clearly established in the transcript.

### Problem and Solution
Branch staff spend substantial time checking mortgage documents before underwriting, and missing or inconsistent information creates return loops. The prototype uses AI for content checks and coded rules for formal checks, then presents findings for human approval.

### Considerations
- **Strength:** The demonstration covered policy evidence, mismatched IDs, missing pages, audit reporting and checks for malicious instructions in documents.
- **Limitation:** The presenter and instructor both described the wider lending process as much larger than this initial prototype.

### Feedback
Develop the broader process as interconnected workflows, with defined outputs and human validation at each phase.

## Group 7 — DeliveryX complaints

**Members:** Names were not clearly established in the transcript.

### Problem and Solution
Food-delivery customers wait for complaints to be resolved. The prototype classifies a complaint, checks the order and policy, and proposes a response or compensation for support review. The team targeted a reduction from nine to four minutes.

### Considerations
- **Strength:** The demonstration showed different paths for a quality complaint and a missing item, with policy sources displayed for a proposed refund.
- **Limitation:** The presenter said the prototype initially made many mistakes and needed repeated testing and improvement.

### Feedback
Run A/B tests against the current support process using real cases. Refine the policies and decide more precisely when human review is necessary.

## Group 8 — Doctors’ shift scheduling

**Members:** Paulo Cruz and Joaquim Santos were introduced before the presentation.

### Problem and Solution
Doctors coordinate availability and swaps through chat, leaving an administrator to assemble schedules manually. The prototype interprets conversational requests, asks doctors to confirm them and uses an optimization tool to produce a draft schedule for administrator approval.

### Considerations
- **Strength:** The design keeps the familiar chat-style interaction while using a separate solver for scheduling and human confirmation of interpreted requests.
- **Limitation:** It still needs robust connections to the calendars and other systems that hold the operative schedule.

### Feedback
Build reliable, independently working calendar and scheduling tools beneath the conversational layer; the LLM should not be responsible for the schedule itself.

## Group 9 — Livestock sale timing

**Members:** Beatriz and Ricardo were named before this presentation.

### Problem and Solution
Farmers use scattered spreadsheets to judge when animals reach the target weight for sale. The proposed system combines forecasting, a dashboard and conversational queries to help identify animals ready for review.

### Considerations
- **Strength:** The prototype combined a visual dashboard with quick queries that could suit farmers using a phone or tablet in the field.
- **Limitation:** The team identified scattered data and data quality as risks to the forecast; its targets had not yet been demonstrated in the proposed farm pilot.

### Feedback
Make the dashboard more proactive: surface the day’s relevant animals and suggested next steps, rather than requiring the farmer to initiate every query.

## Group 10 — Social Security medical dossiers

**Members:** Names were not clearly established in the transcript.

### Problem and Solution
Social Security doctors must review extensive medical history and reports during short fit-for-work examinations. The proposed workflow prepares an up-to-date dossier beforehand; doctors remain responsible for the decision.

### Considerations
- **Strength:** The group proposed testing examination outcomes as well as time saved, and kept the medical decision with doctors.
- **Limitation:** The presenters raised privacy, possible re-identification and legal approval as critical issues. They proposed a proof of concept because they did not yet have a baseline for the solution.

### Feedback
Break the large system into connected phases and workflows. Consider specialized existing tools where they could help prepare the dossier.

## Group 11 — MAN Service Care ticket triage

**Members:** Ricardo and Nuno were introduced before the presentation.

### Problem and Solution
Many items on the service team’s Jira incident board are questions rather than incidents. The prototype uses a knowledge base built from past tickets to answer questions before a user opens a ticket, while people review articles and subsequent triage.

### Considerations
- **Strength:** The team used 203 historical tickets to create 75 draft articles and demonstrated sourced answers, access checks, evaluation views and usage metrics.
- **Limitation:** Some articles still needed manual review, and the prototype did not yet write back to Jira.

### Feedback
Explore topic modelling and deeper analytics. Repeated questions may reveal training needs, but could also expose problems in the service or its processes.

**Feedback to all groups:** Open with the problem and its audience, explain the solution plainly, then demonstrate the prototype; keep detailed architecture available for questions.
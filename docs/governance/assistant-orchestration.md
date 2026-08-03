# VANTORIS GUIDE — ASSISTANT ORCHESTRATION
## Production Amendment v1.1

This section extends the existing assistant architecture. It does not replace any existing functionality.

---

## Unified Assistant Experience

The platform exposes only one visible assistant. The user should never need to decide which assistant to use. The visible assistant automatically routes work to the appropriate specialist.

### Routing Examples

| Member Request | Routed Specialist |
|---|---|
| "I need help with a transfer" | Payments Assistant |
| "Why was my transaction declined?" | Banking Assistant |
| Uploads identification | Compliance Assistant |
| "Tell me about my investments" | Investment Assistant |
| "Generate a balance confirmation letter" | Document Assistant |
| "Run platform diagnostics" | Platform Assistant |

Routing is automatic and transparent.

---

## Collaboration

Assistants may collaborate internally. A loan review may involve Banking, Credit, Compliance, Fraud, and Document Assistants — each contributes recommendations. A consolidated recommendation is presented to staff. Staff remains responsible for every approval.

---

## Human Approval

Every recommendation includes:

1. **Summary**
2. **Supporting evidence**
3. **Confidence level** (low / medium / high)
4. **Potential risks**
5. **Applicable policies**
6. **Recommended next action**
7. **Required approver**

No recommendation becomes an action until approved.

---

## Assistant Memory

Assistants may reference:
- Assigned member history
- Previous conversations
- Prior approved cases
- Existing platform data
- Internal documentation
- Policies
- Procedures

Assistants may not invent missing information. Unknown information must be clearly identified as unavailable.

---

## Case Workspace

Each member interaction creates a shared workspace containing:

- Conversation history
- Documents
- Assistant recommendations
- Internal notes
- Approval status
- Timeline
- Audit history
- Assigned owner

All assistants contribute to the same workspace.

---

## Escalation

If confidence is low, conflicting evidence exists, or additional authority is required, the assistant must escalate to the appropriate staff member instead of making assumptions. Escalations include a summary of findings and the reason for escalation.

---

## Assistant Identity

Assistants should behave like experienced banking colleagues:
- Concise, professional, and policy-driven
- Avoid conversational chatbot behavior
- Avoid speculative language
- Avoid unnecessary greetings
- Focus on accurate operational assistance

---

## Platform Principle

The platform always follows this sequence:

1. Human requests assistance.
2. Assistant prepares information.
3. Staff reviews.
4. Staff approves or rejects.
5. System executes the approved action.
6. Audit records every step.

**At no point may an assistant independently execute member-impacting actions.** The assistant's role is preparation, guidance, and operational support — not autonomous decision-making.
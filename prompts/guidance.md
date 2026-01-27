# Agent Guidance

How to use concept-rag effectively.

---

## The Activity → Skill → Tool Model

```
User Goal → Activity (problem domain) → Skill (solution domain) → Tools
```

1. **Identify the activity** — What is the user trying to accomplish?
2. **Follow the skill** — Each activity maps to a skill with a tool workflow
3. **Execute tools** — Follow the skill's tool sequence
4. **Synthesize answer** — Combine findings with citations

---

## Step 1: Identify the Activity

Fetch `concept-rag://activities` to see available activities and match the user's goal.

---

## Step 2: Follow the Skill

Each activity links to a skill. The skill describes:
- Which tools to use and in what order
- What context to preserve between calls
- Expected output format

---

## Step 3: Synthesize the Answer

**Your goal is to ANSWER, not report search status.**

### Do This:
```
"The Dependency Rule states that dependencies must point inward.

Key principles:
1. Inner circles should not know about outer circles
2. Business rules should not depend on UI

Source: Clean Architecture by Robert C. Martin"
```

### Not This:
```
"Let me search for more information..."
"I found several results, let me refine..."
```

---

## Efficiency Rules

### Stop Searching When:
- Found relevant content addressing the question
- Made 3+ searches with results
- Same chunks keep appearing

### Maximum Tool Calls:
| Task | Max |
|------|-----|
| Simple lookup | 2-3 |
| Cross-document | 5-6 |
| Complex research | 8-10 |

### Handle "Not Found":
After 2-3 empty searches, report what's available and stop.

---

## Answer Structure

```markdown
## [Direct Answer]

[2-3 sentence summary]

### Key Points
1. [Point with specifics]
2. [Point with specifics]

### Sources
- [Document] by [Author]
```

---

## Checklist

Before responding:
- [ ] Providing an answer, not search status?
- [ ] Synthesized the information?
- [ ] Cited sources?
- [ ] Minimum tool calls?

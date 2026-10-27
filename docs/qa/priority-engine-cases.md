# Priority Engine Regression Cases

The application stores severity, impact, aging, priority score, and priority level. Use the current scoring implementation as the source of truth for exact numeric expectations.

## Scenarios
- A newly created unresolved complaint receives valid default score fields.
- An older unresolved complaint is reconsidered by scheduled recalculation.
- Resolved and rejected complaints follow the implementation's terminal-state policy.
- Priority levels map to documented score bands: Critical 80-100, High 60-79, Medium 40-59, Low 0-39.
- A recalculation failure closes its database session and logs an actionable error.
- Repeated recalculation with unchanged inputs is stable where intended.
- Sorting by priority returns descending scores.

Record fixture inputs and expected score values alongside tests. Do not invent thresholds independently of the implementation.
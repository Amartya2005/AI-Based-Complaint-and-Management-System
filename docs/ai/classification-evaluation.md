# Classification Evaluation Protocol

Evaluate complaint classification and department routing against a held-out, reviewed dataset before changing a model, prompt, or routing rule.

## Dataset requirements
- Keep training and evaluation examples separate.
- Remove personal identifiers and secrets from synthetic or reviewed examples.
- Include ambiguous, short, misspelled, multilingual, and out-of-scope complaints.
- Document label definitions and department mapping rules.
- Track dataset version and the change that produced it.

## Metrics
Report per-class precision, recall, and F1 rather than accuracy alone. Include a confusion matrix, invalid-output rate, fallback rate, and department-routing accuracy. Review low-frequency classes separately.

## Release criteria
Agree on thresholds before evaluation. Investigate regressions by class and severity. A model must not grant access, bypass workflow rules, or make irreversible decisions. Prefer manual review or configured fallback when output is uncertain.

Record model identifier, inference settings, prompt version, dataset version, and evaluation script revision. Keep external-model tests out of deterministic default CI.

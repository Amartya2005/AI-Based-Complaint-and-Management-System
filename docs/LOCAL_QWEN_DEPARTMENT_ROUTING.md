# Local Qwen department routing

## Overview

When a student leaves the department field blank, CCMS asks the locally hosted Qwen3.5:4B model to select one of the departments already registered in the CCMS database. The model cannot create arbitrary department names. A valid department is stored in the existing complaints.department_id field.

The backend then selects the active staff member in that department with the fewest complaints in ASSIGNED or IN_PROGRESS state. The complaint transitions from PENDING to ASSIGNED, a status-history record is created, and the student and staff member are notified using the existing notification service. If the destination has no active staff, the complaint remains PENDING with its department set so an administrator can assign it through the existing workflow.

A department explicitly selected by the student is respected and does not get overwritten by Qwen. It still follows the configured department staff assignment rule.

The existing keyword category classifier, ml_predictions log, priority calculations, status lifecycle, authentication, and admin reassignment endpoints are retained.

## Run the local model

Install Ollama on the machine that runs the model, then run:

    ollama pull qwen3.5:4b
    ollama serve

The service uses Ollama's local HTTP API at http://127.0.0.1:11434 by default. It sends complaint text only to that configured model endpoint, requests structured JSON, and validates the returned code against the database's department list.

## Environment settings

Add or adjust these values in the backend .env file:

    LOCAL_QWEN_ROUTING_ENABLED=true
    LOCAL_LLM_BASE_URL=http://127.0.0.1:11434
    LOCAL_LLM_MODEL=qwen3.5:4b
    LOCAL_LLM_TIMEOUT_SECONDS=12
    AI_ROUTING_MIN_CONFIDENCE=0.45
    AUTO_ASSIGN_DEPARTMENT_STAFF=true

Set AUTO_ASSIGN_DEPARTMENT_STAFF=false to infer and store the department without automatically assigning a staff member. If Ollama is unavailable, times out, or returns an invalid result, CCMS uses conservative local keyword routing. If that fallback cannot confidently choose a unique existing department, the complaint remains PENDING and unassigned for the existing admin workflow.

For a backend running in Docker while Ollama runs on the host, LOCAL_LLM_BASE_URL must point to a host-accessible Ollama endpoint. Do not expose the Ollama API to untrusted networks: the default endpoint is intended for local use.

## Operational notes

- Keep the departments table and staff department_id assignments accurate; routing can only target registered departments and staff mapped to those departments.
- The least-loaded rule counts ASSIGNED and IN_PROGRESS complaints, excludes inactive staff, and uses the staff ID as a stable tie-breaker.
- The confidence value returned by a generative model is not a calibrated probability. The system validates its range and applies a minimum threshold, but production routing should be evaluated against a labelled complaint set.
- Keyword category prediction still drives existing severity and priority calculations. Department routing is a separate decision and does not overwrite the student's complaint category.
- Unit tests can be run with pytest tests/unit/test_department_routing_service.py.

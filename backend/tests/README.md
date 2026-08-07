# Test Suites for SentimentScope

This directory contains automated unit and integration tests to verify API endpoints, NLP preprocessing functions, and dataset schema compliance.

## Purpose & Responsibilities
To ensure that code updates do not introduce structural regression or break the Flask app routing interface.

## Structure
* `unit/`: Holds modular unit tests for functions (e.g., testing `clean_text` output mappings, validating contraction dictionary replacements).
* `integration/`: Holds API-level tests (e.g., mocking HTTP requests to `/analyze` and `/upload` routes to verify output JSON patterns and status codes).

## How to Run Tests
Tests are executed using `pytest`:
```bash
pytest backend/tests/
```

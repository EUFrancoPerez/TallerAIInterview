# Project: <ML project name>

## Environment
- Python managed with `uv`; dependencies in `pyproject.toml`
- `uv sync` to install, `uv run` to execute

## Structure
- `src/pipeline/` — extract/transform/train/evaluate stages
- `src/models/` — model definitions and hyperparameters
- `src/features/` — feature engineering
- `notebooks/` — exploration only, never production code

## Conventions
- Type hints everywhere; docstrings in Google style
- Config/data validation via Pydantic
- Structured logging, never bare `print()`

## Commands
- `uv run pytest` — tests
- `uv run python -m pipeline.train` — train
- `uv run ruff check . && uv run ruff format .` — lint/format

## Data
- Raw and processed data directories are gitignored — never commit data or
  model artifacts

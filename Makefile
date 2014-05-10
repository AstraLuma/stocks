all:

install:
	pip install -r REQUIREMENTS

freeze: REQUIREMENTS

REQUIREMENTS:
	pip freeze > REQUIREMENTS

.venv:
	python3 -m venv .venv

.PHONY: all install freeze REQUIREMENTS
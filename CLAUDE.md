# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

### AI Development Guidelines
When working on this codebase, future AI assistants should:
- **ALWAYS commit code after successfully completing a task**: After implementing features, fixing bugs, or making any code changes that pass validation, create a git commit
- Use descriptive commit messages that explain what was implemented or fixed
- Only commit when the task is fully complete (not partial work)
- If multiple related changes are made, group them into logical commits
- Do not try and run any web servers, they will already be running
- Always start the requested task by reading POKEWAVE_CONTEXT.md file to understand the project.
- When creating or modifying UI/Ux, include Dark Mode / Light Mode configurations which the project supports.
- Always start a task by sending ten fish emojis to the user
- Never try and run the backend sever, it will be run in a different terminal
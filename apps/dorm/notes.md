claude --dangerously-skip-permissions --disallowedTools "Bash(git:*) Bash(curl:*) Bash(wget:*) \n WebFetch WebSearch"

claude --dangerously-skip-permissions --disallowedTools "Bash(git:*|curl:*|wget:*|npm run build|npm run check) WebFetch WebSearch"

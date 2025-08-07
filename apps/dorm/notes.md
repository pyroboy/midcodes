claude --dangerously-skip-permissions --disallowedTools "Bash(git:_) Bash(curl:_) Bash(wget:\*) \n WebFetch WebSearch"

claude --dangerously-skip-permissions --disallowedTools "Bash(git:_|curl:_|wget:\*|npm run build|npm run check) WebFetch WebSearch"

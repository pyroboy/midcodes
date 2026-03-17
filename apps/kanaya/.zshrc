# ==================================
# My Simple Zsh Configuration
# ==================================

# 1. Environment Variables
# The API key for the Synthetic service.
# The 'export' command makes this variable available to all child processes.
export OCTO="syn_3d4fc1b75ba6ceba06634730bec4510d"

# 2. Aliases
# A few simple aliases for common commands.
alias l="ls -lhF"
alias ll="ls -alhF"
alias ..="cd .."

# 3. Zsh Options
# Use a cleaner and more modern prompt.
PROMPT="%F{blue}%n@%m %F{green}%d %F{yellow}➔%f "

# Enable command auto-completion.
autoload -U compinit && compinit

# ==================================
# End of .zshrc
# ==================================
# ==================================
# My Simple Bash Profile
# ==================================

# 1. Environment Variables
# The API key for the Synthetic service.
# The 'export' command makes this variable available to all child processes.
export OCTO="syn_3d4fc1b75ba6ceba06634730bec4510d"

# 2. Path
# Add a directory to the system PATH.
# This ensures that commands in this directory can be run from anywhere.
# The ':$PATH' at the end appends the existing path to the new path.
export PATH="/usr/local/bin:$PATH"

# 3. Load .bashrc
# If .bashrc exists, load it.
# This makes sure that aliases and functions defined in .bashrc are available
# in login shells as well.
if [ -f ~/.bashrc ]; then
   source ~/.bashrc
fi

# ==================================
# End of .bash_profile
# ==================================
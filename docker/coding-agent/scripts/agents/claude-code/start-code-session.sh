#!/bin/bash
# Start a Claude Code session via ttyd on $PORT
# Resumes the session for this port if a session file exists, otherwise starts fresh

SESSION_FILE="/home/coding-agent/.claude-ttyd-sessions/${PORT}"
CLAUDE_ARGS="claude --dangerously-skip-permissions"

if [ -f "$SESSION_FILE" ]; then
    CLAUDE_ARGS="$CLAUDE_ARGS --resume $(cat $SESSION_FILE)"
fi

exec ttyd --writable -p "${PORT}" bash -c "cd /home/coding-agent/workspace && exec $CLAUDE_ARGS"

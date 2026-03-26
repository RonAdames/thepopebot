#!/bin/bash
# Start a bash shell session via ttyd on $PORT

exec ttyd --writable -p "${PORT}" bash -c 'cd /home/coding-agent/workspace && exec bash'

#!/bin/bash
# Install npm deps for active skills (native deps need correct Linux arch)

cd /home/coding-agent/workspace

for skill_dir in skills/active/*/; do
    if [ -f "${skill_dir}package.json" ]; then
        echo "  Installing skill deps: $(basename "$skill_dir")"
        (cd "$skill_dir" && npm install --omit=dev --no-package-lock)
    fi
done

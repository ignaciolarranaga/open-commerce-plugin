#!/bin/sh
# Claude Code PreToolUse hook (.claude/settings.json): before a `git push` that sends changes
# to the skill, its evals, the plugin manifest or the eval runner, run the eval suite and block
# the push (exit 2) when it fails. Stands in for the Evals workflow until the
# ANTHROPIC_API_KEY repository secret is set. Defaults to one run without the no-plugin
# baseline; set EVAL_RUNS and EVAL_ABLATION for the full CI configuration.
set -eu

command=$(jq -r '.tool_input.command // ""')
case "$command" in
  *"git push"*) ;;
  *) exit 0 ;;
esac

root=${CLAUDE_PROJECT_DIR:-$(git rev-parse --show-toplevel)}
cd "$root"
pattern='^(plugins/open-commerce/(skills|evals|\.claude-plugin)/|scripts/run-evals\.sh$)'

# Compare against what the remote already has: the upstream branch, else origin/main.
base=$(git rev-parse -q --verify '@{u}' 2>/dev/null || git merge-base HEAD origin/main 2>/dev/null || true)
[ -z "$base" ] && exit 0
changed=$(git diff --name-only "$base" HEAD | grep -E "$pattern" || true)
[ -z "$changed" ] && exit 0

log="$root/plugins/open-commerce/evals/results/eval-gate.log"
mkdir -p "$(dirname "$log")"
if EVAL_RUNS=${EVAL_RUNS:-1} EVAL_ABLATION=${EVAL_ABLATION:-none} sh scripts/run-evals.sh >"$log" 2>&1; then
  echo "Eval suite passed for: $(echo "$changed" | tr '\n' ' ')"
  exit 0
fi
{
  echo "Push blocked: the eval suite failed or scored below 0.8. Full log: $log"
  tail -n 40 "$log"
} >&2
exit 2

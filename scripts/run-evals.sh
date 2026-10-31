#!/bin/sh
# Runs the plugin eval suite with the pinned models, threshold and network grants shared by
# the pre-push hook and the Evals workflow. Exits non-zero when any case scores below the
# threshold. Override with EVAL_RUNS (default 3), EVAL_ABLATION (with-without or none) and
# EVAL_OUT (results directory); extra arguments go to `claude plugin eval`.
set -eu

root=$(cd "$(dirname "$0")/.." && pwd)
out=${EVAL_OUT:-"$root/plugins/open-commerce/evals/results/latest"}

mkdir -p "$out"
cd "$root/plugins/open-commerce"
claude --version
claude plugin eval . \
  --trust-plugin \
  --no-publish \
  --json "$out/eval-results.json" \
  --output-dir "$out" \
  --threshold 0.8 \
  --runs "${EVAL_RUNS:-3}" \
  --ablation "${EVAL_ABLATION:-with-without}" \
  --model claude-sonnet-5 \
  --judge-model claude-haiku-4-5 \
  --max-cost-usd 20 \
  --allow-tools WebSearch \
    "WebFetch(domain:ignaciolarranaga.github.io)" \
    "WebFetch(domain:loi.com.uy)" \
    "WebFetch(domain:www.zonatecno.com.uy)" \
    "WebFetch(domain:www.vitaleco.com.uy)" \
  "$@"

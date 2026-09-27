#!/usr/bin/env bash
#
# Push the HadaLink prototype to GitHub.
#
# Usage (Option A: run it yourself):
#   GITHUB_TOKEN=ghp_yourTokenHere GITHUB_USER=yourGitHubUsername bash scripts/push-to-github.sh
#
# What it does:
#   1. Verifies the token against the GitHub API
#   2. Creates a public repository named "hadalink" if it does not exist
#   3. Adds it as the "origin" remote
#   4. Pushes the branch feature/hadalink-prototype (and main)
#   5. Scrubs the token from git config afterwards
#
set -euo pipefail

REPO_NAME="hadalink"
BRANCH="feature/hadalink-prototype"
MAIN_BRANCH="main"
API="https://api.github.com"

: "${GITHUB_TOKEN:?Set GITHUB_TOKEN (classic PAT with 'repo' scope, or fine-grained with Contents: Read/Write + Administration: Read/Write)}"
: "${GITHUB_USER:?Set GITHUB_USER to your GitHub username}"

echo "==> Verifying token..."
LOGIN=$(curl -sf -H "Authorization: Bearer ${GITHUB_TOKEN}" "${API}/user" | sed -n 's/.*"login": *"\([^"]*\)".*/\1/p' | head -1)
if [ -z "${LOGIN}" ]; then
  echo "ERROR: token rejected by GitHub. Check that it is valid and has the right scopes." >&2
  exit 1
fi
echo "    Authenticated as ${LOGIN}"

if [ "${LOGIN}" != "${GITHUB_USER}" ]; then
  echo "NOTE: token belongs to ${LOGIN}, using that username instead of ${GITHUB_USER}."
  GITHUB_USER="${LOGIN}"
fi

echo "==> Ensuring repository ${GITHUB_USER}/${REPO_NAME} exists (public)..."
STATUS=$(curl -s -o /tmp/gh-repo.json -w "%{http_code}" \
  -X POST -H "Authorization: Bearer ${GITHUB_TOKEN}" -H "Accept: application/vnd.github+json" \
  "${API}/user/repos" -d "{\"name\":\"${REPO_NAME}\",\"public\":true,\"description\":\"HadaLink: Nigerian agricultural equipment and mechanization marketplace prototype\"}")
if [ "${STATUS}" = "201" ]; then
  echo "    Repository created."
elif [ "${STATUS}" = "422" ]; then
  echo "    Repository already exists, continuing."
else
  echo "ERROR: could not create repository (HTTP ${STATUS})." >&2
  cat /tmp/gh-repo.json >&2
  exit 1
fi

REMOTE_URL="https://x-access-token:${GITHUB_TOKEN}@github.com/${GITHUB_USER}/${REPO_NAME}.git"

echo "==> Configuring remote..."
if git remote get-url origin >/dev/null 2>&1; then
  git remote set-url origin "${REMOTE_URL}"
else
  git remote add origin "${REMOTE_URL}"
fi

echo "==> Pushing ${BRANCH}..."
git push -u origin "${BRANCH}"

echo "==> Pushing ${MAIN_BRANCH}..."
git push -u origin "${MAIN_BRANCH}"

echo "==> Scrubbing token from git config..."
git remote set-url origin "https://github.com/${GITHUB_USER}/${REPO_NAME}.git"

echo ""
echo "DONE. Your code is on GitHub:"
echo "  https://github.com/${GITHUB_USER}/${REPO_NAME}/tree/${BRANCH}"

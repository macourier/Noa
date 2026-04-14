#!/usr/bin/env bash

set -euo pipefail

TARGET_DIRECTORY="."
PROFILE=""
STACK=""
BLUEPRINT=""
CI_VALUE=""
ENABLE_NEWBIE_MODE="false"
REPOSITORY_URL="https://github.com/fatidaprilian/Agentic-Senior-Core.git"
ADDITIONAL_ARGUMENTS=()

while (($# > 0)); do
	case "$1" in
		--profile)
			PROFILE="${2:-}"
			shift 2
			;;
		--profile=*)
			PROFILE="${1#*=}"
			shift
			;;
		--stack)
			STACK="${2:-}"
			shift 2
			;;
		--stack=*)
			STACK="${1#*=}"
			shift
			;;
		--blueprint)
			BLUEPRINT="${2:-}"
			shift 2
			;;
		--blueprint=*)
			BLUEPRINT="${1#*=}"
			shift
			;;
		--ci)
			CI_VALUE="${2:-}"
			shift 2
			;;
		--ci=*)
			CI_VALUE="${1#*=}"
			shift
			;;
		--newbie)
			ENABLE_NEWBIE_MODE="true"
			shift
			;;
		--repository-url)
			REPOSITORY_URL="${2:-}"
			shift 2
			;;
		--repository-url=*)
			REPOSITORY_URL="${1#*=}"
			shift
			;;
		--)
			shift
			ADDITIONAL_ARGUMENTS+=("$@")
			break
			;;
		-* )
			echo "Unknown option: $1" >&2
			exit 1
			;;
		*)
			TARGET_DIRECTORY="$1"
			shift
			;;
	esac
done

if ! command -v git >/dev/null 2>&1; then
	echo "Git is required but was not found in PATH." >&2
	exit 1
fi

if ! command -v node >/dev/null 2>&1; then
	echo "Node.js is required but was not found in PATH." >&2
	exit 1
fi

RESOLVED_TARGET_DIRECTORY="$(cd "$TARGET_DIRECTORY" && pwd)"
TEMPORARY_ROOT_DIRECTORY="$(mktemp -d 2>/dev/null || mktemp -d -t agentic-senior-core-bootstrap)"
BOOTSTRAP_REPOSITORY_PATH="$TEMPORARY_ROOT_DIRECTORY/Agentic-Senior-Core"

cleanup_temporary_directory() {
	rm -rf "$TEMPORARY_ROOT_DIRECTORY"
}
trap cleanup_temporary_directory EXIT

echo "[Agentic-Senior-Core] Cloning bootstrap repository into temporary directory..."
git clone --depth 1 "$REPOSITORY_URL" "$BOOTSTRAP_REPOSITORY_PATH" >/dev/null

CLI_SCRIPT_PATH="$BOOTSTRAP_REPOSITORY_PATH/bin/agentic-senior-core.js"
if [[ ! -f "$CLI_SCRIPT_PATH" ]]; then
	echo "CLI entry file not found: $CLI_SCRIPT_PATH" >&2
	exit 1
fi

CLI_ARGUMENTS=("$CLI_SCRIPT_PATH" init "$RESOLVED_TARGET_DIRECTORY")

if [[ -n "$PROFILE" ]]; then
	CLI_ARGUMENTS+=(--profile "$PROFILE")
fi

if [[ -n "$STACK" ]]; then
	CLI_ARGUMENTS+=(--stack "$STACK")
fi

if [[ -n "$BLUEPRINT" ]]; then
	CLI_ARGUMENTS+=(--blueprint "$BLUEPRINT")
fi

if [[ -n "$CI_VALUE" ]]; then
	CLI_ARGUMENTS+=(--ci "$CI_VALUE")
fi

if [[ "$ENABLE_NEWBIE_MODE" == "true" ]]; then
	CLI_ARGUMENTS+=(--newbie)
fi

if ((${#ADDITIONAL_ARGUMENTS[@]} > 0)); then
	CLI_ARGUMENTS+=("${ADDITIONAL_ARGUMENTS[@]}")
fi

echo "[Agentic-Senior-Core] Running CLI against target directory: $RESOLVED_TARGET_DIRECTORY"
node "${CLI_ARGUMENTS[@]}"

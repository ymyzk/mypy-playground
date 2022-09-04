#!/bin/bash
set -eu

cd "$(dirname "$0")"

: "${FUNCTION_NAME_BASE:=mypy-}"
: "${MAX_INSTANCES:=3}"
: "${MEMORY:=1024MB}"
: "${REGION:=asia-northeast1}"
: "${RUNTIME:=python310}"

deploy() {
  VERSION="$1"
  if [[ $VERSION =~ master|^[0-9] ]]; then
    # We append 'mypy' to the numbered and master directories
    VERSION="${FUNCTION_NAME_BASE}${VERSION}"
  fi
  # We cannot use "." in a function name.
  FUNCTION_NAME="${VERSION//./-}"
  echo "Deploying ${VERSION} as ${FUNCTION_NAME}..."
  gcloud functions deploy "${FUNCTION_NAME}" \
    --trigger-http \
    --entry-point=run_typecheck \
    --security-level=secure-always \
    --quiet \
    "--region=${REGION}" \
    "--runtime=${RUNTIME}"\
    "--memory=${MEMORY}" \
    "--source=${VERSION}" \
    "--service-account=${SERVICE_ACCOUNT}" \
    "--max-instances=${MAX_INSTANCES}"
  echo "Updating IAM policy for ${FUNCTION_NAME}..."
  gcloud functions add-iam-policy-binding "${FUNCTION_NAME}" \
    "--region=${REGION}" \
    "--member=${INVOKER_MEMBER}" \
    --role=roles/cloudfunctions.invoker
}

for ver in "$@"; do
  deploy "$ver"
done

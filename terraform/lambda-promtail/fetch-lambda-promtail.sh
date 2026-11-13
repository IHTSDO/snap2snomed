#!/usr/bin/env bash
# Downloads the pinned grafana/lambda-promtail release zip into dist/ and
# checks its sha256. promtail-al2023.tf deploys this file.
#
# The build pipeline runs this before publishing the terraform artifact.
# Run it yourself before a local terraform plan or apply.
set -euo pipefail

VERSION="v1.0.1"
SHA256="2a436a30772ac638f715dd240784f787b9f0c745ba292a49cd23d132c477fd13"

dir="$(cd "$(dirname "$0")" && pwd)/dist"
zip="${dir}/lambda-promtail-${VERSION}.zip"
url="https://github.com/grafana/lambda-promtail/releases/download/${VERSION}/lambda-promtail-${VERSION}.zip"

mkdir -p "${dir}"
if [ ! -f "${zip}" ]; then
  curl -fsSL --retry 3 -o "${zip}.tmp" "${url}"
  mv "${zip}.tmp" "${zip}"
fi

if command -v sha256sum >/dev/null; then
  actual="$(sha256sum "${zip}" | cut -d' ' -f1)"
else
  actual="$(shasum -a 256 "${zip}" | cut -d' ' -f1)"
fi

if [ "${actual}" != "${SHA256}" ]; then
  echo "lambda-promtail ${VERSION}: sha256 mismatch (got ${actual})" >&2
  rm -f "${zip}"
  exit 1
fi

echo "lambda-promtail ${VERSION}: ${zip} verified"

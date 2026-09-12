/** Public Python package published to PyPI. Continuous releases; never hard-code a version. */
export const PYPI_PACKAGE_NAME = 'opentide';

export const PYPI_JSON_URL = `https://pypi.org/pypi/${PYPI_PACKAGE_NAME}/json`;

export const PYPI_PROJECT_URL = `https://pypi.org/project/${PYPI_PACKAGE_NAME}/`;

export const INSTALL_CMD = `pip install ${PYPI_PACKAGE_NAME}`;

const VERSION_PATTERN = /^[0-9A-Za-z][0-9A-Za-z._+-]{0,31}$/;

export function isSafePypiVersion(value: string): boolean {
  return VERSION_PATTERN.test(value);
}

export function pypiReleaseUrl(version: string): string {
  return `${PYPI_PROJECT_URL}${encodeURIComponent(version)}/`;
}

export function parsePypiProjectPayload(payload: unknown): string | null {
  if (typeof payload !== 'object' || payload === null) {
    return null;
  }
  if (!('info' in payload)) {
    return null;
  }
  const info: unknown = payload.info;
  if (typeof info !== 'object' || info === null) {
    return null;
  }
  if (!('version' in info)) {
    return null;
  }
  const version: unknown = info.version;
  if (typeof version !== 'string' || !isSafePypiVersion(version)) {
    return null;
  }
  return version;
}

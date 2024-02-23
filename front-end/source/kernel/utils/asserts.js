export const EDITOR = 'editor';
export const RUNTIME = 'runtime';

let version = null;
export function setVersion(vers) {
  if (version) {
    throw new Error(`Setting version to ${vers} but it is already ${version}`);
  }
  version = vers;
}

export function assertEditorOnly() {
  if (version !== EDITOR) {
    throw new Error(`Current version is ${version}`);
  }
}

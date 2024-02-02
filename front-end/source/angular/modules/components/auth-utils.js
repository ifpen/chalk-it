import { xDashConfig } from 'config.js';

let getAuthToken = () => undefined;
if (xDashConfig.xDashBasicVersion != 'true') {
  getAuthToken = () => LoginMngr.GetSavedJwt();
}

export function setXHRAuthorizationHeader(xhr) {
  // Add authorization header
  const token = getAuthToken();
  if (token) {
    xhr.setRequestHeader('Authorization', token);
  }
}

export function getAuthorizationHeaders() {
  // Add authorization header
  const token = getAuthToken();
  if (token) {
    return { Authorization: token };
  } else {
    return {};
  }
}
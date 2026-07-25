import { Buffer } from 'buffer';

function getJWT() {
    var decodedCookie = decodeURIComponent(document.cookie);
    var cookies = decodedCookie.split(';');
    for (let cookie of cookies) {
      cookie = cookie.trim();
      if (cookie.indexOf("auth") === 0) {
        return cookie.substring(5, cookie.length);
      }
    }
    return "";
}

function hasJWT() {
  var jwt = getJWT();
  return jwt !== "";
}

function getJWTPayload(jwt) {
  var b64jwt = jwt.replace(/-/g, '+').replace(/_/g, '/');
  console.log(b64jwt);
  const pad = b64jwt.length % 4;
  if (pad) b64jwt += '='.repeat(4-pad);
  console.log(b64jwt);
  var idx = b64jwt.indexOf('.');
  b64jwt = b64jwt.substring(idx+1, b64jwt.length);
  console.log(b64jwt);
  idx = b64jwt.indexOf('.');
  b64jwt = b64jwt.substring(0, idx);
  console.log(b64jwt);
  return Buffer.from(b64jwt, 'base64').toString('utf8');
}

function getUserId() {
  var decodedCookie = decodeURIComponent(document.cookie);
  var cookies = decodedCookie.split(';');
  for (let cookie of cookies) {
    cookie = cookie.trim();
    if (cookie.indexOf("userId") === 0) {
      return cookie.substring(7, cookie.length);
    }
  }
  return "";
}

function deleteJWT() {
  document.cookie = "auth=;expires=Thu, 01 Jan 1970 00:00:01 GMT;path=/";
}

function deleteUserId() {
  document.cookie = "userId=;expires=Thu, 01 Jan 1970 00:00:01 GMT;path=/";
}

export { getJWT, hasJWT, getUserId, getJWTPayload, deleteJWT, deleteUserId };

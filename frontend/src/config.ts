
const protocol = window.location.protocol;
const wsProtocol = protocol === 'https:' ? 'wss:' : 'ws:';

export const API_BASE_URL = `${window.location.origin}/api`;

export const WS_BASE_URL = `${wsProtocol}//${window.location.host}/ws/`;

export const IS_DEV = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

if (IS_DEV) {

}

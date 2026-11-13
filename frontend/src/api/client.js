import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

const DEV_LAN_IP = '192.168.31.44';

export const getBaseUrl = () => {
  if (Platform.OS === 'web') {
    return 'http://127.0.0.1:5001';
  }

  try {
    const hostUri =
      Constants?.expoConfig?.hostUri ||
      Constants?.manifest2?.extra?.expoClient?.hostUri ||
      Constants?.manifest?.debuggerHost;

    if (hostUri) {
      const hostIp = hostUri.split(':')[0];
      if (hostIp && !hostIp.includes('localhost') && !hostIp.includes('127.0.0.1')) {
        return `http://${hostIp}:5001`;
      }
    }
  } catch (err) {
    console.warn('Error detecting Expo host:', err);
  }

  if (Platform.OS === 'android') {
    return `http://${DEV_LAN_IP}:5001`;
  }

  return `http://${DEV_LAN_IP}:5001`;
};

export const API_BASE_URL = getBaseUrl();
console.log('Configured API_BASE_URL:', API_BASE_URL);

const TOKEN_KEY = '@ai_attendance_token';
let inMemoryToken = null;

export const getStoredToken = async () => {
  if (inMemoryToken) {
    return inMemoryToken;
  }
  try {
    const token = await AsyncStorage.getItem(TOKEN_KEY);
    if (token) {
      inMemoryToken = token;
    }
    return token;
  } catch (err) {
    return inMemoryToken;
  }
};

export const setStoredToken = async (token) => {
  inMemoryToken = token || null;
  try {
    if (token) {
      await AsyncStorage.setItem(TOKEN_KEY, token);
    } else {
      await AsyncStorage.removeItem(TOKEN_KEY);
    }
  } catch (err) {
    // In-memory token is already updated
  }
};

export async function apiClient(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  console.log(`[API Request] ${options.method || 'GET'} ${url}`);

  let token = null;
  try {
    token = await getStoredToken();
  } catch (e) {
    token = inMemoryToken;
  }

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  const config = {
    ...options,
    headers,
  };

  if (config.body && typeof config.body === 'object' && !(config.body instanceof FormData)) {
    config.body = JSON.stringify(config.body);
  }

  try {
    const response = await fetch(url, config);
    const contentType = response.headers.get('content-type');
    let data;

    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    console.log(`[API Response] ${response.status} from ${url}`, data);

    if (!response.ok) {
      const errorMessage =
        (data && typeof data === 'object' && data.message) ||
        (data && typeof data === 'object' && data.detail) ||
        'Request failed';
      const error = new Error(errorMessage);
      error.status = response.status;
      error.data = data;
      throw error;
    }

    return data;
  } catch (error) {
    console.warn(`[API Error] for ${url}:`, error.message);
    if (error.name === 'TypeError' && error.message.includes('Network request failed')) {
      const netError = new Error(
        `Network error: Cannot reach backend at ${API_BASE_URL}. Ensure PC and phone are on same Wi-Fi and backend is running on 0.0.0.0:5001.`
      );
      netError.status = 0;
      throw netError;
    }
    throw error;
  }
}



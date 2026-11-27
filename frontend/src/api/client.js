import AsyncStorage from '@react-native-async-storage/async-storage';

export const getBaseUrl = () => {
  return (process.env.EXPO_PUBLIC_API_URL || '').replace(/\/+$/, '');
};

export const API_BASE_URL = getBaseUrl();

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
        `Network error: Cannot reach backend at ${API_BASE_URL}. Please check your internet connection and try again.`
      );
      netError.status = 0;
      throw netError;
    }
    throw error;
  }
}



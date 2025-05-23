// api-utils.js

export default class ApiUtils {
  constructor(baseURL, getAuthToken) {
    this.baseURL = baseURL;
    this.getAuthToken = getAuthToken;
  }

  // Fix the fetch method that's failing
  fetch(url, options) {
    return fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': this.getAuthToken ? `Bearer ${this.getAuthToken()}` : '',
        ...options?.headers
      },
      credentials: 'include'  // Include cookies in the request
    })
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      return response.json();
    })
    .catch(error => {
      console.error('API fetch error:', error);
      throw error; // Re-throw to allow handling in the calling function
    });
  }

  // Other methods...
}
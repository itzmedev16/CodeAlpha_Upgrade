const API_URL = 'http://localhost:5000/api';
class Api {
  static getToken() {
    return localStorage.getItem('token');
  }
  static getHeaders() {
    const headers = {
      'Content-Type': 'application/json'
    };
    const token = this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  }
  static async request(endpoint, method = 'GET', body = null) {
    try {
      const options = {
        method,
        headers: this.getHeaders()
      };
      if (body) {
        options.body = JSON.stringify(body);
      }
      const response = await fetch(`${API_URL}${endpoint}`, options);
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Something went wrong');
      }
      return data;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }
  static login(credentials) {
    return this.request('/auth/login', 'POST', credentials);
  }
  static register(userData) {
    return this.request('/auth/register', 'POST', userData);
  }
  static getPosts() {
    return this.request('/posts');
  }
  static createPost(content) {
    return this.request('/posts', 'POST', { content });
  }
  static toggleLike(postId) {
    return this.request(`/posts/${postId}/like`, 'POST');
  }
  static addComment(postId, content) {
    return this.request(`/posts/${postId}/comment`, 'POST', { content });
  }
  static getUsers() {
    return this.request('/users');
  }
  static getUserProfile(userId) {
    return this.request(`/users/${userId}`);
  }
  static toggleFollow(userId) {
    return this.request(`/users/${userId}/follow`, 'POST');
  }
  static deleteUser(userId) {
    return this.request(`/users/${userId}`, 'DELETE');
  }
}

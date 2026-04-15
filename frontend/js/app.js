const state = {
  user: JSON.parse(localStorage.getItem('user')) || null,
  posts: [],
  currentView: 'auth', 
  viewingProfileId: null
};
const views = {
  auth: document.getElementById('auth-view'),
  feed: document.getElementById('feed-view'),
  profile: document.getElementById('profile-view'),
  admin: document.getElementById('admin-view')
};
const navLinks = document.getElementById('nav-links');
const authForm = document.getElementById('auth-form');
const authSwitchBtn = document.getElementById('auth-switch-btn');
const postsContainer = document.getElementById('posts-container');
const createPostForm = document.getElementById('create-post-form');
const profileInfo = document.getElementById('profile-info');
const profilePostsContainer = document.getElementById('profile-posts-container');
const miniProfile = document.getElementById('mini-profile');
let isLoginMode = true;
function init() {
  if (state.user) {
    if (state.user.role === 'admin') {
      switchView('admin');
    } else {
      switchView('feed');
    }
  } else {
    switchView('auth');
  }
}
function updateNav() {
  navLinks.innerHTML = '';
  if (state.user) {
    navLinks.innerHTML = `
      <span class="nav-link" id="nav-home">Home</span>
      ${state.user.role === 'admin' ? '<span class="nav-link" id="nav-admin">Dashboard</span>' : ''}
      <span class="nav-link" id="nav-profile">${state.user.username}</span>
      <span class="nav-link" id="nav-logout">Logout</span>
    `;
    
    document.getElementById('nav-home').addEventListener('click', () => switchView('feed'));
    if(state.user.role === 'admin'){
      document.getElementById('nav-admin').addEventListener('click', () => switchView('admin'));
    }
    document.getElementById('nav-profile').addEventListener('click', () => {
      state.viewingProfileId = state.user._id;
      switchView('profile');
    });
    document.getElementById('nav-logout').addEventListener('click', logout);
  } else {
  }
}
function switchView(viewName) {
  state.currentView = viewName;
  Object.values(views).forEach(v => v.classList.add('hidden'));
  views[viewName].classList.remove('hidden');
  updateNav();

  if (viewName === 'feed') {
    loadFeed();
    renderMiniProfile();
    loadSuggestedUsers();
  } else if (viewName === 'profile') {
    loadProfile(state.viewingProfileId);
  } else if (viewName === 'admin') {
    loadAdminDashboard();
  }
}
authSwitchBtn.addEventListener('click', () => {
  isLoginMode = !isLoginMode;
  document.getElementById('auth-title').innerText = isLoginMode ? 'Welcome Back' : 'Join sroll';
  document.getElementById('auth-subtitle').innerText = isLoginMode ? 'Login to continue to your network' : 'Create an account to connect';
  document.getElementById('auth-switch-text').innerText = isLoginMode ? "Don't have an account? " : "Already have an account? ";
  authSwitchBtn.innerText = isLoginMode ? 'Sign up' : 'Login';
  document.getElementById('auth-submit').innerText = isLoginMode ? 'Login' : 'Sign up';
  document.getElementById('name-group').style.display = isLoginMode ? 'none' : 'block';
  document.getElementById('bio-group').style.display = isLoginMode ? 'none' : 'block';
  
  if(isLoginMode) {
    document.getElementById('name').removeAttribute('required');
    document.getElementById('username-group').style.display = 'none';
    document.getElementById('email-group').style.display = 'block';
  } else {
    document.getElementById('name').setAttribute('required', 'true');
    document.getElementById('username-group').style.display = 'block';
    document.getElementById('email-group').style.display = 'block';
  }
});
authForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  
  try {
    let res;
    if (isLoginMode) {
      res = await Api.login({ email, password });
    } else {
      const username = document.getElementById('username').value;
      const name = document.getElementById('name').value;
      const bio = document.getElementById('bio').value;
      res = await Api.register({ username, email, password, name, bio });
    }
    
    localStorage.setItem('token', res.token);
    localStorage.setItem('user', JSON.stringify(res.user));
    state.user = res.user;
    
    document.getElementById('password').value = '';
    init(); 
  } catch (error) {
    alert(error.message);
  }
});
function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  state.user = null;
  switchView('auth');
}
async function loadFeed() {
  try {
    state.posts = await Api.getPosts();
    renderPosts(state.posts, postsContainer);
  } catch (err) {
    console.error(err);
    if(err.message === 'Token is not valid' || err.message === 'No token, authorization denied') logout();
  }
}
createPostForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const contentInput = document.getElementById('post-content');
  const content = contentInput.value.trim();
  
  if (!content) return;
  
  try {
    const post = await Api.createPost(content);
    state.posts.unshift(post);
    contentInput.value = '';
    renderPosts(state.posts, postsContainer);
  } catch (error) {
    alert(error.message);
  }
});
function renderPosts(postsToRender, container) {
  container.innerHTML = '';
  
  if (postsToRender.length === 0) {
    container.innerHTML = '<div class="glass-panel text-center"><p class="text-muted">No posts found. Be the first to post!</p></div>';
    return;
  }
  postsToRender.forEach(post => {
    if (!post.user) return;
    const isLiked = post.likes.includes(state.user._id);
    
    const postEl = document.createElement('div');
    postEl.className = 'post-card';
    postEl.innerHTML = `
      <div class="post-header">
        <div class="avatar">${post.user.name.charAt(0).toUpperCase()}</div>
        <div>
          <div class="post-author-name" data-uid="${post.user._id}">${post.user.name}</div>
          <div class="post-author-username">@${post.user.username}</div>
        </div>
        <div class="post-time">${new Date(post.createdAt).toLocaleDateString()}</div>
      </div>
      <div class="post-content">${post.content}</div>
      <div class="post-interactions">
        <button class="interaction-btn btn-like ${isLiked ? 'active' : ''}" data-pid="${post._id}">
          ♥ <span class="like-count">${post.likes.length}</span>
        </button>
        <button class="interaction-btn btn-comment-toggle" data-pid="${post._id}">
          💬 <span>${post.comments.length}</span>
        </button>
      </div>
      <div class="comments-section hidden" id="comments-${post._id}">
        <div class="comments-list">
          ${renderCommentsHtml(post.comments)}
        </div>
        <form class="add-comment" data-pid="${post._id}">
          <input type="text" placeholder="Write a comment..." required>
          <button type="submit" class="btn primary-btn">Reply</button>
        </form>
      </div>
    `;

    container.appendChild(postEl);
  });

  attachPostEvents(container);
}
function renderCommentsHtml(comments) {
  if (!comments || comments.length === 0) return '<p class="text-sm">No comments yet.</p>';
  return comments.filter(c => c.user).map(c => `
    <div class="comment">
      <div class="avatar">${c.user.name.charAt(0).toUpperCase()}</div>
      <div class="comment-content">
        <div class="comment-author">${c.user.name} <span class="text-sm">@${c.user.username}</span></div>
        <div class="comment-text">${c.content}</div>
      </div>
    </div>
  `).join('');
}
function attachPostEvents(container) {
  // Navigation to Profile
  container.querySelectorAll('.post-author-name').forEach(el => {
    el.addEventListener('click', (e) => {
      state.viewingProfileId = e.target.dataset.uid;
      switchView('profile');
    });
  });
  container.querySelectorAll('.btn-like').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const pid = e.currentTarget.dataset.pid;
      try {
        const res = await Api.toggleLike(pid);
        e.currentTarget.querySelector('.like-count').innerText = res.likes.length;
        if(res.hasLiked) e.currentTarget.classList.add('active');
        else e.currentTarget.classList.remove('active');
        
        // Update local state
        const post = state.posts.find(p => p._id === pid);
        if(post) post.likes = res.likes;
      } catch (err) {
        console.error(err);
      }
    });
  });
  container.querySelectorAll('.btn-comment-toggle').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const pid = e.currentTarget.dataset.pid;
      const section = document.getElementById(`comments-${pid}`);
      section.classList.toggle('hidden');
    });
  });
  container.querySelectorAll('.add-comment').forEach(form => {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const pid = e.currentTarget.dataset.pid;
      const input = e.currentTarget.querySelector('input');
      const text = input.value.trim();
      if(!text) return;

      try {
        const newComment = await Api.addComment(pid, text);
        input.value = '';
        const post = state.posts.find(p => p._id === pid);
        if(post) {
          post.comments.push(newComment);
          const list = document.getElementById(`comments-${pid}`).querySelector('.comments-list');
          list.innerHTML = renderCommentsHtml(post.comments);
          e.currentTarget.parentElement.previousElementSibling.querySelector('.btn-comment-toggle span').innerText = post.comments.length;
        }
      } catch (err) {
        alert(err.message);
      }
    });
  });
}
async function loadProfile(userId) {
  try {
    const profile = await Api.getUserProfile(userId);
    const userPosts = state.posts.filter(p => p.user && (p.user._id === userId || p.user === userId)); // Basic filter

    renderProfileInfo(profile);
    renderPosts(userPosts, profilePostsContainer);
  } catch (err) {
    console.error(err);
    alert('Failed to load profile');
    switchView('feed');
  }
}

function renderProfileInfo(profile) {
  const isMe = profile._id === state.user._id;
  const isFollowing = profile.followers.some(f => f._id === state.user._id);
  
  profileInfo.innerHTML = `
    <div class="profile-avatar">${profile.name.charAt(0).toUpperCase()}</div>
    <h2>${profile.name}</h2>
    <p class="text-muted">@${profile.username} ${profile.bio ? '• <span style="color: var(--primary); font-weight: 500;">' + profile.bio + '</span>' : ''}</p>
    
    <div class="profile-stats">
      <div class="stat">
        loadProfile(profile._id);
        <span class="stat-label">Followers</span>
      </div>
      <div class="stat">
        <span class="stat-value">${profile.following.length}</span>
        <span class="stat-label">Following</span>
      </div>
    </div>

    ${!isMe ? `<button class="btn ${isFollowing ? 'secondary-btn' : 'primary-btn'}" id="follow-btn">
      ${isFollowing ? 'Unfollow' : 'Follow'}
    </button>` : ''}
  `;

  if (!isMe) {
    document.getElementById('follow-btn').addEventListener('click', async () => {
  try {
    const res = await Api.toggleFollow(profile._id);
    console.log("API RESPONSE:", res);

    const btn = document.getElementById('follow-btn');

    if (res.isFollowing) {
      btn.innerText = 'Unfollow';
      btn.classList.remove('primary-btn');
      btn.classList.add('secondary-btn');
    } else {
      btn.innerText = 'Follow';
      btn.classList.remove('secondary-btn');
      btn.classList.add('primary-btn');
    }

  } catch (err) {
    console.error("FOLLOW ERROR:", err);
  }
  });
  }
}
function renderMiniProfile() {
  if(!state.user) return;
  miniProfile.innerHTML = `
    <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 20px;">
      <div class="avatar">${state.user.name.charAt(0).toUpperCase()}</div>
      <div>
        <div style="font-weight: 600;">${state.user.name}</div>
        <div class="text-sm">@${state.user.username}</div>
      </div>
    </div>
    <button class="btn secondary-btn full-width" id="mini-profile-btn">View Profile</button>
  `;
  document.getElementById('mini-profile-btn').addEventListener('click', () => {
    state.viewingProfileId = state.user._id;
    switchView('profile');
  });
}
async function loadSuggestedUsers() {
  try {
    const users = await Api.getUsers();
    const suggested = users.filter(u => u && u._id !== state.user._id && u.role !== 'admin').slice(0, 5);
    renderSuggestedUsers(suggested);
  } catch(err) {
    console.error(err);
  }
}
function renderSuggestedUsers(users) {
  const container = document.getElementById('suggested-users-container');
  if(!container) return;
  container.innerHTML = '';
  
  if(users.length === 0) {
    container.innerHTML = '<p class="text-sm">No new users around.</p>';
    return;
  }
  users.forEach(u => {
    const el = document.createElement('div');
    el.style.display = 'flex';
    el.style.alignItems = 'center';
    el.style.gap = '10px';
    el.innerHTML = `
      <div class="avatar" style="width: 32px; height: 32px; font-size: 0.9rem; cursor: pointer;">${u.name.charAt(0).toUpperCase()}</div>
      <div style="flex: 1; cursor: pointer;" class="suggested-user-info">
        <div style="font-weight: 600; font-size: 0.9rem;">${u.name}</div>
        <div class="text-sm">@${u.username}</div>
      </div>
      <button class="btn btn-link suggested-follow-btn" style="font-size: 0.85rem;">View</button>
    `;
    const viewAction = () => {
      state.viewingProfileId = u._id;
      switchView('profile');
    };
    el.querySelector('.avatar').addEventListener('click', viewAction);
    el.querySelector('.suggested-user-info').addEventListener('click', viewAction);
    el.querySelector('.suggested-follow-btn').addEventListener('click', viewAction);
    container.appendChild(el);
  });
}

// Admin Logic
async function loadAdminDashboard() {
  try {
    const users = await Api.getUsers();
    renderAdminUsers(users);
  } catch(err) {
    console.error(err);
  }
}

function renderAdminUsers(users) {
  const container = document.getElementById('admin-users-list');
  if(!container) return;
  container.innerHTML = '';
  
  users.forEach(u => {
    const el = document.createElement('div');
    el.style.display = 'flex';
    el.style.justifyContent = 'space-between';
    el.style.alignItems = 'center';
    el.style.padding = '10px 15px';
    el.style.border = '1px solid var(--panel-border)';
    el.style.borderRadius = '8px';
    el.style.background = 'rgba(0,0,0,0.1)';
    
    el.innerHTML = `
      <div>
        <div style="font-weight: 600;">${u.name} <span class="text-sm">(@${u.username})</span></div>
        <div class="text-sm">${u.email} - Role: ${u.role}</div>
      </div>
      <div>
        ${u._id === state.user._id ? '<span class="text-muted">You</span>' : `<button class="btn danger-btn admin-del-btn" style="background: var(--danger); color: white; padding: 6px 12px;" data-id="${u._id}">Delete</button>`}
      </div>
    `;
    
    container.appendChild(el);
  });
  
  container.querySelectorAll('.admin-del-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const id = e.target.dataset.id;
      if(confirm('Are you sure you want to permanently delete this user?')) {
        try {
          await Api.deleteUser(id);
          e.target.closest('div').parentElement.remove();
        } catch(err) {
          alert('Failed to delete user');
        }
      }
    });
  });
}

init();

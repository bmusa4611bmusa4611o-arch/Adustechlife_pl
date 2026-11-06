"use strict";

const root = document.querySelector("#view-root");
const modalRoot = document.querySelector("#modal-root");
const toast = document.querySelector("#toast");
const authRoot = document.querySelector("#auth-root");
const appShell = document.querySelector(".app-shell");
const mobileNav = document.querySelector(".mobile-nav");
const adminRoot = document.querySelector("#admin-root");
let authenticatedAccount = null;

const people = [
  { id: "amina", name: "Aisha", handle: "@aisha_adu", initials: "AI", color: "#553e36", image: "assets/images/aisha.svg", verified: false },
  { id: "sani", name: "Musa", handle: "@musa_adu", initials: "MU", color: "#35403a", image: "assets/images/musa.svg", verified: false },
  { id: "zainab", name: "Zainab", handle: "@zainab_tech", initials: "ZA", color: "#53404b", image: "assets/images/zainab.svg", verified: false },
  { id: "dr-bello", name: "Dr. Bello", handle: "@drbello", initials: "DB", color: "#3b4934", image: "assets/images/dr-bello.svg", verified: true },
  { id: "kabir", name: "Fabrizio", handle: "@fabrizio_adu", initials: "FA", color: "#4d3b2b", image: "assets/images/fabrizio.svg", verified: false },
  { id: "maryam", name: "Maryam", handle: "@maryam_adu", initials: "MA", color: "#353d52", image: "assets/images/maryam.svg", verified: false },
  { id: "campus-vibes", name: "campusvibes_adu", handle: "@campusvibes_adu", initials: "CV", color: "#35513a", image: "assets/images/campus-gate.svg", verified: false },
  { id: "usman", name: "Usman Abubakar", handle: "@usman_ab", initials: "UA", color: "#295330", image: "assets/images/musa.svg", verified: false }
];

const posts = [
  { id: "p1", person: "campus-vibes", location: "ADUSTECH Main Campus", time: "2h", text: "Student Week 2026 was a vibe! 🎉 Good music, great people, unforgettable moments…", image: "assets/images/student-week.svg", likes: 248, comments: [{ name: "Aisha", text: "The energy was unreal 💚" }, { name: "Musa", text: "Best week of the semester!" }], liked: false, saved: false },
  { id: "p2", person: "zainab", location: "Library", time: "4h", text: "Found my favourite quiet corner for the afternoon 📚", image: "assets/images/library.svg", likes: 86, comments: [{ name: "Maryam", text: "Saving this spot for exam week!" }], liked: false, saved: false },
  { id: "p3", person: "sani", location: "Engineering Faculty", time: "6h", text: "Small wins count. Finally got my project prototype working after a week of debugging. Keep going, people 💚 #StudentLife", image: "", likes: 18, comments: [], liked: false, saved: false }
];

const stories = [
  { person: "amina", text: "Taking the long way back from class today 🌱", time: "12m", likes: 8, liked: false },
  { person: "sani", text: "Study session at the library. You’ve got this 📚", time: "38m", likes: 12, liked: false },
  { person: "zainab", text: "Little moments between lectures ✨", time: "1h", likes: 5, liked: false },
  { person: "maryam", text: "A little break between lectures 🌼", time: "2h", likes: 3, liked: false },
  { person: "campus-vibes", text: "A beautiful day around campus ☀️", time: "3h", likes: 19, liked: false },
  { person: "kabir", text: "Football after the last lecture? ⚽", time: "4h", likes: 7, liked: false }
];

const conversations = [
  { person: "amina", preview: "Are you coming to the library?", messages: [{ text: "Hey Usman! Are you coming to the library later?", mine: false, time: "2:14 PM" }, { text: "Probably after my last lecture. Around 4?", mine: true, time: "2:16 PM" }, { text: "Perfect, see you there 🌿", mine: false, time: "2:17 PM" }] },
  { person: "sani", preview: "Sent you the project link", messages: [{ text: "Sent you the project link we talked about.", mine: false, time: "12:42 PM" }, { text: "Got it, thanks!", mine: true, time: "12:50 PM" }] },
  { person: "zainab", preview: "Thank you so much!", messages: [{ text: "Thank you so much for sharing your notes!", mine: false, time: "Yesterday" }] }
];

const campusPlaces = [
  { id: "main-gate", name: "Main Gate", type: "Entrance", description: "The main entrance to the ADUSTECH campus.", x: 14, y: 58 },
  { id: "library", name: "University Library", type: "Study", description: "Reading rooms and study spaces for students.", x: 36, y: 30 },
  { id: "lecture-theatre", name: "Main Lecture Theatre", type: "Academic", description: "Large lecture venue near the central campus road.", x: 61, y: 47 },
  { id: "engineering", name: "Engineering Faculty", type: "Academic", description: "Faculty buildings and engineering laboratories.", x: 76, y: 27 },
  { id: "cafeteria", name: "Campus Cafeteria", type: "Food", description: "A place to grab a meal between classes.", x: 78, y: 70 },
  { id: "admin", name: "Administration Block", type: "Services", description: "Administrative and student support offices.", x: 42, y: 74 },
  { id: "hostels", name: "Student Hostels", type: "Residence", description: "Student residence area. Exact building locations are illustrative.", x: 22, y: 24 }
];

let currentPage = "home";
let currentFilter = "For you";
let activeConversation = 0;
let storyIndex = 0;
let selectedPlaceId = campusPlaces[0].id;
let routeDestinationId = "";
let locationSharingEnabled = false;
let toastTimer;
let selectedMediaUrl = "";
let selectedMediaType = "";

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[char]);
}

function personById(id) {
  if (id === "usman" && authenticatedAccount?.profile) {
    const name = authenticatedAccount.profile.full_name;
    return {
      ...people.find((person) => person.id === "usman"),
      name,
      handle: authenticatedAccount.profile.username ? `@${authenticatedAccount.profile.username}` : "",
      image: "",
      initials: name.split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase()
    };
  }
  return people.find((person) => person.id === id) || people[0];
}

function avatar(person, extraClass = "") {
  const safeName = escapeHTML(person.name);
  const image = person.image
    ? `<img src="${escapeHTML(person.image)}" alt="${safeName}" loading="lazy" referrerpolicy="no-referrer"><span class="avatar-fallback" aria-hidden="true">${escapeHTML(person.initials)}</span>`
    : `<span class="avatar-fallback" aria-hidden="true">${escapeHTML(person.initials)}</span>`;
  return `<span class="avatar ${extraClass}" style="--avatar-color:${person.color}" aria-label="${safeName}">${image}</span>`;
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("visible");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("visible"), 2600);
}

function navigate(page, filter) {
  if (page === "camera") {
    currentPage = "camera";
  } else {
    currentPage = page;
  }
  if (filter) currentFilter = filter;
  render();
  document.querySelectorAll("[data-page]").forEach((item) => {
    item.classList.toggle("active", item.dataset.page === currentPage);
  });
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function postMarkup(post) {
  const person = personById(post.person);
  const verified = person.verified ? ' <span class="verified" aria-label="Verified">●</span>' : "";
  const comments = post.comments.map((comment) =>
    `<div class="comment"><strong>${escapeHTML(comment.name)}</strong>${escapeHTML(comment.text)}</div>`
  ).join("");
  const ownAvatar = personById("usman");
  return `<article class="post-card" data-post="${post.id}">
    <div class="post-head">${avatar(person)}<div class="post-identity"><strong>${escapeHTML(person.name)}${verified}</strong><small><span class="location-pin">●</span> ${escapeHTML(post.location || "ADUSTECH")} <span class="post-time-dot">·</span> ${escapeHTML(post.time)}</small></div>
    <button class="post-menu" data-action="post-menu" data-id="${post.id}" aria-label="More post options">···</button></div>
    ${post.image ? `<img class="post-photo" src="${escapeHTML(post.image)}" alt="${escapeHTML(post.text)}" loading="lazy" referrerpolicy="no-referrer">` : ""}
    <div class="post-actions">
      <button class="post-action ${post.liked ? "liked" : ""}" data-action="like" data-id="${post.id}" aria-label="${post.liked ? "Unlike" : "Like"} post"><span>${post.liked ? "♥" : "♥"}</span>${post.likes}</button>
      <button class="post-action" data-action="comment" data-id="${post.id}" aria-label="View comments"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 11.5a7.5 7.5 0 0 1-7.5 7.5H6l-3 2v-6a7.5 7.5 0 1 1 17-3.5Z"/></svg>${post.comments.length + 30}</button>
      <button class="post-action share-action" data-action="share" data-id="${post.id}" aria-label="Share post"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg></button>
      <button class="post-action ${post.saved ? "saved" : ""}" data-action="bookmark" data-id="${post.id}" aria-label="${post.saved ? "Remove bookmark" : "Bookmark"}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 4h12v17l-6-4-6 4Z"/></svg></button>
    </div>
    <p class="post-copy"><strong>${escapeHTML(person.handle)}</strong> ${escapeHTML(post.text).replace(/(#[\w]+)/g, '<span class="hashtag">$1</span>')} <button class="more-caption" data-action="caption-more">more</button></p>
    <button class="view-comments" data-action="comment" data-id="${post.id}">View all comments</button>
    <div class="comment-list" hidden>${comments}</div>
    <form class="comment-form" data-id="${post.id}" hidden>${avatar(ownAvatar)}<input name="comment" maxlength="240" placeholder="Add a comment…" aria-label="Write a comment"><button type="submit">Post</button></form>
  </article>`;
}

function homePage() {
  const me = personById("usman");
  return `<button class="campus-map-banner" data-action="map-info"><span class="map-badge"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s7-6.1 7-12a7 7 0 1 0-14 0c0 5.9 7 12 7 12Z"/><circle cx="12" cy="9" r="2.3"/></svg></span><span class="map-title"><strong>Campus Map</strong><small>Find your way around ADUSTECH</small></span><span class="map-live-pin"></span><span class="map-arrow">›</span></button>
  <section class="stories" aria-label="Campus Stricks">
    <button class="story add-story" data-page="camera"><span class="story-ring">${avatar({ name: "Your story", initials: "", color: "#28352a", image: "assets/images/campus-gate.svg" })}<span class="story-add">+</span></span><span class="story-name">Your story</span></button>
    ${stories.map((story, index) => {
      const person = personById(story.person);
      return `<button class="story" data-action="view-story" data-index="${index}" aria-label="View ${escapeHTML(person.name)}'s Strick"><span class="story-ring ${index > 3 ? "seen" : ""}">${avatar(person)}</span><span class="story-name">${escapeHTML(person.name.split(" ")[0])}</span></button>`;
    }).join("")}
  </section>
  <form class="feed-composer" id="feed-composer">${avatar(me)}<input name="post" maxlength="300" placeholder="What’s on your mind, ${escapeHTML(me.name.split(" ")[0])}?" aria-label="Write a campus post"><button type="button" class="composer-tool" data-page="camera" aria-label="Add a photo"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/></svg></button><button type="button" class="composer-tool emoji-tool" data-action="add-emoji" aria-label="Add an emoji">☺</button></form>
  <section aria-label="Campus feed">${posts.map(postMarkup).join("")}</section>`;
}

const exploreFilters = ["For you", "Trending", "Gist", "Events", "Communities", "Marketplace"];

function explorePage() {
  const filter = currentFilter;
  const relevantPosts = filter === "For you" || filter === "Trending" || filter === "Gist"
    ? posts
    : [];
  return `<div class="page-heading"><div><p class="eyebrow">DISCOVER YOUR CAMPUS</p><h1>Explore</h1><p>Find conversations, people and things happening at ADUSTECH.</p></div></div>
  <label class="search-wrap"><span>⌕</span><input class="search-input" id="explore-search" placeholder="Search people, posts and topics…" autocomplete="off"></label>
  <div class="filter-row">${exploreFilters.map((item) => `<button class="filter-chip ${filter === item ? "selected" : ""}" data-action="filter" data-filter="${item}">${item}</button>`).join("")}</div>
  <div id="explore-results">${relevantPosts.length ? relevantPosts.map(postMarkup).join("") : `<div class="empty-state"><strong>${escapeHTML(filter)} are coming in a later phase</strong>This prototype keeps navigation working while we build each campus feature in manageable steps.</div>`}</div>`;
}

function cameraPage() {
  const mediaPreview = selectedMediaUrl
    ? selectedMediaType.startsWith("video/")
      ? `<video class="media-preview" controls src="${selectedMediaUrl}"></video>`
      : `<img class="media-preview" src="${selectedMediaUrl}" alt="Selected media preview">`
    : "";
  return `<div class="page-heading"><div><p class="eyebrow">MAKE A MOMENT</p><h1>Create</h1><p>Choose media from your device to preview it locally.</p></div></div>
  <section class="camera-panel">
    <div class="camera-drop" id="camera-drop">
      <div id="camera-placeholder" ${selectedMediaUrl ? "hidden" : ""}><span class="camera-icon">▣</span><strong>Add a photo or video</strong><p>Nothing is uploaded in this prototype. Your file stays in this browser preview.</p>
        <button class="green-button" data-action="choose-media">Choose from gallery</button>
      </div>
      <div id="media-preview-wrap" ${selectedMediaUrl ? "" : "hidden"}>${mediaPreview}</div>
    </div>
    <input class="file-input" id="media-file" type="file" accept="image/*,video/*">
    <div class="camera-options"><button class="outline-button" data-action="choose-media">▧　Choose photo or video</button><button class="outline-button" data-action="camera-info">◎　Open camera</button></div>
    <textarea class="caption-input" id="media-caption" maxlength="300" placeholder="Add a caption (optional)…" aria-label="Media caption"></textarea>
    <div class="camera-send"><button class="outline-button" data-action="clear-media">Clear</button><button class="green-button" data-action="publish-demo">Share as a Strick</button></div>
  </section>`;
}

function messagePage() {
  const conversation = conversations[activeConversation];
  const person = personById(conversation.person);
  return `<div class="page-heading"><div><p class="eyebrow">STAY IN TOUCH</p><h1>Messages</h1><p>Private conversations in this local demo.</p></div></div>
  <section class="messages-layout">
    <div class="conversation-list"><div class="conversation-title">Chats</div>${conversations.map((item, index) => {
      const p = personById(item.person);
      return `<button class="conversation ${index === activeConversation ? "active" : ""}" data-action="conversation" data-index="${index}">${avatar(p)}<span class="conversation-info"><strong>${escapeHTML(p.name.split(" ")[0])}</strong><small>${escapeHTML(item.preview)}</small></span></button>`;
    }).join("")}</div>
    <div class="chat-panel"><div class="chat-header">${avatar(person)}<div><strong>${escapeHTML(person.name)}</strong><small>Demo conversation</small></div></div>
      <div class="chat-messages" id="chat-messages">${conversation.messages.map(messageMarkup).join("")}</div>
      <form class="message-form" id="message-form"><input class="message-input" name="message" maxlength="500" placeholder="Write a message…" aria-label="Write a message"><button class="send-button" aria-label="Send message">↗</button></form>
    </div>
  </section>`;
}

function messageMarkup(message) {
  return `<div class="bubble ${message.mine ? "mine" : ""}">${escapeHTML(message.text)}<small>${escapeHTML(message.time)}</small></div>`;
}

function profilePage() {
  const me = personById("usman");
  const userPosts = posts.filter((post) => post.person === "usman");
  return `<div class="page-heading"><div><p class="eyebrow">YOUR CAMPUS IDENTITY</p><h1>My profile</h1></div></div>
  <div class="profile-cover"></div>
  <div class="profile-summary">${avatar(me, "avatar-me")}<div class="profile-name"><h1>${escapeHTML(me.name)}</h1><p>${escapeHTML(me.handle || "ADUSTECH community")} · ${escapeHTML(authenticatedAccount.profile.role)}</p></div><button class="outline-button profile-edit" data-action="edit-profile">Edit profile</button></div>
  <p class="profile-bio">Welcome to your ADUSTECH campus profile.</p>
  <div class="profile-stats"><span><strong>128</strong>Followers</span><span><strong>86</strong>Following</span><span><strong>${userPosts.length}</strong>Posts</span></div>
  <div class="profile-tabs"><button class="active" data-action="profile-tab" data-tab="posts">Posts</button><button data-action="profile-tab" data-tab="saved">Saved</button></div>
  <div id="profile-posts">${userPosts.length ? userPosts.map(postMarkup).join("") : `<div class="empty-state"><strong>Your first post starts here</strong>Share a campus moment when you’re ready.</div>`}</div>`;
}

function render() {
  const pages = { home: homePage, explore: explorePage, camera: cameraPage, messages: messagePage, profile: profilePage };
  root.innerHTML = (pages[currentPage] || homePage)();
  const account = personById("usman");
  document.querySelectorAll(".mini-profile-text strong").forEach((item) => { item.textContent = account.name; });
  document.querySelectorAll(".mini-profile-text small").forEach((item) => { item.textContent = `${authenticatedAccount?.profile.role || "Student"} · ADUSTECH`; });
  document.querySelectorAll(".avatar-me").forEach((item) => { item.textContent = account.initials; });
  document.querySelectorAll(".side-nav [data-page], .sidebar > [data-page], .mini-profile, .mobile-nav [data-page]").forEach((item) => {
    item.classList.toggle("active", item.dataset.page === currentPage);
  });
}

function renderAuth(mode = "signin", message = "", tone = "error") {
  appShell.hidden = true;
  mobileNav.hidden = true;
  adminRoot.hidden = true;
  authRoot.hidden = false;
  if (!window.AdustechAuth?.configured) {
    authRoot.innerHTML = `<section class="auth-card"><p class="eyebrow">ADUSTECH · WUDIL</p><h1>Connect your campus</h1><p class="auth-description">Supabase is not configured yet. Add your project URL and publishable key to <code>js/supabase-config.js</code>, then run <code>supabase/schema.sql</code> in the Supabase SQL Editor.</p><p class="auth-note">Use the project URL and publishable (anon) key only. Never put a service-role key in this website.</p></section>`;
    return;
  }

  const messages = {
    signin: ["Welcome back", "Sign in with your university community account."],
    signup: ["Join Adustechlife", "Create your account. New accounts start with student access."],
    forgot: ["Reset your password", "We’ll email you a secure password-reset link."],
    recovery: ["Choose a new password", "Set a new password for your account."]
  };
  const [title, description] = messages[mode] || messages.signin;
  let form = "";
  if (mode === "signup") {
    form = `<label>Full name<input name="fullName" autocomplete="name" minlength="2" maxlength="100" required></label><label>Username<input name="username" autocomplete="username" minlength="3" maxlength="24" pattern="[a-zA-Z0-9][a-zA-Z0-9._]{2,23}" required></label><label>University email<input name="email" type="email" autocomplete="email" required></label><label>Password<input name="password" type="password" autocomplete="new-password" minlength="10" required></label><button class="green-button auth-submit" type="submit">Create student account</button>`;
  } else if (mode === "forgot") {
    form = `<label>Account email<input name="email" type="email" autocomplete="email" required></label><button class="green-button auth-submit" type="submit">Send reset link</button>`;
  } else if (mode === "recovery") {
    form = `<label>New password<input name="password" type="password" autocomplete="new-password" minlength="10" required></label><button class="green-button auth-submit" type="submit">Update password</button>`;
  } else {
    form = `<label>University email<input name="email" type="email" autocomplete="email" required></label><label>Password<input name="password" type="password" autocomplete="current-password" required></label><button class="green-button auth-submit" type="submit">Sign in</button>`;
  }
  const tabs = mode === "signin" || mode === "signup"
    ? `<div class="auth-tabs"><button type="button" class="${mode === "signin" ? "selected" : ""}" data-action="auth-mode" data-mode="signin">Sign in</button><button type="button" class="${mode === "signup" ? "selected" : ""}" data-action="auth-mode" data-mode="signup">Create account</button></div>`
    : "";
  const extra = mode === "signin"
    ? `<button type="button" class="auth-text-button" data-action="auth-mode" data-mode="forgot">Forgot password?</button>`
    : mode === "recovery" ? "" : `<button type="button" class="auth-text-button" data-action="auth-mode" data-mode="signin">Back to sign in</button>`;
  authRoot.innerHTML = `<section class="auth-card"><p class="eyebrow">ADUSTECH · WUDIL</p><h1>${title}</h1><p class="auth-description">${description}</p>${tabs}<form id="auth-form" data-mode="${mode}">${form}</form>${extra}<p class="auth-message ${tone}" role="status">${escapeHTML(message)}</p><p class="auth-security-note">Student and administrator accounts use this sign-in. Account permissions are assigned by the university, not selected during registration.</p></section>`;
}

function setAuthenticatedIdentity() {
  const profile = authenticatedAccount.profile;
  const initials = profile.full_name.split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
  document.querySelectorAll(".top-avatar").forEach((item) => { item.textContent = initials; });
  document.querySelectorAll(".auth-signout").forEach((item) => { item.hidden = false; });
}

function enterAuthenticatedApp(account) {
  authenticatedAccount = account;
  authRoot.hidden = true;
  document.querySelectorAll(".auth-signout").forEach((item) => { item.hidden = false; });
  if (account.profile.role === "admin") {
    appShell.hidden = true;
    mobileNav.hidden = true;
    adminRoot.hidden = false;
    loadAdminDashboard();
    return;
  }
  adminRoot.hidden = true;
  appShell.hidden = false;
  mobileNav.hidden = false;
  setAuthenticatedIdentity();
  render();
}

async function loadAdminDashboard() {
  const account = authenticatedAccount;
  if (!account) return;
  adminRoot.innerHTML = `<section class="admin-dashboard"><header class="admin-header"><div><p class="eyebrow">ADUSTECH · WUDIL</p><h1>Admin console</h1><p>Signed in as ${escapeHTML(account.profile.full_name)}</p></div><button class="outline-button" data-action="sign-out">Sign out</button></header><div class="admin-loading" role="status">Loading institution members and audit activity…</div></section>`;
  try {
    const [members, logs] = await Promise.all([
      window.AdustechAuth.listInstitutionProfiles(account.session, account.profile.institution_id),
      window.AdustechAuth.listAdminAuditLogs(account.session, account.profile.institution_id)
    ]);
    if (authenticatedAccount !== account) return;
    const names = new Map(members.map((member) => [member.user_id, member.full_name]));
    const memberRows = members.map((member) => `<tr><td><strong>${escapeHTML(member.full_name)}</strong><small>@${escapeHTML(member.username || "no-username")}</small></td><td><select class="role-select" data-role-user="${escapeHTML(member.user_id)}" ${member.user_id === account.user.id || member.role === "admin" ? "disabled" : ""}><option value="student" ${member.role === "student" ? "selected" : ""}>Student</option><option value="lecturer" ${member.role === "lecturer" ? "selected" : ""}>Lecturer</option><option value="moderator" ${member.role === "moderator" ? "selected" : ""}>Moderator</option><option value="admin" disabled ${member.role === "admin" ? "selected" : ""}>Admin (owner-managed)</option></select></td><td>${new Date(member.created_at).toLocaleDateString()}</td><td><button class="outline-button role-save" data-action="save-role" data-user="${escapeHTML(member.user_id)}" ${member.user_id === account.user.id || member.role === "admin" ? "disabled" : ""}>Save</button></td></tr>`).join("");
    const auditRows = logs.length ? logs.map((log) => `<tr><td>${new Date(log.created_at).toLocaleString()}</td><td>${escapeHTML(names.get(log.actor_user_id) || "System / provisioning")}</td><td>${escapeHTML(names.get(log.target_user_id) || "Deleted account")}</td><td>${escapeHTML(log.action)}</td><td>${escapeHTML(JSON.stringify(log.details))}</td></tr>`).join("") : `<tr><td colspan="5">No administrative changes have been recorded yet.</td></tr>`;
    adminRoot.innerHTML = `<section class="admin-dashboard"><header class="admin-header"><div><p class="eyebrow">ADUSTECH · WUDIL</p><h1>Admin console</h1><p>Signed in as ${escapeHTML(account.profile.full_name)} · institution-scoped access</p></div><button class="outline-button" data-action="sign-out">Sign out</button></header><div class="admin-stats"><article><strong>${members.length}</strong><span>Loaded member profiles</span></article><article><strong>${members.filter((member) => member.role === "student").length}</strong><span>Students loaded</span></article><article><strong>${members.filter((member) => member.role === "lecturer").length}</strong><span>Lecturers loaded</span></article></div><section class="admin-section"><h2>Community accounts</h2><p>Showing up to 100 newest accounts. Role changes are restricted to student, lecturer, and moderator. Administrator access is provisioned securely outside the browser.</p><div class="admin-table-wrap"><table class="admin-table"><thead><tr><th>Member</th><th>Access</th><th>Joined</th><th></th></tr></thead><tbody>${memberRows || `<tr><td colspan="4">No accounts found.</td></tr>`}</tbody></table></div></section><section class="admin-section"><h2>Latest administrative audit activity</h2><p>Showing up to 50 records.</p><div class="admin-table-wrap"><table class="admin-table audit-table"><thead><tr><th>When</th><th>Actor</th><th>Member</th><th>Action</th><th>Details</th></tr></thead><tbody>${auditRows}</tbody></table></div></section></section>`;
  } catch (error) {
    if (authenticatedAccount !== account) return;
    adminRoot.innerHTML = `<section class="admin-dashboard"><header class="admin-header"><div><p class="eyebrow">ADUSTECH · WUDIL</p><h1>Admin console</h1></div><button class="outline-button" data-action="sign-out">Sign out</button></header><div class="admin-error" role="alert">${escapeHTML(error.message)}<button class="outline-button" data-action="reload-admin">Try again</button></div></section>`;
  }
}

async function submitAuthForm(form) {
  const data = new FormData(form);
  const mode = form.dataset.mode;
  const submitButton = form.querySelector('[type="submit"]');
  submitButton.disabled = true;
  try {
    if (mode === "signin") {
      await window.AdustechAuth.signIn(String(data.get("email")).trim(), String(data.get("password")));
      enterAuthenticatedApp(await window.AdustechAuth.getCurrentUser());
    } else if (mode === "signup") {
      const result = await window.AdustechAuth.signUp({
        email: String(data.get("email")).trim(),
        password: String(data.get("password")),
        fullName: String(data.get("fullName")).trim(),
        username: String(data.get("username")).trim().toLowerCase()
      });
      if (result.session) enterAuthenticatedApp(await window.AdustechAuth.getCurrentUser());
      else renderAuth("signin", "Account created. Check your email to confirm it, then sign in.", "success");
    } else if (mode === "forgot") {
      await window.AdustechAuth.sendPasswordReset(String(data.get("email")).trim());
      renderAuth("signin", "If the account exists, a password-reset link has been sent.", "success");
    } else if (mode === "recovery") {
      await window.AdustechAuth.updatePassword(String(data.get("password")));
      renderAuth("signin", "Password updated. Sign in with your new password.", "success");
    }
  } catch (error) {
    renderAuth(mode, error.message);
  }
}

async function initializeAuthentication() {
  try {
    const callbackType = window.AdustechAuth.consumeAuthCallback();
    if (!window.AdustechAuth.configured) {
      renderAuth();
      return;
    }
    if (callbackType === "recovery") {
      await window.AdustechAuth.getCurrentUser();
      renderAuth("recovery");
      return;
    }
    const account = await window.AdustechAuth.getCurrentUser();
    if (account) enterAuthenticatedApp(account);
    else renderAuth("signin", callbackType === "session" ? "Email confirmed. You can now sign in." : "");
  } catch (error) {
    renderAuth("signin", error.message);
  }
}

function campusMapMarkup() {
  const selectedPlace = campusPlaces.find((place) => place.id === selectedPlaceId) || campusPlaces[0];
  return `<div class="modal-backdrop map-backdrop" data-action="map-backdrop-close">
    <section class="map-dialog" role="dialog" aria-modal="true" aria-labelledby="campus-map-title">
      <header class="map-dialog-header">
        <div><p class="eyebrow">ADUSTECH · WUDIL</p><h2 id="campus-map-title">Campus map</h2></div>
        <button class="modal-close" data-action="close-modal" aria-label="Close campus map">×</button>
      </header>
      <label class="map-search"><span>⌕</span><input id="map-search" type="search" placeholder="Find a campus place…" autocomplete="off"></label>
      <div class="campus-map-layout">
        <div class="campus-map-visual" role="img" aria-label="Illustrative campus map with interactive location markers">
          <svg class="map-road-drawing" viewBox="0 0 800 440" preserveAspectRatio="none" aria-hidden="true">
            <path d="M-20 350 280 250 380 280 830 70M100-20 220 140 400 180 560 460M-20 110 190 190 330 155 500 210 820 185" />
            <path d="M-20 350 280 250 380 280 830 70M100-20 220 140 400 180 560 460M-20 110 190 190 330 155 500 210 820 185" class="road-edge" />
            <path d="M40 305 230 245M438 184 757 72M244 114l108 53m167 76 101 133" class="footpath" />
          </svg>
          <span class="map-park park-a"></span><span class="map-park park-b"></span><span class="map-park park-c"></span>
          ${campusRouteMarkup()}
          ${campusPlaces.map((place) => `<button class="map-marker ${place.id === selectedPlace.id ? "selected" : ""}" style="left:${place.x}%;top:${place.y}%" data-action="select-place" data-place="${place.id}" aria-label="${escapeHTML(place.name)}"><span>●</span></button>`).join("")}
        </div>
        <div class="map-place-panel">
          <p class="eyebrow">CAMPUS DIRECTORY</p>
          <div class="map-place-list" id="map-place-list">${campusPlaces.map((place) =>
    `<button class="map-place-item ${place.id === selectedPlace.id ? "selected" : ""}" data-action="select-place" data-place="${place.id}"><span class="place-pin">⌖</span><span><strong>${escapeHTML(place.name)}</strong><small>${escapeHTML(place.type)}</small></span><span class="place-chevron">›</span></button>`
  ).join("")}</div>
          <div class="map-place-detail" id="map-place-detail">${campusPlaceDetailMarkup(selectedPlace)}</div>
        </div>
      </div>
      <footer class="map-dialog-footer"><span class="privacy-lock">⌑</span><span>Your location is off. This demo does not transmit location.</span><button class="location-toggle ${locationSharingEnabled ? "enabled" : ""}" data-action="toggle-location">${locationSharingEnabled ? "Turn off" : "Enable demo"}</button></footer>
    </section>
  </div>`;
}

function openCampusMap() {
  selectedPlaceId = campusPlaces[0].id;
  routeDestinationId = "";
  modalRoot.innerHTML = campusMapMarkup();
}

function campusPlaceDetailMarkup(place) {
  const isMainGate = place.id === "main-gate";
  return `<span class="eyebrow">SELECTED LOCATION</span><strong>${escapeHTML(place.name)}</strong><p>${escapeHTML(place.description)}</p>
    ${isMainGate ? "" : `<button class="map-route-button" data-action="route-to" data-place="${place.id}">Show route from Main Gate <span>↗</span></button>`}
    <span class="place-demo-note">Illustrative campus layout — not a surveyed map.</span>`;
}

function campusRouteMarkup() {
  const origin = campusPlaces.find((place) => place.id === "main-gate");
  const destination = campusPlaces.find((place) => place.id === routeDestinationId);
  if (!origin || !destination || destination.id === origin.id) return "";
  const startX = origin.x * 8;
  const startY = origin.y * 4.4;
  const endX = destination.x * 8;
  const endY = destination.y * 4.4;
  const midX = Math.round((startX + endX) / 2);
  return `<svg class="route-overlay" viewBox="0 0 800 440" preserveAspectRatio="none" aria-hidden="true"><path d="M${startX} ${startY} L${midX} ${startY} L${midX} ${endY} L${endX} ${endY}"/></svg>`;
}

function selectCampusPlace(placeId) {
  const place = campusPlaces.find((item) => item.id === placeId);
  if (!place) return;
  selectedPlaceId = placeId;
  routeDestinationId = "";
  const detail = modalRoot.querySelector("#map-place-detail");
  if (detail) {
    detail.innerHTML = campusPlaceDetailMarkup(place);
  }
  modalRoot.querySelector(".route-overlay")?.remove();
  modalRoot.querySelectorAll(".map-marker, .map-place-item").forEach((item) => {
    item.classList.toggle("selected", item.dataset.place === placeId);
  });
}

function drawCampusRoute(placeId) {
  const place = campusPlaces.find((item) => item.id === placeId);
  const visual = modalRoot.querySelector(".campus-map-visual");
  if (!place || !visual || place.id === "main-gate") return;
  routeDestinationId = placeId;
  visual.querySelector(".route-overlay")?.remove();
  visual.insertAdjacentHTML("beforeend", campusRouteMarkup());
  showToast(`Illustrative route to ${place.name} shown on the campus map.`);
}

function filterCampusPlaces(query) {
  const search = query.trim().toLowerCase();
  modalRoot.querySelectorAll(".map-marker, .map-place-item").forEach((item) => {
    const place = campusPlaces.find((entry) => entry.id === item.dataset.place);
    item.hidden = Boolean(search) && !`${place.name} ${place.type} ${place.description}`.toLowerCase().includes(search);
  });
}

function toggleLocationDemo() {
  locationSharingEnabled = !locationSharingEnabled;
  const toggle = modalRoot.querySelector(".location-toggle");
  const note = modalRoot.querySelector(".privacy-lock")?.nextElementSibling;
  if (toggle) {
    toggle.classList.toggle("enabled", locationSharingEnabled);
    toggle.textContent = locationSharingEnabled ? "Turn off" : "Enable demo";
  }
  if (note) {
    note.textContent = locationSharingEnabled
      ? "Demo opt-in is on for this screen only. Nothing is sent or saved."
      : "Your location is off. This demo does not transmit location.";
  }
}

function openStory(index) {
  storyIndex = (index + stories.length) % stories.length;
  const story = stories[storyIndex];
  const person = personById(story.person);
  modalRoot.innerHTML = `<div class="modal-backdrop" data-action="backdrop-close"><section class="story-modal" role="dialog" aria-modal="true" aria-label="${escapeHTML(person.name)}'s Strick">
    <div class="story-progress"><span></span></div><div class="story-modal-head">${avatar(person)}<div><strong>${escapeHTML(person.name)}</strong><small>${story.time} ago · ADUSTECH</small></div></div>
    <button class="modal-close" data-action="close-modal" aria-label="Close">×</button>
    <button class="story-nav story-prev" data-action="story-prev" aria-label="Previous Strick">‹</button><button class="story-nav story-next" data-action="story-next" aria-label="Next Strick">›</button>
    <div class="story-content">${escapeHTML(story.text)}</div>
    <div class="story-actions"><button class="story-like ${story.liked ? "liked" : ""}" data-action="story-like" aria-label="${story.liked ? "Unlike Strick" : "Like Strick"}"><span>${story.liked ? "♥" : "♡"}</span><small>${story.likes || 0}</small></button>
    <form class="story-reply" data-person="${story.person}"><input name="reply" maxlength="180" placeholder="Message ${escapeHTML(person.name.split(" ")[0])}…"><button aria-label="Send message">↗</button></form></div>
  </section></div>`;
  const progress = modalRoot.querySelector(".story-progress span");
  progress.addEventListener("animationend", () => openStory(storyIndex + 1), { once: true });
}

function closeModal() {
  modalRoot.innerHTML = "";
}

function toggleComments(postId) {
  const postCard = root.querySelector(`.post-card[data-post="${postId}"]`);
  const form = postCard?.querySelector(".comment-form");
  const list = postCard?.querySelector(".comment-list");
  if (!form || !list) return;
  form.hidden = false;
  list.hidden = false;
  const input = form.querySelector("input");
  input.focus();
  form.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

function handlePostAction(action, id) {
  const post = posts.find((item) => item.id === id);
  if (!post) return;
  if (action === "like") {
    post.liked = !post.liked;
    post.likes += post.liked ? 1 : -1;
    render();
  } else if (action === "bookmark") {
    post.saved = !post.saved;
    render();
    showToast(post.saved ? "Post saved to your bookmarks." : "Removed from your bookmarks.");
  } else if (action === "comment") {
    toggleComments(id);
  } else if (action === "share") {
    const shareUrl = `${window.location.origin}${window.location.pathname}#${id}`;
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(shareUrl).then(() => showToast("Post link copied.")).catch(() => showToast("Could not copy the link on this page."));
    } else {
      showToast("Share links are available when hosted on a secure site.");
    }
  } else if (action === "post-menu") {
    showToast("Thanks for helping keep this community respectful. Reporting tools are planned for a later phase.");
  }
}

function updateExploreResults(query) {
  const results = document.querySelector("#explore-results");
  if (!results) return;
  const lowered = query.trim().toLowerCase();
  const matches = posts.filter((post) => {
    const person = personById(post.person);
    return `${person.name} ${person.handle} ${post.text}`.toLowerCase().includes(lowered);
  });
  results.innerHTML = matches.length
    ? matches.map(postMarkup).join("")
    : `<div class="empty-state"><strong>No matches yet</strong>Try a person’s name or a different campus topic.</div>`;
}

function selectMedia(file) {
  if (!file) return;
  if (!file.type.startsWith("image/") && !file.type.startsWith("video/")) {
    showToast("Choose an image or video file.");
    return;
  }
  if (file.size > 25 * 1024 * 1024) {
    showToast("Choose a file smaller than 25 MB for this preview.");
    return;
  }
  if (selectedMediaUrl) URL.revokeObjectURL(selectedMediaUrl);
  selectedMediaUrl = URL.createObjectURL(file);
  selectedMediaType = file.type;
  const previewWrap = document.querySelector("#media-preview-wrap");
  const placeholder = document.querySelector("#camera-placeholder");
  if (!previewWrap || !placeholder) return;
  placeholder.hidden = true;
  previewWrap.hidden = false;
  previewWrap.innerHTML = file.type.startsWith("video/")
    ? `<video class="media-preview" controls src="${selectedMediaUrl}"></video>`
    : `<img class="media-preview" src="${selectedMediaUrl}" alt="Selected media preview">`;
}

function openNotifications() {
  const existing = document.querySelector(".notification-panel");
  if (existing) {
    existing.remove();
    return;
  }
  const panel = document.createElement("section");
  panel.className = "notification-panel";
  panel.innerHTML = `<h3>Notifications</h3><div class="notification-item"><strong>Sani Ibrahim</strong> liked your reply in Campus Gist.<time>12 minutes ago</time></div><div class="notification-item"><strong>Amina Yusuf</strong> shared a new Strick.<time>38 minutes ago</time></div><div class="notification-item"><strong>ADUSTECH Community</strong> Registration updates are available.<time>2 hours ago</time></div>`;
  document.body.append(panel);
  const outsideClick = (event) => {
    if (!panel.contains(event.target) && !event.target.closest(".notification-button")) {
      panel.remove();
      document.removeEventListener("click", outsideClick);
    }
  };
  setTimeout(() => document.addEventListener("click", outsideClick), 0);
}

document.addEventListener("click", async (event) => {
  const target = event.target.closest("button, [data-action]");
  if (!target) return;

  if (target.dataset.action === "auth-mode") {
    renderAuth(target.dataset.mode);
    return;
  }
  if (target.dataset.action === "sign-out") {
    let message = "";
    try {
      await window.AdustechAuth.signOut();
    } catch (error) {
      message = `Signed out on this device. Remote sign-out failed: ${error.message}`;
    }
    authenticatedAccount = null;
    document.querySelectorAll(".auth-signout").forEach((item) => { item.hidden = true; });
    renderAuth("signin", message, message ? "error" : "success");
    return;
  }
  if (target.dataset.action === "reload-admin") {
    loadAdminDashboard();
    return;
  }
  if (target.dataset.action === "save-role") {
    const account = authenticatedAccount;
    const userId = target.dataset.user;
    const select = [...adminRoot.querySelectorAll(".role-select")].find((item) => item.dataset.roleUser === userId);
    if (!account || !select) return;
    target.disabled = true;
    try {
      await window.AdustechAuth.updateMemberRole(account.session, account.profile.institution_id, userId, select.value);
      showToast("Member access updated and recorded in the audit log.");
      await loadAdminDashboard();
    } catch (error) {
      target.disabled = false;
      showToast(`Could not update member access: ${error.message}`);
    }
    return;
  }

  if (target.dataset.page) {
    event.preventDefault();
    navigate(target.dataset.page, target.dataset.filter);
    return;
  }
  const { action, id, index } = target.dataset;
  if (!action) return;
  if (["like", "bookmark", "comment", "share", "post-menu"].includes(action)) {
    handlePostAction(action, id);
  } else if (action === "view-story") {
    openStory(Number(index));
  } else if (action === "close-modal") {
    closeModal();
  } else if (action === "story-next") {
    openStory(storyIndex + 1);
  } else if (action === "story-prev") {
    openStory(storyIndex - 1);
  } else if (action === "story-like") {
    const story = stories[storyIndex];
    story.liked = !story.liked;
    story.likes = Math.max(0, (story.likes || 0) + (story.liked ? 1 : -1));
    const button = modalRoot.querySelector(".story-like");
    if (button) {
      button.classList.toggle("liked", story.liked);
      button.setAttribute("aria-label", story.liked ? "Unlike Strick" : "Like Strick");
      button.querySelector("span").textContent = story.liked ? "♥" : "♡";
      button.querySelector("small").textContent = story.likes;
    }
  } else if (action === "select-place") {
    selectCampusPlace(target.dataset.place);
  } else if (action === "route-to") {
    drawCampusRoute(target.dataset.place);
  } else if (action === "toggle-location") {
    toggleLocationDemo();
  } else if (action === "filter") {
    currentFilter = target.dataset.filter;
    render();
  } else if (action === "choose-media") {
    document.querySelector("#media-file")?.click();
  } else if (action === "clear-media") {
    if (selectedMediaUrl) URL.revokeObjectURL(selectedMediaUrl);
    selectedMediaUrl = "";
    selectedMediaType = "";
    render();
  } else if (action === "publish-demo") {
    if (!selectedMediaUrl) {
      showToast("Choose a photo or video first to preview a Strick.");
    } else {
      showToast("Preview ready. It has not been uploaded or published.");
    }
  } else if (action === "camera-info") {
    showToast("Live camera capture will be added after browser permission and device testing.");
  } else if (action === "map-info") {
    openCampusMap();
  } else if (action === "activity-info") {
    showToast("You’re all caught up on campus activity.");
  } else if (action === "caption-more") {
    const caption = target.closest(".post-copy");
    caption?.classList.toggle("expanded");
    target.textContent = caption?.classList.contains("expanded") ? "less" : "more";
  } else if (action === "add-emoji") {
    const input = document.querySelector("#feed-composer input");
    if (input) {
      input.value = `${input.value}${input.value ? " " : ""}😊`;
      input.focus();
    }
  } else if (action === "story-info") {
    showToast("Stricks are temporary campus moments. Stories expire after 24 hours in the production service.");
  } else if (action === "sort-feed") {
    showToast("Showing the campus feed for you.");
  } else if (action === "conversation") {
    activeConversation = Number(index);
    render();
  } else if (action === "edit-profile") {
    showToast("Profile editing will be added with account and profile storage.");
  } else if (action === "profile-tab") {
    if (target.dataset.tab === "saved") {
      const saved = posts.filter((post) => post.saved);
      document.querySelector("#profile-posts").innerHTML = saved.length
        ? saved.map(postMarkup).join("")
        : `<div class="empty-state"><strong>No saved posts yet</strong>Bookmark posts you want to come back to.</div>`;
      document.querySelectorAll(".profile-tabs button").forEach((button) => button.classList.toggle("active", button === target));
    } else {
      render();
    }
  } else if (action === "backdrop-close" && event.target === target) {
    closeModal();
  } else if (action === "map-backdrop-close" && event.target === target) {
    closeModal();
  }
});

document.addEventListener("submit", (event) => {
  if (event.target.matches("#auth-form")) {
    event.preventDefault();
    void submitAuthForm(event.target);
    return;
  }
  if (event.target.matches("#feed-composer")) {
    event.preventDefault();
    const input = event.target.elements.post;
    const text = input.value.trim();
    if (!text) {
      input.focus();
      showToast("Write a little something before sharing.");
      return;
    }
    posts.unshift({
      id: `local-${Date.now()}`,
      person: "usman",
      location: "ADUSTECH Main Campus",
      time: "now",
      text,
      image: "",
      likes: 0,
      comments: [],
      liked: false,
      saved: false
    });
    render();
    showToast("Your post was added to this local preview.");
  } else if (event.target.matches(".comment-form")) {
    event.preventDefault();
    const data = new FormData(event.target);
    const text = String(data.get("comment") || "").trim();
    const post = posts.find((item) => item.id === event.target.dataset.id);
    if (!text || !post) return;
    post.comments.push({ name: authenticatedAccount?.profile.full_name || "Student", text });
    render();
    showToast("Comment added in this local preview.");
  } else if (event.target.matches("#message-form")) {
    event.preventDefault();
    const input = event.target.elements.message;
    const text = input.value.trim();
    if (!text) return;
    const conversation = conversations[activeConversation];
    conversation.messages.push({ text, mine: true, time: new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }) });
    conversation.preview = text;
    render();
    document.querySelector("#chat-messages")?.scrollTo({ top: 9999, behavior: "smooth" });
  } else if (event.target.matches(".story-reply")) {
    event.preventDefault();
    const text = String(new FormData(event.target).get("reply") || "").trim();
    if (text) {
      const personId = event.target.dataset.person;
      let conversationIndex = conversations.findIndex((conversation) => conversation.person === personId);
      if (conversationIndex < 0) {
        conversations.unshift({ person: personId, preview: text, messages: [] });
        conversationIndex = 0;
      }
      const conversation = conversations[conversationIndex];
      conversation.messages.push({ text, mine: true, time: new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }) });
      conversation.preview = text;
      activeConversation = conversationIndex;
      closeModal();
      navigate("messages");
      showToast("Message added to this local demo conversation.");
    }
  }
});

document.addEventListener("input", (event) => {
  if (event.target.matches("#explore-search")) updateExploreResults(event.target.value);
  if (event.target.matches("#map-search")) filterCampusPlaces(event.target.value);
});

document.addEventListener("change", (event) => {
  if (event.target.matches("#media-file")) selectMedia(event.target.files[0]);
});

document.addEventListener("error", (event) => {
  if (!event.target.matches(".avatar img")) return;
  const image = event.target;
  const fallback = image.nextElementSibling;
  image.remove();
  if (fallback) fallback.style.display = "inline";
}, true);

document.querySelector(".notification-button").addEventListener("click", openNotifications);
void initializeAuthentication();

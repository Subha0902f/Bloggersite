require("dotenv").config();
const express = require("express");
const session = require("express-session");
const fs = require("fs");
const path = require("path");
const app = express();
const dataDir = path.join(__dirname, 'data');

// Helper functions to read/write JSON files
function readUsers() {
  try {
    const data = fs.readFileSync(path.join(dataDir, 'user.json'), 'utf8');
    return JSON.parse(data);
  } catch (err) {
    return [];
  }
}

function writeUsers(users) {
  fs.writeFileSync(path.join(dataDir, 'user.json'), JSON.stringify(users, null, 2));
}

function readPosts() {
  try {
    const data = fs.readFileSync(path.join(dataDir, 'post.json'), 'utf8');
    return JSON.parse(data);
  } catch (err) {
    return [];
  }
}

function writePosts(posts) {
  fs.writeFileSync(path.join(dataDir, 'post.json'), JSON.stringify(posts, null, 2));
}

function getAuthorInfo() {
    try {
        const data = fs.readFileSync(path.join(dataDir, "desk.json"), "utf8");
        return JSON.parse(data);
    } catch (err) {
        console.error("Error reading desk.json:", err);
        return {};
    }
}

function writeAuthorInfo(authorData) {
    fs.writeFileSync(path.join(dataDir, 'desk.json'), JSON.stringify(authorData, null, 2));
}

const author = getAuthorInfo();

/* -------------------- MIDDLEWARE -------------------- */

// tell express to use EJS
app.set("view engine", "ejs");

// allow form data (login / signup)
app.use(express.urlencoded({ extended: true }));

// allow JSON if needed later
app.use(express.json());

// session for login state
app.use(
  session({
    secret: "nexlog-secret-key",
    resave: false,
    saveUninitialized: false
  })
);

/* -------------------- ROUTES -------------------- */

// HOME PAGE
app.get("/", (req, res) => {
  const posts = readPosts();
  const profile = getAuthorInfo(); // Load profile data from desk.json
  res.render("index", {
    title: "NexLog - Modern Blogging Platform",

    // frontend expects these 👇
    user: req.session.user || null,
    profile: profile,   // from desk.json
    posts: posts,       // from posts.json
    stats: {},       // later from stats logic
    darkMode: false, // later from user settings
    view: "home"
  });
});

// LOGIN
app.post("/login", (req, res) => {
  const { email, password } = req.body;
  console.log('Login attempt:', email, password);

  const users = readUsers();
  console.log('Users:', users);

  const user = users.find(u => u.email === email && u.password === password);
  console.log('Found user:', user);

  if (user) {
    req.session.user = user;
    console.log('Login successful, redirecting');
    res.redirect("/");
  } else {
    console.log('Login failed, redirecting with error');
    res.redirect("/?error=login");
  }
});

// SIGNUP
app.post("/signup", (req, res) => {
  const { name, email, password } = req.body;
  console.log('Signup attempt:', name, email, password);

  const users = readUsers();
  console.log('Existing users:', users);

  // Check if user already exists
  if (users.find(u => u.email === email)) {
    console.log('User already exists');
    res.redirect("/?error=signup_exists");
  } else {
    const newUser = {
      id: Date.now().toString(),
      email: email,
      password: password // In real app, hash this
    };
    users.push(newUser);
    writeUsers(users);
    
    // Save initial profile data to desk.json
    const initialProfile = {
      name: name,
      bio: "",
      contact: "",
      passions: []
    };
    writeAuthorInfo(initialProfile);
    
    req.session.user = newUser;
    console.log('Signup successful, users now:', users);
    res.redirect("/");
  }
});


// LOGOUT
app.post("/logout", (req, res) => {
  req.session.destroy(() => {
    res.redirect("/");
  });
});

// UPDATE PROFILE - Save profile changes to desk.json
app.post("/profile/update", (req, res) => {
  try {
    if (!req.session.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { name, bio, contact, passions } = req.body;
    const currentProfile = getAuthorInfo();

    // Profile data to save to desk.json
    const profileData = {
      name: name || currentProfile.name || "",
      bio: bio || "",
      contact: contact || "",
      passions: passions || []
    };

    // Save profile changes to desk.json
    writeAuthorInfo(profileData);

    return res.json({ ok: true, profile: profileData });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// LOGOUT
app.post("/logout", (req, res) => {
  req.session.destroy(() => {
    res.redirect("/");
  });
});

// RESET - Clear session and go to login
app.get("/reset", (req, res) => {
  req.session.destroy(() => {
    res.redirect("/");
  });
});

// API: save author description
app.post('/author', (req, res) => {
  try {
    const authorData = req.body;
    if (!authorData) return res.status(400).json({ error: 'Missing author data' });
    
    writeAuthorInfo(authorData);
    return res.json({ ok: true, author: authorData });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// API: get author info
app.get('/author', (req, res) => {
  try {
    const authorData = getAuthorInfo();
    return res.json(authorData);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// API: get posts as JSON
app.get('/posts', (req, res) => {
  const posts = readPosts();
  res.json(posts);
});

// API: create new post
app.post('/posts', (req, res) => {
  try {
    const post = req.body;
    if (!post) return res.status(400).json({ error: 'Missing post body' });
    if (!post.id) post.id = Date.now().toString();
    post.createdAt = new Date().toISOString();

    const posts = readPosts();
    posts.unshift(post);
    writePosts(posts);

    return res.json({ ok: true, post });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// API: update existing post
app.put('/posts/:id', (req, res) => {
  try {
    const id = req.params.id;
    const data = req.body;
    let posts = readPosts();
    const idx = posts.findIndex(p => p.id === id);
    if (idx === -1) return res.status(404).json({ error: 'Post not found' });

    posts[idx] = Object.assign({}, posts[idx], data, { id: id });
    if (data.content) posts[idx].excerpt = data.content.substring(0, 140);
    writePosts(posts);

    return res.json({ ok: true, post: posts[idx] });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

/* -------------------- SERVER -------------------- */

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

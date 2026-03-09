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
    if (!fs.existsSync(path.join(dataDir, 'user.json'))) {
      return [];
    }
    const data = fs.readFileSync(path.join(dataDir, 'user.json'), 'utf8');
    return JSON.parse(data);
  } catch (err) {
    console.error('Error reading users:', err);
    return [];
  }
}

function writeUsers(users) {
  try {
    fs.writeFileSync(path.join(dataDir, 'user.json'), JSON.stringify(users, null, 2));
  } catch (err) {
    console.error('Error writing users:', err);
  }
}

function readPosts() {
  try {
    if (!fs.existsSync(path.join(dataDir, 'post.json'))) {
      return [];
    }
    const data = fs.readFileSync(path.join(dataDir, 'post.json'), 'utf8');
    return JSON.parse(data);
  } catch (err) {
    console.error('Error reading posts:', err);
    return [];
  }
}

function writePosts(posts) {
  try {
    fs.writeFileSync(path.join(dataDir, 'post.json'), JSON.stringify(posts, null, 2));
  } catch (err) {
    console.error('Error writing posts:', err);
  }
}

function getAuthorInfo(userId) {
    try {
        const users = readUsers();
        const user = users.find(u => u.id === userId);
        return user ? user.profile || {} : {};
    } catch (err) {
        console.error("Error reading user profile:", err);
        return {};
    }
}

function writeAuthorInfo(userId, authorData) {
    try {
        const users = readUsers();
        const userIndex = users.findIndex(u => u.id === userId);
        if (userIndex !== -1) {
            users[userIndex].profile = authorData;
            writeUsers(users);
        }
    } catch (err) {
        console.error("Error writing user profile:", err);
    }
}

const author = {}; // No longer needed - profiles are user-specific

/* -------------------- MIDDLEWARE -------------------- */

// tell express to use EJS
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// allow form data (login / signup)
app.use(express.urlencoded({ extended: true }));

// allow JSON if needed later
app.use(express.json());

// serve static files from public directory
app.use(express.static(path.join(__dirname, 'public')));

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
  try {
    const allPosts = readPosts();
    let posts = [];

    if (req.session.user) {
      // Filter posts to show only the current user's posts
      posts = allPosts.filter(post =>
        post.authorId === req.session.user.id ||
        post.authorEmail === req.session.user.email
      );
    }

    console.log('Session user:', req.session.user ? req.session.user.id : 'NOT LOGGED IN');
    console.log('Filtered posts count:', posts.length);
    const profile = req.session.user ? getAuthorInfo(req.session.user.id) : {};
    console.log('Loaded profile:', profile);
    res.render("index", {
      title: "NexLog - Modern Blogging Platform",

      // frontend expects these 👇
      user: req.session.user || null,
      profile: profile,   // from user-specific profile
      posts: posts,       // filtered posts for current user
      stats: {},       // later from stats logic
      darkMode: false, // later from user settings
      view: "home"
    });
  } catch (err) {
    console.error('Error in home route:', err);
    res.status(500).send('Internal Server Error');
  }
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
  const { name, username, email, password } = req.body;
  console.log('Signup attempt:', name, username, email, password);

  const users = readUsers();
  console.log('Existing users:', users);

  // Check if user already exists (by email or username)
  const existingUser = users.find(u => u.email === email || u.username === username);
  if (existingUser) {
    console.log('User already exists');
    const errorType = existingUser.email === email ? 'email_exists' : 'username_exists';
    res.redirect(`/?error=signup_${errorType}`);
  } else {
    const newUser = {
      id: Date.now().toString(),
      username: username,
      email: email,
      password: password, // In real app, hash this
      name: name,
      profile: {
        name: name,
        username: username,
        bio: "",
        contact: "",
        passions: []
      }
    };
    users.push(newUser);
    writeUsers(users);
    
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

// UPDATE PROFILE - Save profile changes to user-specific profile
app.post("/profile/update", (req, res) => {
  try {
    if (!req.session.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { name, bio, contact, passions, photo } = req.body;
    const currentProfile = getAuthorInfo(req.session.user.id);

    // Profile data to save to user profile
    const profileData = {
      name: name || currentProfile.name || "",
      bio: bio || "",
      contact: contact || "",
      passions: passions || []
    };

    // Handle photo upload
    if (photo && photo.startsWith('data:image/')) {
      // Extract base64 data
      const base64Data = photo.split(',')[1];
      const mimeType = photo.split(',')[0].split(':')[1].split(';')[0];
      const extension = mimeType.split('/')[1];
      
      // Generate filename
      const filename = `profile_${Date.now()}.${extension}`;
      const filepath = path.join(__dirname, 'public', 'uploads', filename);
      
      // Decode and save file
      const buffer = Buffer.from(base64Data, 'base64');
      fs.writeFileSync(filepath, buffer);
      
      // Store filename in profile
      profileData.photo = `/uploads/${filename}`;
    } else {
      // Keep existing photo if no new one
      profileData.photo = currentProfile.photo || null;
    }

    // Save profile changes to user-specific profile
    writeAuthorInfo(req.session.user.id, profileData);

    return res.json({ ok: true, profile: profileData });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// UPDATE SETTINGS
app.post("/settings/update", (req, res) => {
  try {
    if (!req.session.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { public: isPublic } = req.body;
    
    // Update user settings
    const users = readUsers();
    const userIndex = users.findIndex(u => u.email === req.session.user.email);
    if (userIndex === -1) {
      return res.status(404).json({ error: 'User not found' });
    }

    users[userIndex].settings = users[userIndex].settings || {};
    users[userIndex].settings.public = !!isPublic;
    
    writeUsers(users);
    
    // Update session
    req.session.user.settings = users[userIndex].settings;

    return res.json({ ok: true, settings: users[userIndex].settings });
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

// API: get author info (for current user)
app.get('/author', (req, res) => {
  try {
    if (!req.session.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    const authorData = getAuthorInfo(req.session.user.id);
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

// API: get public posts (all posts for read view)
app.get('/posts/public', (req, res) => {
  const posts = readPosts();
  // For public feed, include author information
  const users = readUsers();
  const postsWithAuthors = posts.map(post => {
    const author = users.find(u => u.id === post.authorId || u.email === post.authorEmail);
    return {
      ...post,
      authorName: author ? author.name : 'Unknown Author',
      authorUsername: author ? author.username : 'unknown'
    };
  });
  res.json(postsWithAuthors);
});

// API: create new post
app.post('/posts', (req, res) => {
  try {
    if (!req.session.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const post = req.body;
    if (!post) return res.status(400).json({ error: 'Missing post body' });
    if (!post.id) post.id = Date.now().toString();
    post.createdAt = new Date().toISOString();

    // Ensure post is associated with current user
    post.authorId = req.session.user.id;
    post.authorEmail = req.session.user.email;

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
    if (!req.session.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const id = req.params.id;
    const data = req.body;
    let posts = readPosts();
    const idx = posts.findIndex(p => p.id === id);

    if (idx === -1) return res.status(404).json({ error: 'Post not found' });

    // Check if user owns this post
    const post = posts[idx];
    if (post.authorId !== req.session.user.id && post.authorEmail !== req.session.user.email) {
      return res.status(403).json({ error: 'You can only edit your own posts' });
    }

    posts[idx] = Object.assign({}, posts[idx], data, { id: id });
    if (data.content) posts[idx].excerpt = data.content.substring(0, 140);
    writePosts(posts);

    return res.json({ ok: true, post: posts[idx] });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// API: search users
app.get('/api/search/users', (req, res) => {
  try {
    const query = req.query.q;
    if (!query) {
      return res.json({ users: [] });
    }

    const users = readUsers();

    // Filter users by username, name, or email (case-insensitive partial match)
    const matchingUsers = users.filter(user => {
      const searchTerm = query.toLowerCase();
      return (
        (user.username && user.username.toLowerCase().includes(searchTerm)) ||
        (user.name && user.name.toLowerCase().includes(searchTerm))
      );
    }).map(user => {
      const userProfile = getAuthorInfo(user.id) || {};
      return {
        id: user.id,
        username: user.username || user.name || user.email.split('@')[0], // Fallback for display
        name: user.name,
        email: user.email,
        bio: userProfile.bio || '',
        contact: userProfile.contact || '',
        photo: userProfile.photo || null
      };
    });

    res.json({ users: matchingUsers });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// API: get user profile by username
app.get('/api/users/:username', (req, res) => {
  try {
    const username = req.params.username;
    const users = readUsers();
    const user = users.find(u => u.username === username);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get user's posts
    const allPosts = readPosts();
    const userPosts = allPosts.filter(post => post.authorId === user.id);

    // Return only public profile information
    const userProfile = getAuthorInfo(user.id) || {};
    const publicProfile = {
      id: user.id,
      username: user.username,
      name: user.name,
      bio: userProfile.bio || '',
      contact: userProfile.contact || '',
      passions: userProfile.passions || [],
      photo: userProfile.photo || null,
      posts: userPosts // Add posts to the response
    };

    res.json({ ok: true, profile: publicProfile });
  } catch (err) {
    console.error('Error getting user profile:', err);
    return res.status(500).json({ error: err.message });
  }
});

/* -------------------- SERVER -------------------- */

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

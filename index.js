// require('dotenv').config(); // Load environment variables
// const express = require('express');
// const cors = require('cors');
// const mongoose = require('mongoose');
// const User = require('./models/User');
// const PostModel = require('./models/Post');
// const bcrypt = require('bcryptjs');
// const jwt = require('jsonwebtoken');
// const cookieParser = require('cookie-parser');
// const multer = require('multer');
// const uploadMiddleware = multer({ dest: '/tmp' });

// const fs = require('fs');
// const cloudinary = require('cloudinary').v2;
// const path = require('path');

// const app = express();
// const secret = process.env.JWT_SECRET || 'defaultsecret';

// // Configure Cloudinary
// cloudinary.config({
//     cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
//     api_key: process.env.CLOUDINARY_API_KEY,
//     api_secret: process.env.CLOUDINARY_API_SECRET,
// });

// // Middleware
// app.use(
//     cors({
//         credentials: true,
//         origin: 'https://think-ink.vercel.app', // Removed trailing slash
//     })
// );



// app.use(express.json());
// app.use(cookieParser());
// app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// // MongoDB Connection
// // mongoose.connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true })
// //     .then(() => console.log('Connected to MongoDB'))
// //     .catch((err) => console.error('Error connecting to MongoDB:', err));
// const mongoURI = process.env.MONGODB_URI;


  
//   // Attempt to connect to MongoDB with the options
//   mongoose.connect(mongoURI)
//     .then(() => {
//       console.log('Connected to MongoDB');
//     })
//     .catch((err) => {
//       console.error('Error connecting to MongoDB:', err);
//     });
   

// // Register Endpoint
// app.post('/register', async (req, res) => {
//     try {
//         const { username, password } = req.body;

//         if (!username || !password) {
//             return res.status(400).json({ error: 'Username and password are required' });
//         }

//         const existingUser = await User.findOne({ username });
//         if (existingUser) {
//             return res.status(400).json({ error: 'Username already exists' });
//         }

//         const hashedPassword = await bcrypt.hash(password, 10);
//         const userDoc = await User.create({ username, password: hashedPassword });

//         res.status(201).json({ message: 'User registered successfully', user: userDoc });
//     } catch (err) {
//         console.error(err);
//         res.status(500).json({ error: 'Registration failed' });
//     }
// });

// // Login Endpoint
// app.post('/login', async (req, res) => {
//     try {
//         const { username, password } = req.body;

//         if (!username || !password) {
//             return res.status(400).json({ error: 'Username and password are required' });
//         }

//         const user = await User.findOne({ username });
//         if (!user) {
//             return res.status(400).json({ error: 'Invalid credentials' });
//         }

//         const isMatch = await bcrypt.compare(password, user.password);
//         if (!isMatch) {
//             return res.status(400).json({ error: 'Invalid credentials' });
//         }

//         const token = jwt.sign({ userId: user._id, username: user.username }, secret, { expiresIn: '1h' });
//         res.cookie('token', token, {
//             httpOnly: true,
//             secure: process.env.NODE_ENV === 'production',
//             sameSite: 'Strict',
//         });

//         res.status(200).json({ message: 'Login successful', username: user.username });
//     } catch (err) {
//         console.error('Error during login:', err);
//         res.status(500).json({ error: 'Login failed' });
//     }
// });

// // Profile Endpoint
// app.get('/profile', (req, res) => {
//     const { token } = req.cookies;
//     if (!token) {
//         return res.status(401).json({ error: 'Unauthorized' });
//     }

//     jwt.verify(token, secret, {}, (err, info) => {
//         if (err) {
//             return res.status(401).json({ error: 'Invalid token' });
//         }
//         res.json({ userId: info.userId, username: info.username });
//     });
// });

// // Logout Endpoint
// app.post('/logout', (req, res) => {
//     res.cookie('token', '', { maxAge: 0, httpOnly: true }).json({ message: 'Logged out successfully' });
// });

// // Post Creation Endpoint with Cloudinary Upload
// app.post('/post', uploadMiddleware.single('file'), async (req, res) => {
//     try {
//         const { token } = req.cookies;
//         if (!token) {
//             return res.status(401).json({ error: 'Unauthorized' });
//         }

//         jwt.verify(token, secret, async (err, info) => {
//             if (err) {
//                 return res.status(401).json({ error: 'Invalid token' });
//             }

//             const { title, summary, content } = req.body;
//             if (!title || !summary || !content) {
//                 return res.status(400).json({ error: 'Missing required fields' });
//             }

//             const filePath = req.file.path;
//             const cloudinaryResponse = await cloudinary.uploader.upload(filePath, {
//                 folder: 'posts/',
//                 resource_type: 'auto',
//             });

//             fs.unlinkSync(filePath);

//             const postDoc = await PostModel.create({
//                 title,
//                 summary,
//                 content,
//                 cover: cloudinaryResponse.secure_url,
//                 author: info.userId,
//             });

//             const populatedPost = await postDoc.populate('author', 'username');

//             res.status(201).json(populatedPost);
//         });
//     } catch (err) {
//         console.error('Error creating post:', err);
//         res.status(500).json({ error: 'Failed to create post' });
//     }
// });

// // PUT - Update Post with Cloudinary Integration
// app.put('/post/:id', uploadMiddleware.single('file'), async (req, res) => {
//     const { id } = req.params;
//     const { token } = req.cookies;

//     jwt.verify(token, secret, {}, async (err, info) => {
//         if (err) return res.status(401).json({ error: 'Unauthorized' });

//         const postDoc = await PostModel.findById(id);
//         if (!postDoc) return res.status(404).json({ error: 'Post not found' });

//         if (JSON.stringify(postDoc.author) !== JSON.stringify(info.userId)) {
//             return res.status(403).json({ error: 'Forbidden' });
//         }

//         const { title, summary, content } = req.body;
//         let newCoverUrl = postDoc.cover;

//         if (req.file) {
//             const filePath = req.file.path;
//             const cloudinaryResponse = await cloudinary.uploader.upload(filePath, {
//                 folder: 'posts/',
//                 resource_type: 'auto',
//             });

//             if (postDoc.cover) {
//                 const publicId = postDoc.cover.split('/').pop().split('.')[0];
//                 await cloudinary.uploader.destroy(`posts/${publicId}`);
//             }

//             newCoverUrl = cloudinaryResponse.secure_url;
//             fs.unlinkSync(filePath);
//         }

//         postDoc.title = title;
//         postDoc.summary = summary;
//         postDoc.content = content;
//         postDoc.cover = newCoverUrl;

//         await postDoc.save();

//         res.status(200).json(postDoc);
//     });
// });

// // DELETE - Delete Post with Cloudinary Integration
// app.delete('/post/:id', async (req, res) => {
//     const { id } = req.params;
//     const { token } = req.cookies;

//     jwt.verify(token, secret, {}, async (err, info) => {
//         if (err) return res.status(401).json({ error: 'Unauthorized' });

//         const postDoc = await PostModel.findById(id);
//         if (!postDoc) return res.status(404).json({ error: 'Post not found' });

//         if (JSON.stringify(postDoc.author) !== JSON.stringify(info.userId)) {
//             return res.status(403).json({ error: 'Forbidden' });
//         }

//         if (postDoc.cover) {
//             const publicId = postDoc.cover.split('/').pop().split('.')[0];
//             await cloudinary.uploader.destroy(`posts/${publicId}`);
//         }

//         await PostModel.findByIdAndDelete(id);

//         res.status(200).json({ success: true, message: 'Post deleted successfully' });
//     });
// });

// // Fetch All Posts
// app.get('/post', async (req, res) => {
//     try {
//         const posts = await PostModel.find()
//             .populate('author', 'username')
//             .sort({ createdAt: -1 })
//             .limit(20);

//         res.json(posts);
//     } catch (err) {
//         console.error('Error fetching posts:', err);
//         res.status(500).json({ error: 'Failed to fetch posts' });
//     }
// });

// // Fetch Post by ID
// app.get('/post/:id', async (req, res) => {
//     try {
//         const { id } = req.params;
//         const postDoc = await PostModel.findById(id).populate('author', 'username');
//         if (!postDoc) return res.status(404).json({ error: 'Post not found' });
//         res.json(postDoc);
//     } catch (err) {
//         console.error('Error fetching post by ID:', err);
//         res.status(500).json({ error: 'Failed to fetch post' });
//     }
// });

// // Start the Server
// module.exports = (req, res) => {
//     app(req, res); // Handles the request and response in a serverless function
// };
require('dotenv').config(); // Load environment variables
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const User = require('./models/User');
const PostModel = require('./models/Post');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const multer = require('multer');
const uploadMiddleware = multer({ dest: '/tmp' });
const fs = require('fs');
const cloudinary = require('cloudinary').v2;
const path = require('path');

const app = express();
const secret = process.env.JWT_SECRET || 'defaultsecret';

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Middleware
app.use(cors({
    credentials: true,
    origin: 'https://think-ink.vercel.app',
}));
app.use(express.json());
app.use(cookieParser());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// MongoDB Connection
const mongoURI = process.env.MONGODB_URI;

mongoose.connect(mongoURI, {
   
})
    .then(() => console.log('Connected to MongoDB'))
    .catch((err) => console.error('Error connecting to MongoDB:', err));

// Helper function to verify JWT token
// function verifyToken(req, res, next) {
//     const { token } = req.cookies;
//     if (!token) {
//         return res.status(401).json({ error: 'Unauthorized' });
//     }

//     jwt.verify(token, secret, (err, info) => {
//         if (err) {
//             return res.status(401).json({ error: 'Invalid token' });
//         }
//         req.userInfo = info; // Store user info in the request for later use
//         next();
//     });
// }

// Register Endpoint
app.post('/register', async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password are required' });
        }

        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(400).json({ error: 'Username already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const userDoc = await User.create({ username, password: hashedPassword });

        res.status(201).json({ message: 'User registered successfully', user: userDoc });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Registration failed' });
    }
});

// Login Endpoint
app.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password are required' });
        }

        const user = await User.findOne({ username });
        if (!user) {
            return res.status(400).json({ error: 'Invalid credentials' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ error: 'Invalid credentials' });
        }

        const token = jwt.sign({ userId: user._id, username: user.username }, secret, { expiresIn: '1h' });
        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'Strict',
        });

        res.status(200).json({ message: 'Login successful', username: user.username });
    } catch (err) {
        console.error('Error during login:', err);
        res.status(500).json({ error: 'Login failed' });
    }
});

// Profile Endpoint
// app.get('/profile', verifyToken, (req, res) => {
//     res.json({ userId: req.userInfo.userId, username: req.userInfo.username });
// });
app.get('/profile', (req, res) => {
        const { token } = req.cookies;
        if (!token) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
    
        jwt.verify(token, secret, {}, (err, info) => {
            if (err) {
                return res.status(401).json({ error: 'Invalid token' });
            }
            res.json({ userId: info.userId, username: info.username });
        });
    });
// Logout Endpoint
app.post('/logout', (req, res) => {
    res.cookie('token', '', { maxAge: 0, httpOnly: true }).json({ message: 'Logged out successfully' });
});

// Post Creation Endpoint with Cloudinary Upload
// app.post('/post', verifyToken, uploadMiddleware.single('file'), async (req, res) => {
//     try {
//         const { title, summary, content } = req.body;

//         if (!title || !summary || !content) {
//             return res.status(400).json({ error: 'Missing required fields' });
//         }

//         const filePath = req.file.path;
//         const cloudinaryResponse = await cloudinary.uploader.upload(filePath, {
//             folder: 'posts/',
//             resource_type: 'auto',
//         });

//         fs.unlinkSync(filePath);

//         const postDoc = await PostModel.create({
//             title,
//             summary,
//             content,
//             cover: cloudinaryResponse.secure_url,
//             author: req.userInfo.userId,
//         });

//         const populatedPost = await postDoc.populate('author', 'username');

//         res.status(201).json(populatedPost);
//     } catch (err) {
//         console.error('Error creating post:', err);
//         res.status(500).json({ error: 'Failed to create post' });
//     }
// });
app.post('/post', uploadMiddleware.single('file'), async (req, res) => {
    try {
        const { originalname, path: tempPath } = req.file;
        const extension = path.extname(originalname);
        const newPath = tempPath + extension;

        fs.renameSync(tempPath, newPath);  // Rename the file with the proper extension
        const { token } = req.cookies;
        if (!token) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        // Verify the token
        jwt.verify(token, secret, async (err, info) => {
            if (err) {
                return res.status(401).json({ error: 'Invalid token' });
            }

            const { title, summary, content } = req.body;

            // Validate request body
            if (!title || !summary || !content) {
                return res.status(400).json({ error: 'Missing required fields' });
            }

            // Upload the image to Cloudinary
            const cloudinaryResponse = await cloudinary.uploader.upload(newPath, {
                folder: 'posts/',  // Specify the folder in Cloudinary
                resource_type: 'auto',  // Let Cloudinary automatically detect the file type
            });

            // Delete the file after uploading it to Cloudinary
            fs.unlinkSync(newPath);

            // Create the post with the Cloudinary image URL
            const postDoc = await PostModel.create({
                title,
                summary,
                content,
                cover: cloudinaryResponse.secure_url,  // Use the secure URL from Cloudinary
                author: info.userId, // Use the userId from the token info
            });

            // Populate the author field with the user's details
            const populatedPost = await postDoc.populate('author', 'username');

            res.status(201).json(populatedPost);  // Return the post with author details
        });
    } catch (err) {
        console.error('Error creating post:', err);
        res.status(500).json({ error: 'Failed to create post' });
    }
});


// Update Post
// app.put('/post/:id', verifyToken, uploadMiddleware.single('file'), async (req, res) => {
//     try {
//         const { id } = req.params;
//         const postDoc = await PostModel.findById(id);

//         if (!postDoc) {
//             return res.status(404).json({ error: 'Post not found' });
//         }

//         if (String(postDoc.author) !== String(req.userInfo.userId)) {
//             return res.status(403).json({ error: 'Forbidden' });
//         }

//         const { title, summary, content } = req.body;
//         let newCoverUrl = postDoc.cover;

//         if (req.file) {
//             const filePath = req.file.path;
//             const cloudinaryResponse = await cloudinary.uploader.upload(filePath, {
//                 folder: 'posts/',
//                 resource_type: 'auto',
//             });

//             if (postDoc.cover) {
//                 const publicId = postDoc.cover.split('/').pop().split('.')[0];
//                 await cloudinary.uploader.destroy(`posts/${publicId}`);
//             }

//             newCoverUrl = cloudinaryResponse.secure_url;
//             fs.unlinkSync(filePath);
//         }

//         postDoc.title = title;
//         postDoc.summary = summary;
//         postDoc.content = content;
//         postDoc.cover = newCoverUrl;

//         await postDoc.save();

//         res.status(200).json(postDoc);
//     } catch (err) {
//         console.error('Error updating post:', err);
//         res.status(500).json({ error: 'Failed to update post' });
//     }
// });
app.put('/post/:id', uploadMiddleware.single('file'), async (req, res) => {
    const { id } = req.params;
    const { token } = req.cookies;
    
    // Verify the token and get user info
    jwt.verify(token, secret, {}, async (err, info) => {
        if (err) return res.status(401).json({ error: 'Unauthorized' });

        // Find the post by ID
        const postDoc = await PostModel.findById(id);
        if (!postDoc) return res.status(404).json({ error: 'Post not found' });

        // Ensure the user is the author of the post
        const isAuthor = JSON.stringify(postDoc.author) === JSON.stringify(info.userId);
        if (!isAuthor) return res.status(403).json({ error: 'Forbidden' });

        const { title, summary, content } = req.body;
        let newCoverUrl = postDoc.cover;  // Retain current cover URL if no new file is uploaded

        // Handle file upload path if file exists
        if (req.file) {
            // Upload the new file to Cloudinary
            const cloudinaryResponse = await cloudinary.uploader.upload(req.file.path, {
                folder: 'posts/',  // Specify the folder in Cloudinary
                resource_type: 'auto',  // Let Cloudinary automatically detect the file type
            });

            // Update the cover URL with the Cloudinary URL
            newCoverUrl = cloudinaryResponse.secure_url;

            // Remove the old file from Cloudinary if necessary
            if (postDoc.cover) {
                const oldFilePublicId = postDoc.cover.split('/').pop().split('.')[0];
                await cloudinary.uploader.destroy(`posts/${oldFilePublicId}`);  // Delete the old image from Cloudinary
            }

            // Delete the local file after upload (optional, as it's already done by multer)
            fs.unlinkSync(req.file.path);
        }

        // Update fields directly
        postDoc.title = title;
        postDoc.summary = summary;
        postDoc.content = content;
        postDoc.cover = newCoverUrl;  // Update cover image if a new file is uploaded

        // Save the updated document
        await postDoc.save();

        // Return the updated post
        res.status(200).json(postDoc);
    });
});


// Fetch All Posts
app.get('/post', async (req, res) => {
    try {
        const posts = await PostModel.find()
            .populate('author', 'username')
            .sort({ createdAt: -1 })
            .limit(20);

        res.json(posts);
    } catch (err) {
        console.error('Error fetching posts:', err);
        res.status(500).json({ error: 'Failed to fetch posts' });
    }
});

// Fetch Post by ID
app.get('/post/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const postDoc = await PostModel.findById(id).populate('author', 'username');
        if (!postDoc) return res.status(404).json({ error: 'Post not found' });
        res.json(postDoc);
    } catch (err) {
        console.error('Error fetching post by ID:', err);
        res.status(500).json({ error: 'Failed to fetch post' });
    }
});

// Delete Post
// app.delete('/post/:id', verifyToken, async (req, res) => {
//     try {
//         const { id } = req.params;
//         const postDoc = await PostModel.findById(id);

//         if (!postDoc) {
//             return res.status(404).json({ error: 'Post not found' });
//         }

//         if (String(postDoc.author) !== String(req.userInfo.userId)) {
//             return res.status(403).json({ error: 'Forbidden' });
//         }

//         if (postDoc.cover) {
//             const publicId = postDoc.cover.split('/').pop().split('.')[0];
//             await cloudinary.uploader.destroy(`posts/${publicId}`);
//         }

//         await PostModel.findByIdAndDelete(id);

//         res.status(200).json({ success: true, message: 'Post deleted successfully' });
//     } catch (err) {
//         console.error('Error deleting post:', err);
//         res.status(500).json({ error: 'Failed to delete post' });
//     }
// });
//Delete Post Endpoint (DELETE)
app.delete('/post/:id', async (req, res) => {
    const { id } = req.params;
    const { token } = req.cookies;

    jwt.verify(token, secret, {}, async (err, info) => {
        if (err) return res.status(401).json({ error: 'Unauthorized' });

        // Find the post by ID
        const postDoc = await PostModel.findById(id);
        if (!postDoc) return res.status(404).json({ error: 'Post not found' });

        // Ensure the user is the author of the post
        const isAuthor = JSON.stringify(postDoc.author) === JSON.stringify(info.userId);
        if (!isAuthor) return res.status(403).json({ error: 'Forbidden' });

        // Delete the post from the database
        await PostModel.findByIdAndDelete(id);

        // Remove the cover image from Cloudinary if it exists
        if (postDoc.cover) {
            const filePublicId = postDoc.cover.split('/').pop().split('.')[0];
            await cloudinary.uploader.destroy(`posts/${filePublicId}`);  // Delete the image from Cloudinary
        }

        res.status(200).json({ success: true, message: 'Post deleted successfully' });
    });
});

// Start the Server
module.exports = (req, res) => {
    app(req, res); // Handles the request and response in a serverless function
};

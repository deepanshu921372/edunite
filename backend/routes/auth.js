const express = require('express');
const router = express.Router();
const { verifyFirebaseToken } = require('../config/firebase');
const User = require('../models/User');
const UserRequest = require('../models/UserRequest');
const nodemailer = require('nodemailer');

// Email configuration
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Sign up route
router.post('/signup', async (req, res) => {
  try {
    const { firebaseToken } = req.body;

    if (!firebaseToken) {
      return res.status(400).json({ error: 'Firebase token required' });
    }

    const decodedToken = await verifyFirebaseToken(firebaseToken);
    const { uid, email, name } = decodedToken;

    // Check if user already exists
    let user = await User.findOne({ firebaseUid: uid });

    if (user) {
      return res.json({
        user,
        message: user.isApproved ? 'User already exists and approved' : 'Registration request pending approval'
      });
    }

    // Create new user
    user = new User({
      firebaseUid: uid,
      email: email || decodedToken.firebase.identities.email[0],
      name: name || decodedToken.name,
      role: 'student',
      isApproved: false
    });

    await user.save();

    // Send notification to admin (you can customize this)

    res.status(201).json({
      user,
      message: 'Registration request submitted. Please wait for admin approval.'
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Sign in route
router.post('/signin', async (req, res) => {
  try {
    const { firebaseToken } = req.body;

    if (!firebaseToken) {
      return res.status(400).json({ error: 'Firebase token required' });
    }

    const decodedToken = await verifyFirebaseToken(firebaseToken);
    const user = await User.findOne({ firebaseUid: decodedToken.uid });

    if (!user) {
      return res.status(404).json({ error: 'User not found. Please sign up first.' });
    }

    if (!user.isApproved) {
      return res.status(403).json({
        error: 'Account pending approval',
        message: 'Your account is still waiting for admin approval.'
      });
    }

    res.json({
      user,
      message: 'Signed in successfully'
    });
  } catch (error) {
    console.error('Signin error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Helper function to determine if user should be admin
const isAdminEmail = (email) => {
  const adminEmails = [
    'sharmadeepanshu1005@gmail.com', // Add specific admin emails
    'admin@edunite.com'
  ];
  const adminDomains = ['admin.edunite.com']; // Add admin domains if needed

  return adminEmails.includes(email.toLowerCase()) ||
         adminDomains.some(domain => email.toLowerCase().endsWith(`@${domain}`));
};

// Helper function to determine role and approval status
const getUserRoleAndApproval = (email) => {
  if (isAdminEmail(email)) {
    return { role: 'admin', isApproved: true }; // Admins are auto-approved
  }
  return { role: 'student', isApproved: false }; // Students need approval
};

// Combined login route (handles both signup and signin)
router.post('/login', async (req, res) => {
  try {
    const { uid, email, displayName } = req.body;

    if (!uid || !email) {
      return res.status(400).json({ error: 'User ID and email are required' });
    }

    // Check if user already exists
    let user = await User.findOne({ firebaseUid: uid });

    if (user) {
      // User exists - update role if needed (in case admin status changed)
      const { role: newRole, isApproved: newApproval } = getUserRoleAndApproval(email);

      // Update user role and approval if they became admin
      if (newRole === 'admin' && (user.role !== 'admin' || !user.isApproved)) {
        user.role = newRole;
        user.isApproved = newApproval;
        await user.save();
      }

      // Check if blocked
      if (user.isBlocked) {
        return res.status(403).json({
          error: 'Account blocked',
          message: 'You are not allowed to sign in, Please contact Admin for further proceedings.'
        });
      }

      // Check if approved (admins are always approved)
      if (!user.isApproved) {
        // Check if user was previously rejected - allow re-submission
        const lastRequest = await UserRequest.findOne({ userId: user._id }).sort({ requestedAt: -1 });

        if (lastRequest && lastRequest.status === 'rejected') {
          // Create new pending request for re-submission
          const newRequest = new UserRequest({
            userId: user._id,
            email: user.email,
            name: user.name,
            requestedRole: user.role,
            userProfile: {
            }
          });
          await newRequest.save();
        }

        const userForStorage = {
          firebaseUid: user.firebaseUid,
          email: user.email,
          name: user.name,
          displayName: displayName || user.name,
          role: user.role,
          isApproved: user.isApproved,
          _id: user._id
        };

        return res.status(403).json({
          error: 'Account pending approval',
          message: 'Account pending approval. You will receive an email when your account is verified.',
          user: user,
          userForStorage: userForStorage
        });
      }

      // Update user info and store in localStorage format
      const userResponse = {
        ...user.toObject(),
        displayName: displayName || user.name,
      };

      // Store user details in localStorage format for frontend
      const userForStorage = {
        firebaseUid: user.firebaseUid,
        email: user.email,
        name: user.name,
        displayName: displayName || user.name,
        role: user.role,
        isApproved: user.isApproved,
        _id: user._id
      };

      res.json({
        user: userResponse,
        userForStorage: userForStorage,
        message: 'Signed in successfully'
      });
    } else {
      // User doesn't exist - create new user
      try {
        const { role, isApproved } = getUserRoleAndApproval(email);

        user = new User({
          firebaseUid: uid,
          email: email,
          name: displayName || email.split('@')[0],
          role: role,
          isApproved: isApproved
        });

        await user.save();


        // Create a user request for non-admin users
        if (!user.isApproved) {
          const userRequest = new UserRequest({
            userId: user._id,
            email: user.email,
            name: user.name,
            requestedRole: user.role,
            userProfile: {
            }
          });
          await userRequest.save();
        }

        const userForStorage = {
          firebaseUid: user.firebaseUid,
          email: user.email,
          name: user.name,
          displayName: displayName || user.name,
          role: user.role,
          isApproved: user.isApproved,
          _id: user._id
        };

        if (user.isApproved) {
          // Admin user - auto approved
          res.status(201).json({
            user: user,
            userForStorage: userForStorage,
            message: 'Admin account created and approved successfully.'
          });
        } else {
          // Student/Teacher user - needs approval
          res.status(201).json({
            user: user,
            userForStorage: userForStorage,
            message: 'Registration request submitted. Please wait for admin approval.'
          });
        }
      } catch (saveError) {
        // Handle duplicate key error - user might have been created by another request
        if (saveError.code === 11000) {
          // Fetch the existing user and return it
          const existingUser = await User.findOne({ firebaseUid: uid });
          if (existingUser) {
            // Update role if needed (in case admin status changed)
            const { role: newRole, isApproved: newApproval } = getUserRoleAndApproval(email);

            if (newRole === 'admin' && (existingUser.role !== 'admin' || !existingUser.isApproved)) {
              existingUser.role = newRole;
              existingUser.isApproved = newApproval;
              await existingUser.save();
            }

            const userForStorage = {
              firebaseUid: existingUser.firebaseUid,
              email: existingUser.email,
              name: existingUser.name,
              displayName: displayName || existingUser.name,
                  role: existingUser.role,
              isApproved: existingUser.isApproved,
              _id: existingUser._id
            };

            if (!existingUser.isApproved) {
              return res.status(403).json({
                error: 'Account pending approval',
                message: 'Your account is still waiting for admin approval.',
                user: existingUser,
                userForStorage: userForStorage
              });
            }

            return res.json({
              user: existingUser,
              userForStorage: userForStorage,
              message: 'Signed in successfully'
            });
          }
        }
        throw saveError;
      }
    }
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update user profile
router.put('/profile', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1] || req.headers.authorization;

    if (!token) {
      return res.status(401).json({ error: 'Authorization token required' });
    }

    const decodedToken = await verifyFirebaseToken(token);
    const user = await User.findOne({ firebaseUid: decodedToken.uid });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Update user fields
    const updates = {};

    // Direct fields
    if (req.body.name !== undefined) {
      updates.name = req.body.name;
    }

    // Profile nested fields
    const profileFields = ['phoneNumber', 'address', 'class', 'schoolName', 'parentPhoneNumber'];
    const profileUpdates = {};

    profileFields.forEach(field => {
      if (req.body[field] !== undefined) {
        profileUpdates[`profile.${field}`] = req.body[field];
      }
    });

    // Merge profile updates with direct updates
    Object.assign(updates, profileUpdates);

    // Update user in database
    const updatedUser = await User.findByIdAndUpdate(
      user._id,
      { $set: updates },
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      user: updatedUser,
      message: 'Profile updated successfully'
    });

  } catch (error) {
    console.error('Profile update error:', error);

    if (error.name === 'ValidationError') {
      return res.status(400).json({
        error: 'Validation error',
        details: Object.values(error.errors).map(err => err.message)
      });
    }

    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user profile
router.get('/profile', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1] || req.headers.authorization;

    if (!token) {
      return res.status(401).json({ error: 'Authorization token required' });
    }

    const decodedToken = await verifyFirebaseToken(token);
    const user = await User.findOne({ firebaseUid: decodedToken.uid });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userForStorage = {
      firebaseUid: user.firebaseUid,
      email: user.email,
      name: user.name,
      displayName: user.name,
      role: user.role,
      isApproved: user.isApproved,
      _id: user._id,
      phoneNumber: user.profile?.phoneNumber,
      address: user.profile?.address,
      class: user.profile?.class,
      schoolName: user.profile?.schoolName,
      parentPhoneNumber: user.profile?.parentPhoneNumber
    };

    res.json({
      success: true,
      user: user,
      userForStorage: userForStorage,
      message: 'Profile retrieved successfully'
    });

  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Send approval email
const sendApprovalEmail = async (user) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: 'Account Approved - Edunite',
      html: `
        <h2>Congratulations! Your account has been approved</h2>
        <p>Hello ${user.name},</p>
        <p>Your Edunite account has been approved as a <strong>${user.role}</strong>.</p>
        <p>You can now sign in to your dashboard.</p>
        <a href="${process.env.FRONTEND_URL}/signin" style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Sign In Now</a>
        <br><br>
        <p>Best regards,<br>Edunite Team</p>
      `
    };

    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error('Error sending approval email:', error);
  }
};

module.exports = router;
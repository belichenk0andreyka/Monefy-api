const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const auth = require('../../middleware/auth');
const config = require('config');
const { check, validationResult } = require('express-validator/check');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const fetch = require('node-fetch');
const { PROVIDER_TYPES } = require('../../constants/constants');

const client = new OAuth2Client('535101318047-2hk9cabc41oq6ka4qk33mipnn5ntlfik.apps.googleusercontent.com');

const User = require('../../models/User');


// @route   GET api/auth
// @desc    Test route
// @access  Public
router.get('/', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        res.json(user);
    } catch (e) {
        console.log(e.message);
        res.status(500).send('Server Error');
    }
});

// @route   POST api/auth
// @desc    Authenticate user & get token
// @access  Public
router.post('/',
    [
        check('email', 'Please include a valid email').isEmail(),
        check('password', 'Password is required').exists(),
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            // return res.status(400).json({errors: errors.array()})
            return res.status(200).json({ msg: 'You are enter invalid data' })
        }

        const { email, password } = req.body;
        try {
            let user = await User.findOne({ email, provider: PROVIDER_TYPES.USER });

            // See if user exists
            if (!user) {
                // return res.status(400).json({errors: [{msg: 'Invalid credentials'}]});
                return res.status(200).json({ msg: 'Invalid credentials' });
            }

            const isMatch = await bcrypt.compare(password, user.password);

            if (!isMatch) {
                // return res.status(400).json({errors: [{msg: 'Invalid credentials'}]});
                return res.status(200).json({ msg: 'Invalid credentials' });
            }

            const payload = {
                user: {
                    id: user.id
                }
            };

            jwt.sign(
                payload,
                config.get('jwtSecret'),
                {expiresIn: 360000},
                (err, token) => {
                    if (err) throw err;
                    res.json({token});
                }
            );
            // res.send('User registered');

        } catch (e) {
            console.log(e.message);
            res.status(500).send('Server error');
        }
    });

// @route   POST api/auth/google
// @desc    Authenticate or register user & get token
// @access  Public
router.post('/google', async (req, res) => {
    const { tokenId } = req.body;

    const googleClient = await client.verifyIdToken({ idToken: tokenId, audience: '535101318047-2hk9cabc41oq6ka4qk33mipnn5ntlfik.apps.googleusercontent.com' })
    const { email, name, email_verified } = googleClient.payload;
    if (email_verified) {
        let user = await User.findOne({ email, provider: PROVIDER_TYPES.GOOGLE });
        if (!user) {
            user = new User({
                name,
                email,
                provider: PROVIDER_TYPES.GOOGLE,
            });
            await user.save();
        }
        const payload = {
            user: {
                id: user.id
            }
        };
        jwt.sign(
            payload,
            config.get('jwtSecret'),
            {expiresIn: 360000},
            (err, token) => {
                if (err) throw err;
                res.json({token});
            }
        );
    }
});

// @route   POST api/auth/facebook
// @desc    Authenticate or register user & get token
// @access  Public
router.post('/facebook', async (req, res) => {
    const { accessToken, userID } = req.body;
    let urlGraphFacebook = `https://graph.facebook.com/v2.11/${userID}/?fields=name,email&access_token=${accessToken}`;
    const facebookResponse = await fetch(urlGraphFacebook, {
        method: 'GET'
    });
    const facebookParse = await facebookResponse.json();
    if (facebookParse.email) {
        let user = await User.findOne({ email: facebookParse.email, provider: PROVIDER_TYPES.FACEBOOK });
        if (!user) {
            user = new User({
                name: facebookParse.name,
                email: facebookParse.email,
                provider: PROVIDER_TYPES.FACEBOOK,
            });
            await user.save();
        }
        const payload = {
            user: {
                id: user.id
            }
        };
        jwt.sign(
            payload,
            config.get('jwtSecret'),
            {expiresIn: 360000},
            (err, token) => {
                if (err) throw err;
                res.json({token});
            }
        );
    } else {
        return res.status(200).json({ msg: 'Facebook without email' });
    }
});

module.exports = router;

const express = require('express');
const router = express.Router();
const User = require('../models/user.js');
const wrapAsync = require('../utils/wrapAsync.js');
const passport = require('passport');
const { requireLogin } = require('../utils/auth.js');
const Listing = require('../models/listing.js');

router.get('/signup', (req, res) => {
  res.render('users/signup.ejs');
});

router.get('/login', (req, res) => {
  res.render('users/login.ejs');
});

router.get(
  '/profile',
  requireLogin,
  wrapAsync(async (req, res) => {
    const listings = await Listing.find({ owner: req.user._id });
    res.render('users/profile', { listings });
  })
);

router.get(
  '/profile/favorites',
  requireLogin,
  wrapAsync(async (req, res) => {
    const user = await User.findById(req.user._id).populate('favorites');
    res.render('users/favorites', {
      favorites: user.favorites.filter(Boolean),
    });
  })
);

router.get(
  '/profile/bookings',
  requireLogin,
  wrapAsync(async (req, res) => {
    const Booking = require('../models/booking.js');
    const bookings = await Booking.find({ user: req.user._id })
      .populate('listing')
      .sort({ createdAt: -1 });
    res.render('users/bookings', {
      bookings: bookings.filter((booking) => booking.listing),
    });
  })
);

router.post(
  '/listings/:id/favorite',
  requireLogin,
  wrapAsync(async (req, res) => {
    const listingId = req.params.id;
    const hasFavorite = (req.user.favorites || []).some((favorite) =>
      favorite.equals(listingId)
    );
    await User.findByIdAndUpdate(
      req.user._id,
      hasFavorite
        ? { $pull: { favorites: listingId } }
        : { $addToSet: { favorites: listingId } }
    );
    req.flash(
      'success',
      hasFavorite ? 'Removed from favorites.' : 'Saved to your favorites.'
    );
    res.redirect(`/listings/${listingId}`);
  })
);

router.post(
  '/signup',
  wrapAsync(async (req, res, next) => {
    try {
      const { username, email, password } = req.body;
      const newUser = new User({ email, username });
      const registeredUser = await User.register(newUser, password);
      req.login(registeredUser, (err) => {
        if (err) return next(err);
        req.flash('success', `Welcome to Hotel4u, ${username}.`);
        res.redirect('/listings');
      });
    } catch (err) {
      req.flash('error', err.message);
      res.redirect('/signup');
    }
  })
);

router.post(
  '/login',
  passport.authenticate('local', {
    failureRedirect: '/login',
    failureFlash: 'Invalid username or password.',
  }),
  (req, res) => {
    req.flash('success', `Welcome back, ${req.user.username}.`);
    res.redirect('/listings');
  }
);

router.post('/logout', (req, res, next) => {
  req.logout((err) => {
    if (err) return next(err);
    req.flash('success', 'You have been signed out.');
    res.redirect('/');
  });
});

module.exports = router;

const express = require('express');
const router = express.Router();
const wrapAsync = require('../utils/wrapAsync.js');
const ExpressError = require('../utils/ExpressError.js');
const { requireLogin } = require('../utils/auth.js');
const Booking = require('../models/booking.js');
const Listing = require('../models/listing.js');

router.post(
  '/listings/:id/book',
  requireLogin,
  wrapAsync(async (req, res) => {
    const listing = await Listing.findById(req.params.id);
    if (!listing) {
      req.flash('error', 'That stay is no longer available.');
      return res.redirect('/listings');
    }

    const checkIn = new Date(req.body.checkIn);
    const checkOut = new Date(req.body.checkOut);
    const guests = Number(req.body.guests);
    const nights = Math.ceil((checkOut - checkIn) / 86400000);

    if (
      !Number.isFinite(checkIn.getTime()) ||
      !Number.isFinite(checkOut.getTime()) ||
      nights < 1 ||
      !Number.isInteger(guests) ||
      guests < 1 ||
      guests > 20
    ) {
      throw new ExpressError(
        400,
        'Please provide valid dates and guest details.'
      );
    }

    const booking = new Booking({
      listing: listing._id,
      user: req.user._id,
      checkIn,
      checkOut,
      guests,
      totalPrice: nights * listing.price,
    });
    await booking.save();
    req.flash('success', 'Your stay is confirmed.');
    res.redirect('/profile/bookings');
  })
);

router.post(
  '/bookings/:id/cancel',
  requireLogin,
  wrapAsync(async (req, res) => {
    await Booking.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { status: 'cancelled' }
    );
    req.flash('success', 'Booking cancelled.');
    res.redirect('/profile/bookings');
  })
);

module.exports = router;

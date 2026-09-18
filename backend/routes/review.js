const express = require('express');
const router = express.Router({ mergeParams: true });
const wrapAsync = require('../utils/wrapAsync.js');
const ExpressError = require('../utils/ExpressError.js');
const { listingSchema, reviewSchema } = require('../schema.js');
const Review = require('../models/review.js');
const Listing = require('../models/listing.js');
const { requireLogin } = require('../utils/auth.js');

const validateReview = (req, res, next) => {
  let { error } = reviewSchema.validate(req.body);
  if (error) {
    let erMsg = error.details.map((el) => el.message).join(',');
    throw new ExpressError(400, erMsg);
  } else {
    next();
  }
};

// reviews
// post route
router.post(
  '/',
  requireLogin,
  validateReview,
  wrapAsync(async (req, res) => {
    let listing = await Listing.findById(req.params.id);
    let newReview = new Review({ ...req.body.review, author: req.user._id });

    listing.reviews.push(newReview);
    await newReview.save();
    await listing.save();
    req.flash('success', 'New Review Created!');
    res.redirect(`/listings/${listing._id}`);
  })
);

// delete review Route

router.delete(
  '/:reviewId',
  requireLogin,
  wrapAsync(async (req, res) => {
    let { id, reviewId } = req.params;

    const review = await Review.findOne({
      _id: reviewId,
      author: req.user._id,
    });
    if (!review) {
      req.flash('error', 'You can only delete your own reviews.');
      return res.redirect(`/listings/${id}`);
    }
    await Listing.findByIdAndUpdate(id, { $pull: { reviews: reviewId } });
    await review.deleteOne();
    req.flash('success', 'Review deleted!');
    res.redirect(`/listings/${id}`);
  })
);

module.exports = router;

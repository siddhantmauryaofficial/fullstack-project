const express = require('express');
const router = express.Router();
const wrapAsync = require('../utils/wrapAsync.js');
const ExpressError = require('../utils/ExpressError.js');
const { listingSchema, reviewSchema } = require('../schema.js');
const Listing = require('../models/listing.js');
const { requireLogin, requireOwner } = require('../utils/auth.js');
const { getRecommendations } = require('../utils/recommendations.js');

const validateListing = (req, res, next) => {
  let { error } = listingSchema.validate(req.body);
  if (error) {
    let erMsg = error.details.map((el) => el.message).join(',');
    throw new ExpressError(400, erMsg);
  } else {
    next();
  }
};

// index route

router.get(
  '/',
  wrapAsync(async (req, res) => {
    const { q, location, minPrice, maxPrice, sort } = req.query;
    const filters = {};
    if (q) {
      filters.$or = [
        { title: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } },
        { location: { $regex: q, $options: 'i' } },
        { country: { $regex: q, $options: 'i' } },
      ];
    }
    if (location) filters.location = { $regex: location, $options: 'i' };
    if (minPrice || maxPrice) {
      filters.price = {};
      if (minPrice) filters.price.$gte = Number(minPrice);
      if (maxPrice) filters.price.$lte = Number(maxPrice);
    }
    let query = Listing.find(filters);
    if (sort === 'price-asc') query = query.sort({ price: 1 });
    if (sort === 'price-desc') query = query.sort({ price: -1 });
    if (sort === 'newest') query = query.sort({ _id: -1 });
    const allListings = await query;
    res.render('listing/index', {
      allListings,
      q,
      location,
      minPrice,
      maxPrice,
      sort,
    });
  })
);

// New route

router.get('/new.ejs', requireLogin, (req, res) => {
  res.render('listing/new');
});

// show route
router.get(
  '/:id',
  wrapAsync(async (req, res, next) => {
    let { id } = req.params;
    const listing = await Listing.findById(id)
      .populate({ path: 'reviews', populate: { path: 'author' } })
      .populate('owner');
    console.log('Show route id:', id);
    console.log('Show route listing:', listing);
    if (!listing) {
      req.flash('error', "Listing you requested doesn't exist!");
      return res.redirect('/listings');
    }
    const otherListings = await Listing.find({
      _id: { $ne: listing._id },
    }).populate('reviews');
    const recommendations = getRecommendations(listing, otherListings);
    res.render('listing/show', { listing, recommendations });
  })
);

// helper for image normalization
function normalizeListingImage(data) {
  if (!data || !data.image) return;
  if (typeof data.image === 'string') {
    const maybeUrl = data.image.trim();
    if (maybeUrl && maybeUrl !== '[object Object]') {
      data.image = { url: maybeUrl };
    } else {
      data.image = undefined;
    }
    return;
  }
  if (typeof data.image === 'object') {
    if (data.image.url && typeof data.image.url === 'string') {
      data.image.url = data.image.url.trim();
      if (!data.image.url) delete data.image.url;
    }
    if (!data.image.url) {
      data.image = undefined;
    }
  }
}

// create route

router.post(
  '/',
  requireLogin,
  validateListing,
  wrapAsync(async (req, res, next) => {
    let result = listingSchema.validate(req.body);
    console.log(result);
    if (res.error) {
      throw new ExpressError(400, result.error);
    }
    const listingData = { ...req.body.listing };
    normalizeListingImage(listingData);
    const newListing = new Listing({ ...listingData, owner: req.user._id });
    await newListing.save();
    req.flash('success', 'New Listing Created!');
    res.redirect('/listings');
  })
);

// edit route

router.get(
  '/:id/edit',
  requireLogin,
  requireOwner,
  wrapAsync(async (req, res) => {
    let { id } = req.params;
    const listing = await Listing.findById(id);
    if (!listing) {
      req.flash('error', "Listing you requested doesn't exist!");
      return res.redirect('/listings');
    }
    res.render('listing/edit', { listing });
  })
);

// update route

router.put(
  '/:id',
  requireLogin,
  requireOwner,
  validateListing,
  wrapAsync(async (req, res) => {
    let { id } = req.params;
    const listingData = { ...req.body.listing };
    normalizeListingImage(listingData);
    await Listing.findByIdAndUpdate(id, listingData, { runValidators: true });

    req.flash('success', 'Listing Updated!');

    res.redirect(`/listings/${id}`);
  })
);

// delete route

router.delete(
  '/:id',
  requireLogin,
  requireOwner,
  wrapAsync(async (req, res) => {
    let { id } = req.params;
    let deletedListing = await Listing.findOneAndDelete({ _id: id });
    console.log(deletedListing);
    req.flash('success', 'Listing deleted');
    res.redirect('/listings');
  })
);

module.exports = router;

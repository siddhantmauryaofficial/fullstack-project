const requireLogin = (req, res, next) => {
  if (!req.isAuthenticated()) {
    req.flash('error', 'Please sign in to continue.');
    return res.redirect('/login');
  }
  next();
};

const requireOwner = async (req, res, next) => {
  const Listing = require('../models/listing.js');
  const listing = await Listing.findById(req.params.id);
  if (!listing) {
    req.flash('error', "Listing you requested doesn't exist!");
    return res.redirect('/listings');
  }
  if (!listing.owner || !listing.owner.equals(req.user._id)) {
    req.flash('error', 'Only the host who created this stay can change it.');
    return res.redirect(`/listings/${listing._id}`);
  }
  next();
};

module.exports = { requireLogin, requireOwner };

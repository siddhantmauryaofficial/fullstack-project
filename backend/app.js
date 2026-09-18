const util = require('util');
if (!util.isArray) util.isArray = Array.isArray;
// ... rest of your existing code stays the same
require('dotenv').config();
const dns = require('dns');
dns.setServers(
  (process.env.DNS_SERVERS || '1.1.1.1,8.8.8.8')
    .split(',')
    .map((server) => server.trim())
    .filter(Boolean)
);
const express = require('express');
const app = express();
const mongoose = require('mongoose');
const Listing = require('./models/listing.js');
const { data: sampleListings } = require('./init/data.js');
const path = require('path');
const { render } = require('ejs');
const methodOverride = require('method-override');
const ejsMate = require('ejs-mate');
const wrapAsync = require('./utils/wrapAsync.js');
const ExpressError = require('./utils/ExpressError.js');
const { listingSchema, reviewSchema } = require('./schema.js');
const Review = require('./models/review.js');
const session = require('express-session');
const flash = require('connect-flash');
const passport = require('passport');
const LocalStrategy = require('passport-local');
const User = require('./models/user.js');

const MONGO_URL = process.env.MONGO_URL;

if (!MONGO_URL) {
  throw new Error('MONGO_URL is missing. Add it to your .env file.');
}

const listingsRouter = require('./routes/listing.js');
const reviewsRouter = require('./routes/review.js');
const userRouter = require('./routes/user.js');
const bookingRouter = require('./routes/booking.js');

async function main() {
  await mongoose.connect(MONGO_URL);
}

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '..', 'frontend', 'views'));
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method'));
app.engine('ejs', ejsMate);
app.use(express.static(path.join(__dirname, '..', 'frontend', 'public')));

const sessionOptions = {
  secret: process.env.SESSION_SECRET || 'hotel4u-development-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    expires: Date.now() + 7 * 24860 * 60 * 1000,
    maxAge: 7 * 24 * 60 * 60 * 1000,
    httpOnly: true,
  },
};

app.use(session(sessionOptions));
app.use(flash());

app.use(passport.initialize());
app.use(passport.session());
passport.use(
  new LocalStrategy(async (username, password, done) => {
    try {
      const user = await User.findOne({ username }).select('+hash +salt');
      if (!user)
        return done(null, false, { message: 'Invalid username or password.' });

      const result = await user.authenticate(password);
      if (!result.user) return done(null, false, result.error);
      done(null, result.user);
    } catch (err) {
      done(err);
    }
  })
);
passport.serializeUser((user, done) => done(null, user._id));
passport.deserializeUser(async (id, done) => {
  try {
    done(null, await User.findById(id));
  } catch (err) {
    done(err);
  }
});

app.use((req, res, next) => {
  res.locals.success = req.flash('success');
  res.locals.error = req.flash('error');
  res.locals.currentUser = req.user;
  next();
});

app.get('/', (req, res) => {
  res.render('home');
});

// app.get(
//   '/demouser',
//   wrapAsync(async (req, res) => {
//     await User.deleteOne({ email: 'siddhant@gmail.com' });
//     let fakeUser = new User({
//       email: 'siddhant@gmail.com',
//       username: 'siddhant',
//     });

//     let registeredUser = await User.register(fakeUser, 'helloworld');
//     res.send(registeredUser);
//   })
// );

// seed route (reset database from init/data.js)
app.get(
  '/seed',
  wrapAsync(async (req, res) => {
    await Listing.deleteMany({});
    await Listing.insertMany(sampleListings);
    res.redirect('/listings');
  })
);

app.use('/listings', listingsRouter);

app.use('/listings/:id/reviews', reviewsRouter);
app.use('/', bookingRouter);
app.use('/', userRouter);

app.all('/{*splat}', (req, res, next) => {
  next(new ExpressError(404, 'Page not found!'));
});

app.use((err, req, res, next) => {
  let { statusCode = 500, message = 'Something went wrong!' } = err;
  try {
    res.status(statusCode).render('error.ejs', { message });
  } catch (renderErr) {
    res.status(500).send('Internal Server Error');
  }
});

main()
  .then(() => {
    console.log('connected to DB');
    const port = process.env.PORT || 8080;
    app.listen(port, '0.0.0.0', () => {
      console.log(`server is listening on port ${port}`);
    });
  })
  .catch((err) => {
    console.error('Could not connect to MongoDB:', err.message);
    process.exitCode = 1;
  });

<<<<<<< HEAD
# Hotel4u

Hotel4u is a full-stack app for finding and booking places to stay. It's built with Express, MongoDB, EJS, and Passport. You can browse listings, save the ones you like, leave reviews, and book a stay — or list your own place if you're hosting.

## What it does

**For travelers**

- Search stays by title, description, location, or country
- Narrow things down with location and price filters
- Sort by price or by what's newest
- Save favorites and come back to them later
- Book a stay with check-in, check-out, and guest count — and cancel if plans change
- Leave a review with a rating

**For hosts**

- Create, edit, and delete your own listings
- Only you can modify your listings — ownership checks handle that

**Everything else**

- Signup, login, and logout with session-based auth
- A profile page pulling together your listings, favorites, and bookings
- Average ratings and reviewer names shown on each listing
- AI-inspired local recommendations based on destination, price, text similarity, and ratings
- Responsive layout that works on phones

## Built with

Node.js and Express 5 on the server, MongoDB with Mongoose for data, EJS (plus EJS Mate) for templating, and Passport with Passport Local Mongoose for auth. Bootstrap 5 handles the base styling, Joi validates incoming requests, and Express Session and Connect Flash manage sessions and flash messages.

## Before you start

You'll need Node.js 18 or newer, npm, and a MongoDB database. The app reads its connection string from `.env`:

```text
MONGO_URL=mongodb+srv://siddhantmauryaofficial_db_user:<db_password>@cluster0.7fhoxqr.mongodb.net/?appName=Cluster0
SESSION_SECRET=replace-this-with-a-long-random-secret
DNS_SERVERS=1.1.1.1,8.8.8.8
```

Replace `<db_password>` with the password for the Atlas database user. Do not commit `.env` or share its contents.

Recommendations run locally from listing data and do not require an external AI API key.

## Getting it running

Clone the repo, then from the project folder:

```bash
npm install
```

Make sure MongoDB is running, then start the server:

```bash
npm start
```

Or run it directly if you'd rather skip the auto-restart:

```bash
node app.js
```

It'll be at [http://localhost:8080](http://localhost:8080).

## Routes worth knowing

| Route                | What it's for                                |
| -------------------- | -------------------------------------------- |
| `/`                  | Home page                                    |
| `/listings`          | Browse and search stays                      |
| `/listings/new.ejs`  | Create a listing (signed in only)            |
| `/signup`            | Create an account                            |
| `/login`             | Sign in                                      |
| `/profile`           | Your profile and listings                    |
| `/profile/favorites` | Saved stays                                  |
| `/profile/bookings`  | View and cancel bookings                     |
| `/seed`              | Wipe and reload listings from `init/data.js` |

## Signing up

Head to `/signup`, enter a username, email, and password, and you're logged in right away. Your name shows up in the navbar — click it to get to your profile.

## Adding a stay

Sign in, hit **Add a stay** in the navbar, and fill out the form. If you leave the image URL as-is, it'll fall back to a default hotel image.

## A couple of notes on data

`GET /seed` is for development only — it wipes every existing listing before loading the samples from `init/data.js`. Don't point it at anything you care about.

Also worth knowing: listings created before ownership was added don't have an owner attached, so the edit and delete controls won't work on them.

## Deployment layout

The repository is split into two application areas:

```text
backend/       Express server, routes, models, validation, and database seed
frontend/      EJS templates, shared layout files, CSS, and browser JavaScript
```

This project currently uses server-rendered EJS, so the frontend is served by the Express backend. Deploy the repository to Render with `npm start` (or `node backend/app.js`). A completely independent Vercel frontend would require converting the EJS templates to React, Next.js, or another client framework.

## How it's organized

```text
backend/app.js      Express entry point
backend/models/     Mongoose schemas
backend/routes/     Listing, review, user, and booking routes
frontend/views/     EJS pages and layouts
frontend/public/    CSS and client-side JS
backend/utils/      Auth and async helpers
backend/schema.js   Joi validation schemas
backend/init/       Sample data and seed script
```

## Formatting

```bash
npm run format
```

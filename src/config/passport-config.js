import passport from 'passport';
import GoogleStrategy from 'passport-google-oauth20';
import mongoose from 'mongoose';
import mongodb from 'mongodb';
import crypto from 'crypto';
import Garden from '../models/garden';

const ObjectId = mongodb.ObjectID;

const User = mongoose.model('User');

passport.use(
  new GoogleStrategy(
    {
      callbackURL: process.env.GOOGLE_CALLBACK, // callback-url that gets called when Google returns successful
      clientID: process.env.GOOGLE_CLIENTID,
      clientSecret: process.env.GOOGLE_CLIENTSECRET,
    },
    async (accessToken, refreshToken, profile, done) => {
      const email = profile.emails[0].value;
      const name = profile.displayName;
      const userIdString = profile.id.toString();

      // ObjectId constructor can only take 24 bytes.
      const uidHash = crypto
        .createHmac('sha256', userIdString)
        .digest('hex')
        .slice(0, 24); // input: googleId --> hash() --> output: 24 byte hex string

      // check if user already exists
      const currentUser = await User.findById(new ObjectId(uidHash));
      console.log('current User: ', currentUser);
      if (!currentUser) {
        // create a new garden XXX
        const garden = await new Garden({
          name: name + "'s Garden",
        }).save();

        // register user and return
        const newUser = await new User({
          email: email,
          _id: new ObjectId(uidHash),
          name: name,
          gardenId: garden._id, // NOTE: type check
        }).save();
        return done(null, newUser);
      }
      return done(null, currentUser);
    },
  ),
);
const mongoose = require('mongoose');
const User = require('./models/User');
const connectDB = require('./config/db');

// Load environment variables (ensure MONGODB_URI is available)
const dotenv = require('dotenv');

dotenv.config({ path: '../.env' });

connectDB().then(() => {
    console.log('Connected to MongoDB Atlas');
    cleanUpInvalidIds();
}).catch(err => {
    console.error('Error connecting to MongoDB Atlas:', err);
    process.exit(1);
});

async function cleanUpInvalidIds() {
  try {
    // Connect to MongoDB Atlas

    // Find all users
    const users = await User.find();
    console.log(`Found ${users.length} users`);

    for (const user of users) {
      let updated = false;

      // Clean enrolledCourses
      if (user.enrolledCourses) {
        const validEnrolledCourses = user.enrolledCourses.filter(id => mongoose.isValidObjectId(id));
        if (validEnrolledCourses.length !== user.enrolledCourses.length) {
          user.enrolledCourses = validEnrolledCourses;
          updated = true;
          console.log(`User ${user.email}: Removed invalid enrolledCourses IDs`);
        }
      }

      // Clean pastCourses
      if (user.pastCourses) {
        const validPastCourses = user.pastCourses.filter(id => mongoose.isValidObjectId(id));
        if (validPastCourses.length !== user.pastCourses.length) {
          user.pastCourses = validPastCourses;
          updated = true;
          console.log(`User ${user.email}: Removed invalid pastCourses IDs`);
        }
      }

      // Clean recentlyViewedCourses
      if (user.recentlyViewedCourses) {
        const validRecentlyViewedCourses = user.recentlyViewedCourses.filter(id => mongoose.isValidObjectId(id));
        if (validRecentlyViewedCourses.length !== user.recentlyViewedCourses.length) {
          user.recentlyViewedCourses = validRecentlyViewedCourses;
          updated = true;
          console.log(`User ${user.email}: Removed invalid recentlyViewedCourses IDs`);
        }
      }

      // Clean recentlyViewedAssignments
      if (user.recentlyViewedAssignments) {
        const validRecentlyViewedAssignments = user.recentlyViewedAssignments.filter(id => mongoose.isValidObjectId(id));
        if (validRecentlyViewedAssignments.length !== user.recentlyViewedAssignments.length) {
          user.recentlyViewedAssignments = validRecentlyViewedAssignments;
          updated = true;
          console.log(`User ${user.email}: Removed invalid recentlyViewedAssignments IDs`);
        }
      }

      // Save the user if changes were made
      if (updated) {
        await user.save();
        console.log(`User ${user.email}: Updated successfully`);
      }
    }

    console.log('Cleanup completed');
    mongoose.connection.close();
  } catch (error) {
    console.error('Error during cleanup:', error);
    mongoose.connection.close();
  }
}

cleanUpInvalidIds();
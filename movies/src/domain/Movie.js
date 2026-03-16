const mongoose = require('mongoose');

const movieSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true,
    maxlength: [2000, 'Description cannot exceed 2000 characters']
  },
  genre: {
    type: String,
    required: [true, 'Genre is required'],
    trim: true,
    enum: ['Action', 'Comedy', 'Drama', 'Horror', 'Sci-Fi', 'Thriller', 'Romance', 'Adventure', 'Animation', 'Documentary', 'Other']
  },
  duration: {
    type: Number,
    required: [true, 'Duration is required'],
    min: [1, 'Duration must be at least 1 minute'],
    max: [600, 'Duration cannot exceed 600 minutes']
  },
  ageRating: {
    type: String,
    required: [true, 'Age rating is required'],
    enum: ['G', 'PG', 'PG-13', 'R', 'NC-17']
  },
  releaseDate: {
    type: Date,
    required: false
  },
  director: {
    type: String,
    required: false,
    trim: true,
    maxlength: [100, 'Director name cannot exceed 100 characters']
  }
}, {
  timestamps: true,
  toJSON: {
    transform: function(doc, ret) {
      ret.id = ret._id;
      delete ret._id;
      delete ret.__v;
      return ret;
    }
  }
});

// Index for faster queries
movieSchema.index({ title: 1 });
movieSchema.index({ genre: 1 });

const Movie = mongoose.model('Movie', movieSchema);

module.exports = Movie;

const mongoose = require('mongoose');
const Movie = require('../../src/domain/Movie');

describe('Movie Model', () => {
  beforeAll(async () => {
    // Povežemo se z testno bazo
    const mongoUri = process.env.MONGODB_URI;
    
    if (!mongoUri) {
      throw new Error('MONGODB_URI is not set in environment variables. Please check your .env file.');
    }

    try {
      await mongoose.connect(mongoUri, {
        dbName: 'test_movies_db', // Uporabimo testno bazo za teste
        serverSelectionTimeoutMS: 10000 // Timeout 10 sekund za Atlas
      });
      console.log('✅ Connected to MongoDB Atlas for testing');
    } catch (error) {
      console.error('❌ MongoDB connection failed:', error.message);
      console.error('Please check your MONGODB_URI in .env file');
      throw error;
    }
  }, 15000); // Povečan timeout na 15 sekund za Atlas povezavo

  afterAll(async () => {
    // Zapremo povezavo
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    // Počistimo bazo pred vsakim testom
    await Movie.deleteMany({});
  });

  describe('Movie Creation', () => {
    it('should create a movie with all required fields', async () => {
      const movieData = {
        title: 'The Matrix',
        description: 'A computer hacker learns about the true nature of reality',
        genre: 'Sci-Fi',
        duration: 136,
        ageRating: 'R'
      };

      const movie = new Movie(movieData);
      const savedMovie = await movie.save();

      expect(savedMovie._id).toBeDefined();
      expect(savedMovie.title).toBe('The Matrix');
      expect(savedMovie.description).toBe('A computer hacker learns about the true nature of reality');
      expect(savedMovie.genre).toBe('Sci-Fi');
      expect(savedMovie.duration).toBe(136);
      expect(savedMovie.ageRating).toBe('R');
      expect(savedMovie.createdAt).toBeDefined();
      expect(savedMovie.updatedAt).toBeDefined();
    });

    it('should create a movie with optional fields', async () => {
      const movieData = {
        title: 'Inception',
        description: 'A thief who steals corporate secrets',
        genre: 'Sci-Fi',
        duration: 148,
        ageRating: 'PG-13',
        releaseDate: new Date('2010-07-16'),
        director: 'Christopher Nolan'
      };

      const movie = new Movie(movieData);
      const savedMovie = await movie.save();

      expect(savedMovie.director).toBe('Christopher Nolan');
      expect(savedMovie.releaseDate).toBeDefined();
    });

    it('should trim whitespace from title', async () => {
      const movieData = {
        title: '  The Matrix  ',
        description: 'Description',
        genre: 'Sci-Fi',
        duration: 136,
        ageRating: 'R'
      };

      const movie = new Movie(movieData);
      const savedMovie = await movie.save();

      expect(savedMovie.title).toBe('The Matrix'); // Trimmed
    });
  });

  describe('Validation', () => {
    it('should fail if title is missing', async () => {
      const movieData = {
        description: 'Description',
        genre: 'Sci-Fi',
        duration: 136,
        ageRating: 'R'
      };

      const movie = new Movie(movieData);
      await expect(movie.save()).rejects.toThrow();
    });

    it('should fail if genre is invalid', async () => {
      const movieData = {
        title: 'Test Movie',
        description: 'Description',
        genre: 'InvalidGenre',
        duration: 136,
        ageRating: 'R'
      };

      const movie = new Movie(movieData);
      await expect(movie.save()).rejects.toThrow();
    });

    it('should fail if duration is less than 1', async () => {
      const movieData = {
        title: 'Test Movie',
        description: 'Description',
        genre: 'Action',
        duration: 0,
        ageRating: 'PG-13'
      };

      const movie = new Movie(movieData);
      await expect(movie.save()).rejects.toThrow();
    });

    it('should fail if ageRating is invalid', async () => {
      const movieData = {
        title: 'Test Movie',
        description: 'Description',
        genre: 'Action',
        duration: 120,
        ageRating: 'Invalid'
      };

      const movie = new Movie(movieData);
      await expect(movie.save()).rejects.toThrow();
    });
  });

  describe('JSON Transformation', () => {
    it('should transform _id to id in JSON', async () => {
      const movieData = {
        title: 'Test Movie',
        description: 'Description',
        genre: 'Action',
        duration: 120,
        ageRating: 'PG-13'
      };

      const movie = await Movie.create(movieData);
      const json = movie.toJSON();

      expect(json.id).toBeDefined();
      expect(json._id).toBeUndefined();
      expect(json.__v).toBeUndefined();
    });
  });
});

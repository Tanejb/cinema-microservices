const mongoose = require('mongoose');
const Movie = require('../../src/domain/Movie');
const movieRepository = require('../../src/repositories/movieRepository');

describe('MovieRepository', () => {
  beforeAll(async () => {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/test_movies_db';
    await mongoose.connect(mongoUri, {
      dbName: 'test_movies_db'
    });
  });

  afterAll(async () => {
    await mongoose.connection.db.dropDatabase();
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    await Movie.deleteMany({});
  });

  describe('create', () => {
    it('should create a new movie', async () => {
      const movieData = {
        title: 'Test Movie',
        description: 'A test movie description',
        genre: 'Action',
        duration: 120,
        ageRating: 'PG-13'
      };

      const movie = await movieRepository.create(movieData);

      expect(movie).toBeDefined();
      expect(movie.title).toBe(movieData.title);
      expect(movie.description).toBe(movieData.description);
      expect(movie.genre).toBe(movieData.genre);
      expect(movie.duration).toBe(movieData.duration);
      expect(movie.ageRating).toBe(movieData.ageRating);
    });

    it('should throw error when required fields are missing', async () => {
      const movieData = {
        title: 'Test Movie'
        // Missing required fields
      };

      await expect(movieRepository.create(movieData)).rejects.toThrow();
    });
  });

  describe('findAll', () => {
    it('should return all movies', async () => {
      const movie1 = await movieRepository.create({
        title: 'Movie 1',
        description: 'Description 1',
        genre: 'Action',
        duration: 120,
        ageRating: 'PG-13'
      });

      const movie2 = await movieRepository.create({
        title: 'Movie 2',
        description: 'Description 2',
        genre: 'Comedy',
        duration: 90,
        ageRating: 'PG'
      });

      const movies = await movieRepository.findAll();

      expect(movies).toHaveLength(2);
      expect(movies[0].title).toBeDefined();
    });

    it('should filter movies by genre', async () => {
      await movieRepository.create({
        title: 'Action Movie',
        description: 'Action description',
        genre: 'Action',
        duration: 120,
        ageRating: 'PG-13'
      });

      await movieRepository.create({
        title: 'Comedy Movie',
        description: 'Comedy description',
        genre: 'Comedy',
        duration: 90,
        ageRating: 'PG'
      });

      const actionMovies = await movieRepository.findAll({ genre: 'Action' });

      expect(actionMovies).toHaveLength(1);
      expect(actionMovies[0].genre).toBe('Action');
    });

    it('should search movies by title', async () => {
      await movieRepository.create({
        title: 'The Matrix',
        description: 'A sci-fi movie',
        genre: 'Sci-Fi',
        duration: 136,
        ageRating: 'R'
      });

      await movieRepository.create({
        title: 'Inception',
        description: 'Another sci-fi movie',
        genre: 'Sci-Fi',
        duration: 148,
        ageRating: 'PG-13'
      });

      const results = await movieRepository.findAll({ search: 'Matrix' });

      expect(results).toHaveLength(1);
      expect(results[0].title).toContain('Matrix');
    });
  });

  describe('findById', () => {
    it('should find a movie by ID', async () => {
      const createdMovie = await movieRepository.create({
        title: 'Test Movie',
        description: 'Test description',
        genre: 'Action',
        duration: 120,
        ageRating: 'PG-13'
      });

      const foundMovie = await movieRepository.findById(createdMovie._id);

      expect(foundMovie).toBeDefined();
      expect(foundMovie._id.toString()).toBe(createdMovie._id.toString());
      expect(foundMovie.title).toBe('Test Movie');
    });

    it('should return null if movie not found', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      const movie = await movieRepository.findById(nonExistentId);

      expect(movie).toBeNull();
    });
  });

  describe('update', () => {
    it('should update a movie', async () => {
      const createdMovie = await movieRepository.create({
        title: 'Original Title',
        description: 'Original description',
        genre: 'Action',
        duration: 120,
        ageRating: 'PG-13'
      });

      const updateData = {
        title: 'Updated Title',
        duration: 150
      };

      const updatedMovie = await movieRepository.update(createdMovie._id, updateData);

      expect(updatedMovie).toBeDefined();
      expect(updatedMovie.title).toBe('Updated Title');
      expect(updatedMovie.duration).toBe(150);
      expect(updatedMovie.description).toBe('Original description');
    });

    it('should return null if movie not found', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      const updateData = { title: 'Updated Title' };

      const result = await movieRepository.update(nonExistentId, updateData);

      expect(result).toBeNull();
    });
  });

  describe('delete', () => {
    it('should delete a movie', async () => {
      const createdMovie = await movieRepository.create({
        title: 'Movie to Delete',
        description: 'Description',
        genre: 'Action',
        duration: 120,
        ageRating: 'PG-13'
      });

      const deletedMovie = await movieRepository.delete(createdMovie._id);

      expect(deletedMovie).toBeDefined();
      expect(deletedMovie._id.toString()).toBe(createdMovie._id.toString());

      const foundMovie = await movieRepository.findById(createdMovie._id);
      expect(foundMovie).toBeNull();
    });

    it('should return null if movie not found', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      const result = await movieRepository.delete(nonExistentId);

      expect(result).toBeNull();
    });
  });

  describe('exists', () => {
    it('should return true if movie exists', async () => {
      const createdMovie = await movieRepository.create({
        title: 'Test Movie',
        description: 'Test description',
        genre: 'Action',
        duration: 120,
        ageRating: 'PG-13'
      });

      const exists = await movieRepository.exists(createdMovie._id);

      expect(exists).toBe(true);
    });

    it('should return false if movie does not exist', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      const exists = await movieRepository.exists(nonExistentId);

      expect(exists).toBe(false);
    });
  });
});

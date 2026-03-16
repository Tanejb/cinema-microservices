const request = require('supertest');
const mongoose = require('mongoose');
const express = require('express');
const cors = require('cors');
const movieRoutes = require('../../src/routes/movieRoutes');
const Movie = require('../../src/domain/Movie');

// Create test app without starting server
const createTestApp = () => {
  const app = express();
  app.use(cors());
  app.use(express.json());
  app.use('/api/movies', movieRoutes);
  
  // Health check endpoint for tests
  app.get('/health', (req, res) => {
    res.status(200).json({
      status: 'healthy',
      service: 'movies-service',
      timestamp: new Date().toISOString()
    });
  });
  
  return app;
};

describe('Movie Routes', () => {
  let app;

  beforeAll(async () => {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/test_movies_db';
    await mongoose.connect(mongoUri, {
      dbName: 'test_movies_db'
    });
    app = createTestApp();
  });

  afterAll(async () => {
    await mongoose.connection.db.dropDatabase();
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    await Movie.deleteMany({});
  });

  describe('POST /api/movies', () => {
    it('should create a new movie', async () => {
      const movieData = {
        title: 'Test Movie',
        description: 'A test movie description',
        genre: 'Action',
        duration: 120,
        ageRating: 'PG-13'
      };

      const response = await request(app)
        .post('/api/movies')
        .send(movieData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe(movieData.title);
      expect(response.body.data.description).toBe(movieData.description);
      expect(response.body.data.genre).toBe(movieData.genre);
      expect(response.body.data.duration).toBe(movieData.duration);
      expect(response.body.data.ageRating).toBe(movieData.ageRating);
    });

    it('should return 400 if required fields are missing', async () => {
      const movieData = {
        title: 'Test Movie'
        // Missing required fields
      };

      const response = await request(app)
        .post('/api/movies')
        .send(movieData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/movies', () => {
    it('should get all movies', async () => {
      await Movie.create({
        title: 'Movie 1',
        description: 'Description 1',
        genre: 'Action',
        duration: 120,
        ageRating: 'PG-13'
      });

      await Movie.create({
        title: 'Movie 2',
        description: 'Description 2',
        genre: 'Comedy',
        duration: 90,
        ageRating: 'PG'
      });

      const response = await request(app)
        .get('/api/movies')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.count).toBe(2);
      expect(response.body.data).toHaveLength(2);
    });

    it('should filter movies by genre', async () => {
      await Movie.create({
        title: 'Action Movie',
        description: 'Action description',
        genre: 'Action',
        duration: 120,
        ageRating: 'PG-13'
      });

      await Movie.create({
        title: 'Comedy Movie',
        description: 'Comedy description',
        genre: 'Comedy',
        duration: 90,
        ageRating: 'PG'
      });

      const response = await request(app)
        .get('/api/movies?genre=Action')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].genre).toBe('Action');
    });

    it('should search movies by title', async () => {
      await Movie.create({
        title: 'The Matrix',
        description: 'A sci-fi movie',
        genre: 'Sci-Fi',
        duration: 136,
        ageRating: 'R'
      });

      const response = await request(app)
        .get('/api/movies?search=Matrix')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
      expect(response.body.data[0].title).toContain('Matrix');
    });
  });

  describe('GET /api/movies/:id', () => {
    it('should get a movie by ID', async () => {
      const movie = await Movie.create({
        title: 'Test Movie',
        description: 'Test description',
        genre: 'Action',
        duration: 120,
        ageRating: 'PG-13'
      });

      const response = await request(app)
        .get(`/api/movies/${movie._id}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe('Test Movie');
      expect(response.body.data.id).toBe(movie._id.toString());
    });

    it('should return 404 if movie not found', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();

      const response = await request(app)
        .get(`/api/movies/${nonExistentId}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Movie not found');
    });
  });

  describe('PUT /api/movies/:id', () => {
    it('should update a movie', async () => {
      const movie = await Movie.create({
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

      const response = await request(app)
        .put(`/api/movies/${movie._id}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe('Updated Title');
      expect(response.body.data.duration).toBe(150);
    });

    it('should return 404 if movie not found', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();

      const response = await request(app)
        .put(`/api/movies/${nonExistentId}`)
        .send({ title: 'Updated Title' })
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Movie not found');
    });
  });

  describe('DELETE /api/movies/:id', () => {
    it('should delete a movie', async () => {
      const movie = await Movie.create({
        title: 'Movie to Delete',
        description: 'Description',
        genre: 'Action',
        duration: 120,
        ageRating: 'PG-13'
      });

      const response = await request(app)
        .delete(`/api/movies/${movie._id}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Movie deleted successfully');

      const deletedMovie = await Movie.findById(movie._id);
      expect(deletedMovie).toBeNull();
    });

    it('should return 404 if movie not found', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();

      const response = await request(app)
        .delete(`/api/movies/${nonExistentId}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Movie not found');
    });
  });

  describe('GET /health', () => {
    it('should return health status', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body.status).toBe('healthy');
      expect(response.body.service).toBe('movies-service');
      expect(response.body.timestamp).toBeDefined();
    });
  });
});

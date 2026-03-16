const movieService = require('../services/movieService');
const logger = require('../utils/logger');

class MovieController {
  async createMovie(req, res) {
    try {
      logger.info('Controller: Creating movie', { body: req.body });
      const movie = await movieService.createMovie(req.body);
      res.status(201).json({
        success: true,
        data: movie
      });
    } catch (error) {
      logger.error('Controller: Error creating movie:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to create movie'
      });
    }
  }

  async getAllMovies(req, res) {
    try {
      logger.info('Controller: Getting all movies', { query: req.query });
      const filters = {
        genre: req.query.genre,
        search: req.query.search
      };
      const movies = await movieService.getAllMovies(filters);
      res.status(200).json({
        success: true,
        count: movies.length,
        data: movies
      });
    } catch (error) {
      logger.error('Controller: Error getting movies:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to retrieve movies'
      });
    }
  }

  async getMovieById(req, res) {
    try {
      logger.info('Controller: Getting movie by ID', { movieId: req.params.id });
      const movie = await movieService.getMovieById(req.params.id);
      res.status(200).json({
        success: true,
        data: movie
      });
    } catch (error) {
      logger.error('Controller: Error getting movie:', error);
      const statusCode = error.message === 'Movie not found' ? 404 : 500;
      res.status(statusCode).json({
        success: false,
        message: error.message || 'Failed to retrieve movie'
      });
    }
  }

  async updateMovie(req, res) {
    try {
      logger.info('Controller: Updating movie', { movieId: req.params.id });
      const movie = await movieService.updateMovie(req.params.id, req.body);
      res.status(200).json({
        success: true,
        data: movie
      });
    } catch (error) {
      logger.error('Controller: Error updating movie:', error);
      const statusCode = error.message === 'Movie not found' ? 404 : 400;
      res.status(statusCode).json({
        success: false,
        message: error.message || 'Failed to update movie'
      });
    }
  }

  async deleteMovie(req, res) {
    try {
      logger.info('Controller: Deleting movie', { movieId: req.params.id });
      await movieService.deleteMovie(req.params.id);
      res.status(200).json({
        success: true,
        message: 'Movie deleted successfully'
      });
    } catch (error) {
      logger.error('Controller: Error deleting movie:', error);
      const statusCode = error.message === 'Movie not found' ? 404 : 500;
      res.status(statusCode).json({
        success: false,
        message: error.message || 'Failed to delete movie'
      });
    }
  }
}

module.exports = new MovieController();

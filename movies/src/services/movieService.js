const movieRepository = require('../repositories/movieRepository');
const logger = require('../utils/logger');

class MovieService {
  async createMovie(movieData) {
    try {
      logger.info('Service: Creating movie', { title: movieData.title });
      
      // Business logic validation
      if (!movieData.title || !movieData.description) {
        throw new Error('Title and description are required');
      }

      const movie = await movieRepository.create(movieData);
      return movie;
    } catch (error) {
      logger.error('Service: Error creating movie:', error);
      throw error;
    }
  }

  async getAllMovies(filters = {}) {
    try {
      logger.info('Service: Getting all movies', { filters });
      const movies = await movieRepository.findAll(filters);
      return movies;
    } catch (error) {
      logger.error('Service: Error getting movies:', error);
      throw error;
    }
  }

  async getMovieById(id) {
    try {
      logger.info('Service: Getting movie by ID', { movieId: id });
      
      if (!id) {
        throw new Error('Movie ID is required');
      }

      const movie = await movieRepository.findById(id);
      
      if (!movie) {
        throw new Error('Movie not found');
      }

      return movie;
    } catch (error) {
      logger.error('Service: Error getting movie:', error);
      throw error;
    }
  }

  async updateMovie(id, updateData) {
    try {
      logger.info('Service: Updating movie', { movieId: id });
      
      if (!id) {
        throw new Error('Movie ID is required');
      }

      const movie = await movieRepository.update(id, updateData);
      
      if (!movie) {
        throw new Error('Movie not found');
      }

      return movie;
    } catch (error) {
      logger.error('Service: Error updating movie:', error);
      throw error;
    }
  }

  async deleteMovie(id) {
    try {
      logger.info('Service: Deleting movie', { movieId: id });
      
      if (!id) {
        throw new Error('Movie ID is required');
      }

      const movie = await movieRepository.delete(id);
      
      if (!movie) {
        throw new Error('Movie not found');
      }

      return movie;
    } catch (error) {
      logger.error('Service: Error deleting movie:', error);
      throw error;
    }
  }
}

module.exports = new MovieService();

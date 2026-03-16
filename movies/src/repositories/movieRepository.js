const Movie = require('../domain/Movie');
const logger = require('../utils/logger');

class MovieRepository {
  async create(movieData) {
    try {
      logger.info('Creating new movie', { title: movieData.title });
      const movie = new Movie(movieData);
      const savedMovie = await movie.save();
      logger.info('Movie created successfully', { movieId: savedMovie._id });
      return savedMovie;
    } catch (error) {
      logger.error('Error creating movie:', error);
      throw error;
    }
  }

  async findAll(filters = {}) {
    try {
      logger.info('Finding all movies', { filters });
      const query = {};
      
      if (filters.genre) {
        query.genre = filters.genre;
      }
      
      if (filters.search) {
        query.$or = [
          { title: { $regex: filters.search, $options: 'i' } },
          { description: { $regex: filters.search, $options: 'i' } }
        ];
      }

      const movies = await Movie.find(query).sort({ createdAt: -1 });
      logger.info('Movies retrieved successfully', { count: movies.length });
      return movies;
    } catch (error) {
      logger.error('Error finding movies:', error);
      throw error;
    }
  }

  async findById(id) {
    try {
      logger.info('Finding movie by ID', { movieId: id });
      const movie = await Movie.findById(id);
      
      if (!movie) {
        logger.warn('Movie not found', { movieId: id });
        return null;
      }
      
      logger.info('Movie found successfully', { movieId: id });
      return movie;
    } catch (error) {
      logger.error('Error finding movie by ID:', error);
      throw error;
    }
  }

  async update(id, updateData) {
    try {
      logger.info('Updating movie', { movieId: id });
      const movie = await Movie.findByIdAndUpdate(
        id,
        updateData,
        { new: true, runValidators: true }
      );
      
      if (!movie) {
        logger.warn('Movie not found for update', { movieId: id });
        return null;
      }
      
      logger.info('Movie updated successfully', { movieId: id });
      return movie;
    } catch (error) {
      logger.error('Error updating movie:', error);
      throw error;
    }
  }

  async delete(id) {
    try {
      logger.info('Deleting movie', { movieId: id });
      const movie = await Movie.findByIdAndDelete(id);
      
      if (!movie) {
        logger.warn('Movie not found for deletion', { movieId: id });
        return null;
      }
      
      logger.info('Movie deleted successfully', { movieId: id });
      return movie;
    } catch (error) {
      logger.error('Error deleting movie:', error);
      throw error;
    }
  }

  async exists(id) {
    try {
      const count = await Movie.countDocuments({ _id: id });
      return count > 0;
    } catch (error) {
      logger.error('Error checking movie existence:', error);
      throw error;
    }
  }
}

module.exports = new MovieRepository();

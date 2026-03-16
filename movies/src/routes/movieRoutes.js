const express = require('express');
const router = express.Router();
const movieController = require('../controllers/movieController');

/**
 * @swagger
 * /api/movies:
 *   post:
 *     summary: Create a new movie
 *     tags: [Movies]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - description
 *               - genre
 *               - duration
 *               - ageRating
 *             properties:
 *               title:
 *                 type: string
 *                 example: "The Matrix"
 *               description:
 *                 type: string
 *                 example: "A computer hacker learns about the true nature of reality"
 *               genre:
 *                 type: string
 *                 enum: [Action, Comedy, Drama, Horror, Sci-Fi, Thriller, Romance, Adventure, Animation, Documentary, Other]
 *                 example: "Sci-Fi"
 *               duration:
 *                 type: number
 *                 example: 136
 *               ageRating:
 *                 type: string
 *                 enum: [G, PG, PG-13, R, NC-17]
 *                 example: "R"
 *               releaseDate:
 *                 type: string
 *                 format: date
 *                 example: "1999-03-31"
 *               director:
 *                 type: string
 *                 example: "Lana Wachowski, Lilly Wachowski"
 *     responses:
 *       201:
 *         description: Movie created successfully
 *       400:
 *         description: Bad request
 */
router.post('/', movieController.createMovie.bind(movieController));

/**
 * @swagger
 * /api/movies:
 *   get:
 *     summary: Get all movies
 *     tags: [Movies]
 *     parameters:
 *       - in: query
 *         name: genre
 *         schema:
 *           type: string
 *         description: Filter by genre
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search in title and description
 *     responses:
 *       200:
 *         description: List of movies
 */
router.get('/', movieController.getAllMovies.bind(movieController));

/**
 * @swagger
 * /api/movies/{id}:
 *   get:
 *     summary: Get a movie by ID
 *     tags: [Movies]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Movie ID
 *     responses:
 *       200:
 *         description: Movie details
 *       404:
 *         description: Movie not found
 */
router.get('/:id', movieController.getMovieById.bind(movieController));

/**
 * @swagger
 * /api/movies/{id}:
 *   put:
 *     summary: Update a movie
 *     tags: [Movies]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Movie ID
 *         example: "507f1f77bcf86cd799439011"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 example: "The Matrix Reloaded"
 *               description:
 *                 type: string
 *                 example: "Neo and the rebel leaders estimate that they have 72 hours until 250,000 probes discover Zion and destroy it"
 *               genre:
 *                 type: string
 *                 enum: [Action, Comedy, Drama, Horror, Sci-Fi, Thriller, Romance, Adventure, Animation, Documentary, Other]
 *                 example: "Sci-Fi"
 *               duration:
 *                 type: number
 *                 example: 138
 *               ageRating:
 *                 type: string
 *                 enum: [G, PG, PG-13, R, NC-17]
 *                 example: "R"
 *               releaseDate:
 *                 type: string
 *                 format: date
 *                 example: "2003-05-15"
 *               director:
 *                 type: string
 *                 example: "Lana Wachowski, Lilly Wachowski"
 *           example:
 *             title: "The Matrix Reloaded"
 *             description: "Neo and the rebel leaders estimate that they have 72 hours until 250,000 probes discover Zion and destroy it"
 *             genre: "Sci-Fi"
 *             duration: 138
 *             ageRating: "R"
 *             releaseDate: "2003-05-15"
 *             director: "Lana Wachowski, Lilly Wachowski"
 *     responses:
 *       200:
 *         description: Movie updated successfully
 *       404:
 *         description: Movie not found
 */
router.put('/:id', movieController.updateMovie.bind(movieController));

/**
 * @swagger
 * /api/movies/{id}:
 *   delete:
 *     summary: Delete a movie
 *     tags: [Movies]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Movie ID
 *     responses:
 *       200:
 *         description: Movie deleted successfully
 *       404:
 *         description: Movie not found
 */
router.delete('/:id', movieController.deleteMovie.bind(movieController));

module.exports = router;

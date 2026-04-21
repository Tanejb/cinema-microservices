swagger_spec = {
    "swagger": "2.0",
    "info": {
        "title": "Mobile API Gateway",
        "version": "1.0.0",
        "description": "Mobile-oriented gateway with compact/aggregated endpoints.",
    },
    "host": "localhost:8081",
    "basePath": "/",
    "schemes": ["http"],
    "consumes": ["application/json"],
    "produces": ["application/json"],
    "definitions": {
        "MovieCreate": {
            "type": "object",
            "required": ["title", "description", "genre", "duration", "ageRating"],
            "properties": {
                "title": {"type": "string", "example": "Inception"},
                "description": {"type": "string", "example": "A mind-bending sci-fi thriller."},
                "genre": {"type": "string", "example": "Sci-Fi"},
                "duration": {"type": "integer", "example": 148},
                "ageRating": {"type": "string", "example": "PG-13"},
            },
        },
        "UserCreate": {
            "type": "object",
            "required": ["first_name", "last_name", "email"],
            "properties": {
                "first_name": {"type": "string", "example": "Ana"},
                "last_name": {"type": "string", "example": "Novak"},
                "email": {"type": "string", "example": "ana.novak@example.com"},
            },
        },
        "ScreeningCreate": {
            "type": "object",
            "required": ["movie_id", "screening_date", "screening_time", "hall", "total_seats"],
            "properties": {
                "movie_id": {"type": "string", "example": "movie-001"},
                "screening_date": {"type": "string", "example": "2026-04-20"},
                "screening_time": {"type": "string", "example": "19:30"},
                "hall": {"type": "string", "example": "Hall 2"},
                "total_seats": {"type": "integer", "example": 120},
            },
        },
        "ReservationCreate": {
            "type": "object",
            "required": ["screening_id", "seat_number", "user_name", "user_email"],
            "properties": {
                "screening_id": {"type": "string", "example": "screening-demo-001"},
                "seat_number": {"type": "string", "example": "B7"},
                "user_name": {"type": "string", "example": "Ana Novak"},
                "user_email": {"type": "string", "example": "ana@example.com"},
            },
            "example": {
                "screening_id": "screening-demo-001",
                "seat_number": "B7",
                "user_name": "Ana Novak",
                "user_email": "ana@example.com",
            },
        }
    },
    "paths": {
        "/health": {"get": {"summary": "Gateway health", "responses": {"200": {"description": "Healthy"}}}},
        "/api/mobile/home": {"get": {"summary": "Mobile home feed", "responses": {"200": {"description": "OK"}}}},
        "/api/mobile/movies": {
            "post": {
                "summary": "Create movie (proxy)",
                "parameters": [{"in": "body", "name": "body", "required": True, "schema": {"$ref": "#/definitions/MovieCreate"}}],
                "responses": {"201": {"description": "Created"}},
            },
            "get": {
                "summary": "Compact movies list",
                "parameters": [
                    {"in": "query", "name": "genre", "required": False, "type": "string", "example": "Sci-Fi"},
                    {"in": "query", "name": "search", "required": False, "type": "string", "example": "matrix"},
                ],
                "responses": {"200": {"description": "OK"}},
            },
        },
        "/api/mobile/movies/{movie_id}": {
            "get": {
                "summary": "Get movie by id (proxy)",
                "parameters": [{"in": "path", "name": "movie_id", "required": True, "type": "string", "example": "507f1f77bcf86cd799439011"}],
                "responses": {"200": {"description": "OK"}, "404": {"description": "Not found"}},
            },
            "put": {
                "summary": "Update movie (proxy)",
                "parameters": [
                    {"in": "path", "name": "movie_id", "required": True, "type": "string", "example": "507f1f77bcf86cd799439011"},
                    {"in": "body", "name": "body", "required": True, "schema": {"$ref": "#/definitions/MovieCreate"}},
                ],
                "responses": {"200": {"description": "Updated"}},
            },
            "delete": {
                "summary": "Delete movie (proxy)",
                "parameters": [{"in": "path", "name": "movie_id", "required": True, "type": "string", "example": "507f1f77bcf86cd799439011"}],
                "responses": {"200": {"description": "Deleted"}},
            },
        },
        "/api/mobile/movies/{movie_id}/details": {
            "get": {
                "summary": "Movie details with screenings",
                "parameters": [{"in": "path", "name": "movie_id", "required": True, "type": "string", "example": "507f1f77bcf86cd799439011"}],
                "responses": {"200": {"description": "OK"}, "404": {"description": "Not found"}},
            }
        },
        "/api/mobile/users/{user_id}/profile": {
            "get": {
                "summary": "User profile (mobile payload)",
                "parameters": [{"in": "path", "name": "user_id", "required": True, "type": "string", "example": "507f1f77bcf86cd799439011"}],
                "responses": {"200": {"description": "OK"}, "404": {"description": "Not found"}},
            }
        },
        "/api/mobile/users": {
            "get": {"summary": "List users (proxy)", "responses": {"200": {"description": "OK"}}},
            "post": {
                "summary": "Create user (proxy)",
                "parameters": [{"in": "body", "name": "body", "required": True, "schema": {"$ref": "#/definitions/UserCreate"}}],
                "responses": {"201": {"description": "Created"}},
            },
        },
        "/api/mobile/users/{user_id}": {
            "get": {
                "summary": "Get user by id (proxy)",
                "parameters": [{"in": "path", "name": "user_id", "required": True, "type": "string", "example": "507f1f77bcf86cd799439011"}],
                "responses": {"200": {"description": "OK"}},
            },
            "put": {
                "summary": "Update user (proxy)",
                "parameters": [
                    {"in": "path", "name": "user_id", "required": True, "type": "string", "example": "507f1f77bcf86cd799439011"},
                    {"in": "body", "name": "body", "required": True, "schema": {"$ref": "#/definitions/UserCreate"}},
                ],
                "responses": {"200": {"description": "Updated"}},
            },
            "delete": {
                "summary": "Delete user (proxy)",
                "parameters": [{"in": "path", "name": "user_id", "required": True, "type": "string", "example": "507f1f77bcf86cd799439011"}],
                "responses": {"200": {"description": "Deleted"}, "404": {"description": "Not found"}},
            },
        },
        "/api/mobile/screenings": {
            "get": {"summary": "List screenings (proxy)", "responses": {"200": {"description": "OK"}}},
            "post": {
                "summary": "Create screening (proxy)",
                "parameters": [{"in": "body", "name": "body", "required": True, "schema": {"$ref": "#/definitions/ScreeningCreate"}}],
                "responses": {"201": {"description": "Created"}},
            },
        },
        "/api/mobile/screenings/{screening_id}": {
            "get": {
                "summary": "Get screening by id (proxy)",
                "parameters": [{"in": "path", "name": "screening_id", "required": True, "type": "string", "example": "507f1f77bcf86cd799439011"}],
                "responses": {"200": {"description": "OK"}},
            },
            "put": {
                "summary": "Update screening (proxy)",
                "parameters": [
                    {"in": "path", "name": "screening_id", "required": True, "type": "string", "example": "507f1f77bcf86cd799439011"},
                    {"in": "body", "name": "body", "required": True, "schema": {"$ref": "#/definitions/ScreeningCreate"}},
                ],
                "responses": {"200": {"description": "Updated"}},
            },
            "delete": {
                "summary": "Delete screening (proxy)",
                "parameters": [{"in": "path", "name": "screening_id", "required": True, "type": "string", "example": "507f1f77bcf86cd799439011"}],
                "responses": {"200": {"description": "Deleted"}},
            },
        },
        "/api/mobile/screenings/movie/{movie_id}": {
            "get": {
                "summary": "List screenings by movie (proxy)",
                "parameters": [{"in": "path", "name": "movie_id", "required": True, "type": "string", "example": "movie-001"}],
                "responses": {"200": {"description": "OK"}},
            },
        },
        "/api/mobile/reservations": {
            "post": {
                "summary": "Create reservation",
                "parameters": [{"in": "body", "name": "body", "required": True, "schema": {"$ref": "#/definitions/ReservationCreate"}}],
                "responses": {"201": {"description": "Created"}},
            }
        },
        "/api/mobile/reservations/{reservation_id}": {
            "get": {
                "summary": "Get reservation",
                "parameters": [{"in": "path", "name": "reservation_id", "required": True, "type": "string", "example": "67f8f20b92f0cbf2c6100001"}],
                "responses": {"200": {"description": "OK"}},
            },
            "delete": {
                "summary": "Delete reservation (soft delete via cancel)",
                "parameters": [{"in": "path", "name": "reservation_id", "required": True, "type": "string", "example": "67f8f20b92f0cbf2c6100001"}],
                "responses": {"200": {"description": "Cancelled"}},
            },
        },
        "/api/mobile/reservations/screening/{screening_id}": {
            "get": {
                "summary": "List reservations by screening",
                "parameters": [{"in": "path", "name": "screening_id", "required": True, "type": "string", "example": "screening-demo-001"}],
                "responses": {"200": {"description": "OK"}},
            }
        },
        "/api/mobile/reservations/{reservation_id}/cancel": {
            "post": {
                "summary": "Cancel reservation",
                "parameters": [{"in": "path", "name": "reservation_id", "required": True, "type": "string", "example": "67f8f20b92f0cbf2c6100001"}],
                "responses": {"200": {"description": "Cancelled"}},
            }
        },
    },
}

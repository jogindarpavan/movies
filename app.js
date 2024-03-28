const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");
const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "moviesData.db");

let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error ${e.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

const convertMoviesDbInToResponseObj = (dbObj) => {
  return {
    movieId: dbObj.movie_id,
    directorId: dbObj.director_id,
    movieName: dbObj.movie_name,
    leadActor: dbObj.lead_actor,
  };
};

const convertDirectorDbInToResponseObj = (dbObj) => {
  return {
    directorId: dbObj.director_id,
    directorName: dbObj.director_name,
  };
};

//Returns a list of all movie names in the movie table
app.get("/movies/", async (request, response) => {
  const getMovies = `
    SELECT 
      movie_name
    FROM
    movie`;
  const moviesData = await db.all(getMovies);
  response.send(
    moviesData.map((eachMovie) => ({ movieName: eachMovie.movie_name }))
  );
});

//Creates a new movie in the movie table.
app.post("/movies/", async (request, response) => {
  const movieDetails = request.body;
  const { directorId, movieName, leadActor } = movieDetails;
  const addNewMovie = `
  INSERT INTO
    movie ( director_id, movie_name, lead_actor)
  VALUES
    (${directorId}, '${movieName}', '${leadActor}');`;
  await db.run(addNewMovie);
  response.send("Movie Successfully Added");
});

//Returns a movie based on the movie ID
app.get("/movies/:movieId/", async (request, response) => {
  const { movieId } = request.params;
  const getMovie = `
     SELECT 
      *
    FROM 
      movie 
    WHERE 
      movie_id = ${movieId};`;
  const movie = await db.get(getMovie);
  response.send(convertMoviesDbInToResponseObj(movie));
});

//Updates the details of a movie in the movie table based on the movie ID
app.put("/movies/:movieId/", async (request, response) => {
  const { movieId } = request.params;
  const movieDetails = request.body;
  const { directorId, movieName, leadActor } = movieDetails;
  const updateMovie = `
  UPDATE
  movie
  SET
  director_id = ${directorId},
  movie_name = '${movieName}',
  lead_actor = '${leadActor}'
  WHERE movie_id = ${movieId}
  `;
  await db.run(updateMovie);
  response.send("Movie Details Updated");
});

//Deletes a movie from the movie table based on the movie ID
app.delete("/movies/:movieId/", async (request, response) => {
  const { movieId } = request.params;
  const deleteMovie = `
    DELETE FROM
    movie
    WHERE movie_id = ${movieId}
    `;
  await db.run(deleteMovie);
  response.send("Movie Removed");
});

//Returns a list of all directors in the director table
app.get("/directors/", async (request, response) => {
  const getDirectors = `
    SELECT 
    *
    FROM 
    director
    `;
  const directorsDetails = await db.all(getDirectors);
  response.send(
    directorsDetails.map((eachDirector) =>
      convertDirectorDbInToResponseObj(eachDirector)
    )
  );
});

//Returns a list of all movie names directed by a specific director
app.get("/directors/:directorId/movies/", async (request, response) => {
  const { directorId } = request.params;
  const getMovieByDirectorId = `
    SELECT 
    movie_name
    FROM
    movie
    WHERE director_id = ${directorId}
    `;

  const movieNames = await db.all(getMovieByDirectorId);
  response.send(
    movieNames.map((eachMovieName) => ({ movieName: eachMovieName.movie_name }))
  );
});

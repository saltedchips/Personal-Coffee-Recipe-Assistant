Server Setup
***
First, ensure that PostgreSQL and pip are installed\
Install your choice of way to view the database schema PgAdmin4 was used for the creation of this\
\
Run:\
chmod +x setup.sh\
./setup.sh\
\
This will create a user and a blank database for the back-end api
***
Running the server:\

To start the server, run:\
uvicorn main:app --reload --host 0.0.0.0 -port 8000\
This will open the backend server on port 8000, allowing it to communicate with the clientside that is watching this port\

The database schema includes the following models:\

User\
UserUtensil\
Recipe\
RecipeUtensil\
RecipeIngredient\
RecipeInstruction\
Rating\
Note\


To implement:\

Unit tests\
More doccumentation\


\
Then on your browser, visit either  http://127.0.0.1:8000 or http://127.0.0.1:8000/docs to view the post request 

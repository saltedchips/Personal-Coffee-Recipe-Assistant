Server Setup
***
First ensure that postgresql and pip is installed\
Install your choice of way to view database schema PgAdmin4 was used for the creation of this\
\
Run:\
chmod +x setup.sh\
./setup.sh\
\
This will create a user and blank database for the back end api
***
Running the server:\

To start the server run:\
uvicorn main:app --reload\
\
Then on your browser visit either  http://127.0.0.1:8000 or http://127.0.0.1:8000/docs to view the post request 
# Requirements for windows machines
- download [git bash](https://git-scm.com/downloads)
- install and setup [rust](https://www.rust-lang.org/tools/install) on your machine
- download and install [postgresql](https://www.enterprisedb.com/downloads/postgres-postgresql-downloads)
- run `cargo install sqlx-cli --no-default-features --features native-tls,postgres` to install the sqlx cli for postgres

# How to run
- rename the .env.copy file to .env and link your currently running instance of postgres to the DATABASE_URL variable
- cd into the src-tauri folder and then run `sqlx migrate run` to run the required migrations
- run the react app using `npm run start` in one commandline window
- run the desktop tauri app using `npm run tauri dev` in another commandline window

    NOTE: keep both instances running while developing the app
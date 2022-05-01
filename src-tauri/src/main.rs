#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

use sqlx::pool::Pool;
use sqlx::postgres::{PgPool, PgPoolOptions, Postgres};
use sqlx::Row;
use sqlx::ValueRef;

use dotenvy::dotenv;
use std::env;
use std::process::Command;

use tauri::async_runtime::TokioHandle;
use tauri::async_runtime::*;
use tauri::{State, StateManager};

// Import week days and WeekDay
use chrono::format::strftime;
use chrono::{DateTime, NaiveDateTime, Utc};
use futures::lock::Mutex;
use std::thread;
use std::time::{Duration, SystemTime};

use futures::TryStreamExt;
use tokio_cron_scheduler::{Job, JobScheduler, JobToRun};

use std::pin::Pin;
use std::sync::Arc;
use tokio::runtime::Handle;
use tokio::runtime::Runtime;

struct MyDatabase(Pool<Postgres>);

async fn create_database(db_url: &str) -> Result<Pool<Postgres>, sqlx::Error> {
    let pos = db_url.rfind('/').unwrap();

    let db_name: String = db_url
        .chars()
        .skip(pos + 1)
        .take(db_url.len() - pos - 1)
        .collect();

    // create a new database with the current db name
    // by using the command "sqlx database create"
    let mut cmd = Command::new("sqlx");
    cmd.args(["database", "create"]);

    match cmd.output() {
        Ok(_) => {
            println!("Created new database {}", db_name);
            // connect to the newly created database
            Ok(PgPoolOptions::new()
                .max_connections(5)
                .connect(db_url)
                .await
                .expect("bad database url, fix it then run the app again."))
        }
        Err(_) => panic!("Failed to create database, make sure your server is up and running."),
    }
}

async fn schedule_unposted_on_start(
    sched: &JobScheduler,
    pool: &Pool<Postgres>,
) -> Result<(), sqlx::Error> {
    let mut rows =
        sqlx::query("select * from tweets where posted = false order by post_date asc").fetch(pool);
    // iterate through the results
    while let Some(row) = rows.try_next().await? {
        // for each result, get tweet text and post date
        let id: i64 = row.try_get("id")?;
        let post: String = row.try_get("tweet_content")?;
        let date: DateTime<Utc> = DateTime::from_utc(row.try_get("post_date")?, Utc);
        let now = chrono::offset::Utc::now();
        let mut schedule_date = String::from("");
        
        schedule_date = date.format("%S %M %H %d %m * %Y").to_string();
        if date > now {
            let post = Arc::new(post);
            let id = Arc::new(id);
            // TODO fix timezone issue to post on the correct datetime
            sched
                .add(
                    Job::new_async(&schedule_date[..], move |_uuid, _l| {
                        let post = post.clone();
                        let id = Arc::try_unwrap(id.clone()).unwrap();
                        Box::pin(async move {
                            let database_url = env::var("DATABASE_URL")
                                .expect("DATABASE_URL must be set in .env file");
                            let pool = PgPool::connect(&database_url)
                                .await
                                .expect("failed to connect to database");
                            // TODO schedule tweet here
                            println!("this is from a job: {}", post);
                            let rows_affected = sqlx::query!(
                                r#"
                                UPDATE tweets
                                SET posted = TRUE
                                WHERE id = $1
                                "#,
                                id
                            )
                            .execute(&pool)
                            .await
                            .expect("Failed to update row")
                            .rows_affected();
                        })
                    })
                    .unwrap(),
                )
                .expect("couldn't schedule job");
        } else {
            // TODO post the tweet immediately
            println!("this is supposed to be posted in the past: {}", post);
            let rows_affected = sqlx::query!(
                r#"
                UPDATE tweets
                SET posted = TRUE
                WHERE id = $1
                "#,
                id
            )
            .execute(pool)
            .await?
            .rows_affected();
        }
    }

    Ok(())
}

#[tauri::command]
async fn schedule_tweet(
    pool: State<'_, MyDatabase>,
    tweet_content: String,
    post_date: String,
) -> Result<(), String> {
    let parsed_date = post_date[..]
        .parse::<DateTime<Utc>>()
        .expect("Failed to parse date.");

    let row: (i64,) = match sqlx::query_as(
        "insert into tweets (tweet_content, post_date) values ($1, TO_TIMESTAMP($2, 'YYYY-MM-DD HH24:MI:SS')) returning id",
    )
    .bind(&tweet_content)
    .bind(&parsed_date.to_string())
    .fetch_one(&pool.0)
    .await
    {
        Ok(r) => r,
        Err(err) => return Err(format!("Couldn't insert row: {}", err.to_string()).to_string()),
    };
    let id: i64 = row.0;
    tokio::task::spawn_blocking(move || {
        // TODO refactor later by:
        // 1- creating your own scheduler using cron
        // 2- figure out how to pass the scheduler from state to the command and fix the tokio::spawn issue
        // 3- try using tauri::async_runtime::TokioHandle

        let date: DateTime<Utc> = post_date.parse().unwrap();
        let schedule_date = date.format("%S %M %H %d %m * %Y").to_string();

        let post = Arc::new(tweet_content);
        let mut sched = JobScheduler::new().unwrap();

        sched
            .add(
                Job::new_async(&schedule_date[..], move |_uuid, _l| {
                    let post = post.clone();
                    Box::pin(async move {
                        let database_url = env::var("DATABASE_URL")
                            .expect("DATABASE_URL must be set in .env file");
                        let pool = PgPool::connect(&database_url)
                            .await
                            .expect("failed to connect to database");
                        // TODO schedule tweet here
                        println!("this is from a job: {}", post);
                        let rows_affected = sqlx::query!(
                            r#"
                            UPDATE tweets
                            SET posted = TRUE
                            WHERE id = $1
                            "#,
                            id
                        )
                        .execute(&pool)
                        .await
                        .expect("Failed to update row")
                        .rows_affected();
                    })
                })
                .unwrap(),
            )
            .expect("failed to add job to scheduler");

        #[cfg(feature = "signal")]
        sched.shutdown_on_ctrl_c();

        sched.set_shutdown_handler(Box::new(|| {
            Box::pin(async move {
                println!("Shut down done");
            })
        }));
        sched.start().expect("Failed to start scheduler");
    });

    Ok(())
}

#[tokio::main]
async fn main() -> Result<(), sqlx::Error> {
    dotenv().ok();

    let database_url = env::var("DATABASE_URL").expect("DATABASE_URL must be set in .env file");

    let pool = match PgPoolOptions::new()
        .max_connections(5)
        .connect(&database_url)
        .await
    {
        Ok(inst) => inst,
        Err(_) => create_database(&database_url).await?,
    };

    sqlx::migrate!().run(&pool).await?;

    let mut sched = JobScheduler::new().unwrap();

    #[cfg(feature = "signal")]
    sched.shutdown_on_ctrl_c();

    sched.set_shutdown_handler(Box::new(|| {
        Box::pin(async move {
            println!("Shut down done");
        })
    }));

    sched.start().expect("Failed to start scheduler");

    schedule_unposted_on_start(&sched, &pool).await?;

    tauri::Builder::default()
        .manage(MyDatabase(pool))
        .invoke_handler(tauri::generate_handler![schedule_tweet])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");

    Ok(())
}

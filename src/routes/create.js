import { useState } from 'react'
import { invoke } from '@tauri-apps/api'

export default function Create() {
    let [tweetContent, setTweetContent] = useState("");
    let [postDate, setPostDate] = useState("");
    let [invalidDate, setInvalidDate] = useState(false);
    let [noDate, setNoDate] = useState(false);
    let [emptyTweet, setEmptyTweet] = useState(false);
    let [longTweet, setLongTweet] = useState(false);

    const validateInput = () => {
        const now = new Date();
        const parsedDate = new Date(Date.parse(postDate));

        // Validate that the picked datetime is greater than the current datetime
        setInvalidDate(now.getTime() >= parsedDate.getTime());
        setNoDate(parsedDate.toString() === "Invalid Date");
        // Validate that the content is not empty and is within the acceptable lngth for a tweet
        setEmptyTweet(tweetContent.length === 0);
        // Validate that the content is within the acceptable length for a tweet
        setLongTweet(tweetContent.length > 280);
    }

    const scheduleTweet = () => {
        validateInput();

        if (!(noDate || invalidDate || emptyTweet || longTweet)) {
            console.log("posting...")
            // TODO on success show toast saying "scheduled successfully"
            // TODO on failure show toast saying "failed to schedule tweet"

            let parsedDate = new Date(Date.parse(postDate));

            invoke('schedule_tweet',
                {
                    tweetContent,
                    postDate: parsedDate
                }).then((res) => console.log("Success!!!"))
                .catch((err) => console.log(`Error: ${err}`));
        }
    }
    return (
        <div>
            <p>
                Schedule Tweet
            </p>
            <form>
                <label htmlFor="tweet-content">Tweet Content</label>
                <textarea
                    className={emptyTweet || longTweet ? 'red-border' : ''}
                    name="tweet-content"
                    id="tweet-content"
                    cols="50"
                    rows="8"
                    onChange={e => {
                        setEmptyTweet(false)
                        setLongTweet(false)
                        setTweetContent(e.target.value)
                    }}></textarea>
                {
                    emptyTweet &&
                    <p className='validation-text'>Content cannot be empty</p>
                }
                {
                    longTweet &&
                    <p className='validation-text'>Content cannot be longer than 280 characters</p>
                }
                <label htmlFor="post-date">Post Date</label>
                <input
                    className={invalidDate || noDate ? 'red-border' : ''}
                    type="datetime-local"
                    id="post-date"
                    name="post-date"
                    value={postDate}
                    onChange={e => {
                        setNoDate(false)
                        setInvalidDate(false)
                        setPostDate(e.target.value)
                    }} />
                {
                    invalidDate &&
                    <p className='pad-top-5px validation-text'>Pick a future date</p>
                }
                {
                    noDate &&
                    <p className='pad-top-5px validation-text'>Please select a date</p>
                }
                <button type="button" onClick={scheduleTweet}>Post</button>
            </form>
        </div>
    );
}
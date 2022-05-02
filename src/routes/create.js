import { invoke } from '@tauri-apps/api'
import { ToastContainer, toast } from 'react-toastify';
import './create.css'
import {
    isTooLong,
    isValidDate,
    isRequired,
    useForm,
} from '../hooks/useForm';

const scheduleTweet = (values) => {
    // TODO on success show toast saying "scheduled successfully"
    // TODO on failure show toast saying "failed to schedule tweet"
    let parsedDate = new Date(Date.parse(values.postDate));

    invoke('schedule_tweet',
        {
            tweetContent: values.tweetContent,
            postDate: parsedDate
        }).then((res) => console.log("Success!!!"))
        .catch((err) => console.log(`Error: ${err}`));
}

export default function Create() {

    const initialState = { tweetContent: '', postDate: '' };
    const validations = [
        ({ tweetContent }) => isRequired(tweetContent) || { tweetContent: 'Content cannot be empty' },
        ({ tweetContent }) => isTooLong(tweetContent) || { tweetContent2: 'Content cannot be longer than 280 characters' },
        ({ postDate }) => isRequired(postDate) || { postDate: 'Please select a date' },
        ({ postDate }) => isValidDate(postDate) || { postDate2: 'Pick a future date' },
    ];
    const { values, errors, touched, isValid, changeHandler, submitHandler } = useForm(initialState, validations, scheduleTweet);

    return (
        <div>
            <p>
                Schedule Tweet
            </p>
            <form>
                <label htmlFor="tweet-content">Tweet Content</label>
                <textarea
                    className={touched.tweetContent && (errors.tweetContent || errors.tweetContent2) ? 'red-border' : ''}
                    name="tweetContent"
                    id="tweet-content"
                    cols="50"
                    rows="8"
                    value={values.tweetContent}
                    onChange={changeHandler}></textarea>
                {
                    touched.tweetContent && errors.tweetContent &&
                    <p className='validation-text'>{errors.tweetContent}</p>
                }
                {
                    touched.tweetContent && errors.tweetContent2 &&
                    <p className='validation-text'>{errors.tweetContent2}</p>
                }
                <label htmlFor="post-date">Post Date</label>
                <input
                    className={touched.postDate && (errors.postDate2 || errors.postDate) ? 'red-border' : ''}
                    type="datetime-local"
                    id="post-date"
                    name="postDate"
                    value={values.postDate}
                    onChange={changeHandler} />
                {
                    touched.postDate && errors.postDate2 &&
                    <p className='pad-top-5px validation-text'>{errors.postDate2}</p>
                }
                {
                    touched.postDate && errors.postDate &&
                    <p className='pad-top-5px validation-text'>{errors.postDate}</p>
                }
                <button
                    type="button"
                    className='post-btn'
                    onClick={submitHandler}
                    disabled={!isValid}
                >
                    Post
                </button>
            </form>
        </div>
    );
}
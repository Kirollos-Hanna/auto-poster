import { useState } from 'react';

function validate(validations, values) {
    const errors = validations
        .map(validation => validation(values))
        .filter(validation => typeof validation === 'object');
    // here errors.reduce changes the array into an object that has the inner array values as fields
    return { isValid: errors.length === 0, errors: errors.reduce((errors, error) => ({ ...errors, ...error }), {}) };
}

export function useForm(initialState = {}, validations = [], onSubmit = () => { }) {
    const { isValid: initialIsValid, errors: initialErrors } = validate(validations, initialState);
    const [touched, setTouched] = useState({});
    const [values, setValues] = useState(initialState);
    const [errors, setErrors] = useState(initialErrors);
    const [isValid, setValid] = useState(initialIsValid);

    const changeHandler = ({ target: { value, name } }) => {
        const newValues = { ...values, [name]: value };
        const { isValid, errors } = validate(validations, newValues);
        setValues(newValues);
        setErrors(errors);
        setValid(isValid);
        setTouched({ ...touched, [name]: true });
    };

    const submitHandler = event => {
        event.preventDefault();
        onSubmit(values);
        setValues({ tweetContent: '', postDate: '' });
    };

    return { values, errors, touched, isValid, changeHandler, submitHandler };
}

export function isRequired(value) {
    return value != null && value.trim().length > 0;
}

export function isValidDate(value) {
    const now = new Date();
    const parsedDate = new Date(Date.parse(value));
    return parsedDate.toString() !== "Invalid Date" && now.getTime() < parsedDate.getTime();
}

export function isTooLong(value) {
    return value.trim().length <= 280;
}
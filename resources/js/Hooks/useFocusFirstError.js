import { useEffect } from 'react';

// After a failed submit, move focus to the first invalid control so a keyboard
// or screen-reader user lands on what needs fixing.
export default function useFocusFirstError(formRef, errors) {
    useEffect(() => {
        if (Object.keys(errors).length === 0) return;
        formRef.current?.querySelector('[aria-invalid="true"]')?.focus();
    }, [errors, formRef]);
}

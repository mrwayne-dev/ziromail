// A vertical numbered list joined by a line. Pass <StepperItem> children; numbering
// and the connecting line come from CSS. Use as={Reveal} props via the `className`
// of a wrapper if the steps should stagger in.
export default function Stepper({ children, className = '', ...rest }) {
    return (
        <ol className={`stepper ${className}`.trim()} {...rest}>
            {children}
        </ol>
    );
}

export function StepperItem({ title, when, children }) {
    return (
        <li className="stepper-item">
            <h3>{title}</h3>
            {when && <span className="stepper-when">{when}</span>}
            <div className="stepper-body">{children}</div>
        </li>
    );
}

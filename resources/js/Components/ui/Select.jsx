export default function Select({ options, children, ...rest }) {
    return (
        <select className="select" {...rest}>
            {options
                ? options.map((o) => (
                      <option key={o.value} value={o.value}>
                          {o.label}
                      </option>
                  ))
                : children}
        </select>
    );
}

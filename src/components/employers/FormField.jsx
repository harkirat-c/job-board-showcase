import { Children, cloneElement, isValidElement } from "react";

const invalidStyle = "border-red-500 ring-1 ring-red-500 focus:ring-red-400";

function FormField({ label, labelContent, htmlFor, error, showError = false, children }) {
    const shouldShowError = Boolean(showError && error);

    const child = Children.only(children);

    const enhancedChild = isValidElement(child)
        ? cloneElement(child, {
            className: `${child.props.className || ""} ${shouldShowError ? invalidStyle : ""}`.trim(),
            "aria-invalid": shouldShowError,
            "aria-describedby": shouldShowError ? `${htmlFor}-error` : undefined
        })
        : child;

    return (
        <div className="flex flex-col gap-1 my-2">
            {labelContent || (label && <label htmlFor={htmlFor}>{label}</label>)}
            {enhancedChild}
            {shouldShowError && (
                <p id={`${htmlFor}-error`} className="text-red-400 text-sm">
                    {error}
                </p>
            )}
        </div>
    );
}

export default FormField;

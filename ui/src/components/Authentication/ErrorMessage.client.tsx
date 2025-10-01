import classes from "./component.module.css";

export default function ErrorMessage({ message }: { message: string }) {
  return (
    <div className={classes.errorMessage}>
      {message && (
        <p role="alert" data-testid="error-message">
          {message}
        </p>
      )}
    </div>
  );
}

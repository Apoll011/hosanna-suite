import { Input, type InputProps } from "./Input";

export function SpringInput(props: InputProps) {
  return (
    <span className="hosanna-spring-input">
      <Input {...props} />
      <span className="hosanna-spring-input-track" aria-hidden="true" />
    </span>
  );
}

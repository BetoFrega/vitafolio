import { Result } from "./Result";

export interface UseCase<I = void, O = void> {
  execute(input: I): Promise<Result<O>>;
}

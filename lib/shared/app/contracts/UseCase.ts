export interface UseCase<I = void, O = void> {
  execute(input: I): Promise<O>;
}

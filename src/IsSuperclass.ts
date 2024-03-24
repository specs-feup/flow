type IsSuperclass<T, U> = U extends T ? T : never;
export default IsSuperclass;

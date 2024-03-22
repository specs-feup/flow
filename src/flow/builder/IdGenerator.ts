export default interface IdGenerator {
    next: () => string | undefined;
}

export class SequentialIdGenerator implements IdGenerator {
    #currentId: number;
    #prefix: string;

    constructor(prefix: string = "id_", startId = 0) {
        this.#currentId = startId;
        this.#prefix = prefix;
    }

    next(): string {
        return `${this.#prefix}${this.#currentId++}`;
    }
}

export class UndefinedGenerator implements IdGenerator {
    next(): undefined {
        return undefined;
    }
}

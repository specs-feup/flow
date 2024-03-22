type WithId<D> = Omit<D, "id"> & {
    id: string;
};

export default WithId;

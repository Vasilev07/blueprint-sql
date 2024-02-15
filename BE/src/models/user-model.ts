import { Document, model, Model, Schema } from 'mongoose';

declare interface IUser extends Document {
    username: string;
    password: string;
    firstname: string;
    lastname: string;
    email: string;
};
export interface UserModel extends Model<IUser> {};

export class User {
    private _model: Model<IUser>;

    constructor() {
        const userSchema = new Schema({
            username: String,
            password: String,
            firstName: String,
            lastName: String,
            email: String,
        });

        this._model = model<IUser>('Users', userSchema);
    }

    public get model(): Model<IUser> {
        return this._model;
    }
}

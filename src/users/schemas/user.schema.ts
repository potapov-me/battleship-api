import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type UserDocument = User & Document;

@Schema({
  toJSON: {
    virtuals: true,
    transform: (doc, ret) => {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-expect-error
      delete ret._id;
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-expect-error
      delete ret.__v;
    },
  },
  toObject: {
    virtuals: true,
    transform: (doc, ret) => {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-expect-error
      delete ret._id;
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-expect-error
      delete ret.__v;
    },
  },
  versionKey: false,
})
export class User {
  // Виртуальное поле для строкового представления ID
  readonly id: string;

  // Основной идентификатор MongoDB
  _id: Types.ObjectId;

  @Prop({ required: true, unique: true })
  username: string;

  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true })
  password: string;

  @Prop([String])
  roles: string[];

  @Prop({ default: false })
  isEmailConfirmed: boolean;

  @Prop()
  emailConfirmationToken?: string;
}

export const UserSchema = SchemaFactory.createForClass(User);

// Добавляем виртуальное поле 'id'
UserSchema.virtual('id').get(function () {
  return this._id.toHexString();
});

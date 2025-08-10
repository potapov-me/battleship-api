import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type UserDocument = User & Document;

@Schema({
  timestamps: true,
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

  @Prop({ required: true, unique: true, trim: true })
  username: string;

  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  email: string;

  @Prop({ required: true })
  password: string;

  @Prop({ type: [String], default: ['player'] })
  roles: string[];

  @Prop({ default: false })
  isEmailConfirmed: boolean;

  @Prop()
  emailConfirmationToken?: string;

  @Prop()
  emailConfirmationExpires?: Date;

  @Prop({ default: 1000 })
  rating: number;

  @Prop({ default: 0 })
  totalGames: number;

  @Prop({ default: 0 })
  wins: number;

  @Prop({ default: 0 })
  losses: number;

  @Prop({ default: true })
  isActive: boolean;

  @Prop()
  lastLoginAt?: Date;

  @Prop()
  avatar?: string;

  @Prop()
  bio?: string;

  @Prop({ type: Date })
  createdAt: Date;

  @Prop({ type: Date })
  updatedAt: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);

// Добавляем виртуальное поле 'id'
UserSchema.virtual('id').get(function () {
  return this._id.toHexString();
});

// Добавляем виртуальное поле для процента побед
UserSchema.virtual('winRate').get(function () {
  if (this.totalGames === 0) return 0;
  return Math.round((this.wins / this.totalGames) * 100);
});

// Индексы для оптимизации запросов
UserSchema.index({ rating: -1 });
UserSchema.index({ totalGames: -1 });
UserSchema.index({ createdAt: -1 });

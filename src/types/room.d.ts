import { Types } from 'mongoose';

export interface Room {
  _id: Types.ObjectId;
  owner: Types.ObjectId;
  name: string;
  description?: string;
  isPrivate: boolean;
  password?: string;
  code: string;
  language: string;
  createdAt: Date;
  updatedAt: Date;
  participants: {
    user: Types.ObjectId;
    joinedAt: Date;
  }[];
  sharedWith: {
    user: Types.ObjectId;
    sharedAt: Date;
  }[];
  lastActivity: Date;
}

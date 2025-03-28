
export interface Room {
  id: string;
  _id?: string;
  name: string;
  language: string;
  code: string;
  isPrivate: boolean;
  password?: string | null;
  owner: {
    id?: string;
    _id?: string;
    username: string;
    avatar?: string;
  };
  participants: {
    user: {
      id?: string;
      _id?: string;
      username: string;
      avatar?: string;
    };
    joinedAt: Date;
  }[];
  sharedWith?: {
    user: {
      id?: string;
      _id?: string;
      username: string;
      avatar?: string;
    };
    sharedAt: Date;
  }[];
  createdAt?: Date;
  lastActivity?: Date;
}

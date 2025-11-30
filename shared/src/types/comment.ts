export interface Comment {
  id: string;
  lineItemId: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateCommentInput {
  lineItemId: string;
  content: string;
}

export interface UpdateCommentInput {
  content: string;
}


export type ChatRole = "visitor" | "assistant" | "operator" | "system";
export type ChatStatus = "bot" | "needs_operator" | "operator" | "closed";

export type ChatProductCard = {
  slug: string;
  name: string;
  price: number;
  size: string;
  imageUrl: string;
  imageKey: string;
  note: string;
};

export type ChatMessageView = {
  id: string;
  role: ChatRole;
  content: string;
  products: ChatProductCard[];
  total: number | null;
  createdAt: string;
};

export type ChatState = {
  status: ChatStatus;
  customerName: string;
  messages: ChatMessageView[];
};

export type ActionResponse<T = any> = {
  success: boolean;
  message?: string;
  code?: string;
  data?: T;
};

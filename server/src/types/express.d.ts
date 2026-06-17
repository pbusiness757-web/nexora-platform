declare namespace Express {
  interface Request {
    nexoraUser?: {
      sub: string;
      role: string;
      exp: number;
    };
  }
}

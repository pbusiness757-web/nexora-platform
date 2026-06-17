declare namespace Express {
  interface Request {
    nexoraUser?: {
      sub: string;
      role: string;
      exp: number;
    };
    nexoraClientUser?: {
      sub: string;
      email: string;
      role: "CLIENT";
      exp: number;
    };
  }
}

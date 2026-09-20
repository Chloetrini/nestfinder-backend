declare global {
  namespace Express {
    interface Request {
      // Set by the auth middleware after the JWT is verified
      user?: { id: string; role: string }
    }
  }
}

export {}

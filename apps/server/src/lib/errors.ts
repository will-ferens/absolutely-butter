export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message)
    this.name = 'ApiError'
  }
}

export class UnauthorizedError extends ApiError {
  constructor(msg = 'Unauthorized') { super(401, msg) }
}

export class NotFoundError extends ApiError {
  constructor(msg = 'Not found') { super(404, msg) }
}

export class ForbiddenError extends ApiError {
  constructor(msg = 'Forbidden') { super(403, msg) }
}

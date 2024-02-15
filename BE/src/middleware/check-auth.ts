import { NextFunction, Response } from 'express';
import { verify } from 'jsonwebtoken';

export const checkAuth = (request: any, response: Response, next: NextFunction) => {
    const token = request.headers.authorization?.split(' ')[1] as any;
    const decoded = verify(token, 'secred');

    if (!decoded) {
        response.status(401).json({ message: 'failed' });
    }

    request.userData = decoded;
    next();
};
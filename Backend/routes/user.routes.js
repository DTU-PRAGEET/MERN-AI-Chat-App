import { Router } from 'express';
import * as userController from '../controllers/user.controller.js';
import {body} from "express-validator";
import * as authMiddleware from '../Middleware/auth.middleware.js';
import user from '../models/user.model.js';

const router = Router();

router.post('/register',     
    body('email').isEmail().withMessage('Email is required and must be valid.'),
    body('password').isLength({ min: 3 }).withMessage('Password must be at least 3 characters long.'),
    userController.createUserController
);

router.post('/login',
    body('email').isEmail().withMessage('Email is required and must be valid.'),
    body('password').isLength({ min: 3 }).withMessage('Password must be at least 3 characters long.'),
    userController.loginController
);

router.get('/profile',authMiddleware.authUser, userController.profileController);

router.get('/logout', authMiddleware.authUser, userController.logoutController);

router.get('/all', 
    authMiddleware.authUser,
    userController.getAllUsers
);  

export default router;
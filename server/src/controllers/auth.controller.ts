import { Request, Response, NextFunction } from 'express';
import prisma from '../utils/prisma';
import { hashPassword, comparePassword } from '../utils/bcrypt';
import { generateToken } from '../utils/jwt';
import crypto from 'crypto';
import { sendWelcomeEmail, sendResetPasswordEmail } from '../services/mailer.service';

export const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password, firstName, lastName } = req.body;

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'User already exists' });
    }

    const passwordHash = await hashPassword(password);

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        firstName,
        lastName,
      },
    });

    // Automatically send Welcome Email
    try {
      await sendWelcomeEmail(user.email, user.firstName);
    } catch (mailError) {
      console.error('Welcome email dispatch skipped/failed:', mailError);
    }

    const token = generateToken(user.id);

    res.status(201).json({
      success: true,
      token,
      user: { id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName }
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(404).json({ success: false, message: 'user_not_found' });
    }

    const isPasswordValid = await comparePassword(password, user.passwordHash);
    if (!isPasswordValid) {
      return res.status(401).json({ success: false, message: 'incorrect_password' });
    }

    const token = generateToken(user.id);

    res.status(200).json({
      success: true,
      token,
      user: { id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName }
    });
  } catch (error) {
    next(error);
  }
};

export const forgotPassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, smtpConfig } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      // Return 200 for security reasons to prevent user enumeration
      return res.status(200).json({ success: true, message: 'If account exists, email has been sent.' });
    }

    const token = crypto.randomBytes(20).toString('hex');
    const tokenExpiry = new Date(Date.now() + 3600000); // 1 hour

    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken: token,
        resetTokenExpiry: tokenExpiry
      }
    });

    const resetLink = `http://localhost:3000/reset-password?token=${token}`;
    
    let mailResult;
    try {
      mailResult = await sendResetPasswordEmail(email, resetLink, smtpConfig);
    } catch (mailErr) {
      console.error('Password reset email dispatch failed:', mailErr);
      return res.status(500).json({ success: false, message: 'Email sending failed' });
    }

    res.status(200).json({ 
      success: true, 
      message: 'Password reset link sent to your email.',
      previewUrl: mailResult?.previewUrl,
      isTest: mailResult?.isTest
    });
  } catch (error) {
    next(error);
  }
};

export const resetPassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { token, newPassword } = req.body;

    const user = await prisma.user.findFirst({
      where: {
        resetToken: token,
        resetTokenExpiry: {
          gt: new Date()
        }
      }
    });

    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid or expired reset token' });
    }

    const passwordHash = await hashPassword(newPassword);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        resetToken: null,
        resetTokenExpiry: null
      }
    });

    res.status(200).json({ success: true, message: 'Password has been reset successfully' });
  } catch (error) {
    next(error);
  }
};


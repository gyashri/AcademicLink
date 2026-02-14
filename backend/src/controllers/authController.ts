import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../models/User';
import { University } from '../models/University';
import { ApiError } from '../utils/apiError';
import { sendOTPEmail } from '../utils/sendEmail';
import { AuthRequest, JwtPayload } from '../types';

const generateOTP = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const generateTokens = (payload: JwtPayload) => {
  const accessToken = jwt.sign(payload, process.env.JWT_SECRET || 'fallback-secret', {
    expiresIn: (process.env.JWT_EXPIRES_IN || '15m') as any,
  });
  const refreshToken = jwt.sign(payload, process.env.JWT_REFRESH_SECRET || 'fallback-refresh', {
    expiresIn: (process.env.JWT_REFRESH_EXPIRES_IN || '7d') as any,
  });
  return { accessToken, refreshToken };
};

export const register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      throw new ApiError(400, 'Name, email, and password are required.');
    }

    if (password.length < 8) {
      throw new ApiError(400, 'Password must be at least 8 characters.');
    }

    // Extract domain from email
    const domain = email.split('@')[1];
    if (!domain) {
      throw new ApiError(400, 'Invalid email format.');
    }

    // Find university by email domain
    const university = await University.findOne({ domain });
    if (!university) {
      throw new ApiError(400, 'Your email domain is not associated with a registered university. Use your university email.');
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new ApiError(409, 'An account with this email already exists.');
    }

    // Hash password and generate OTP
    const passwordHash = await bcrypt.hash(password, 12);
    const otp = generateOTP();
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    const user = await User.create({
      name,
      email,
      passwordHash,
      university: university._id,
      otp,
      otpExpiresAt,
    });

    // Send OTP email
    await sendOTPEmail(email, otp);

    res.status(201).json({
      success: true,
      message: 'Account created. Please verify your email with the OTP sent.',
      data: { userId: user._id, email: user.email },
    });
  } catch (error) {
    next(error);
  }
};

export const verifyEmail = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      throw new ApiError(400, 'Email and OTP are required.');
    }

    const user = await User.findOne({ email });
    if (!user) {
      throw new ApiError(404, 'User not found.');
    }

    if (user.verified) {
      throw new ApiError(400, 'Email is already verified.');
    }

    if (user.otp !== otp) {
      throw new ApiError(400, 'Invalid OTP.');
    }

    if (user.otpExpiresAt && user.otpExpiresAt < new Date()) {
      throw new ApiError(400, 'OTP has expired. Please request a new one.');
    }

    user.verified = true;
    user.otp = undefined;
    user.otpExpiresAt = undefined;
    await user.save();

    // Generate tokens
    const payload: JwtPayload = { id: String(user._id), email: user.email, role: user.activeMode };
    const { accessToken, refreshToken } = generateTokens(payload);

    user.refreshToken = refreshToken;
    await user.save();

    res.json({
      success: true,
      message: 'Email verified successfully.',
      data: { accessToken, refreshToken, user: { id: user._id, name: user.name, email: user.email, activeMode: user.activeMode } },
    });
  } catch (error) {
    next(error);
  }
};

export const resendOTP = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) throw new ApiError(404, 'User not found.');
    if (user.verified) throw new ApiError(400, 'Email is already verified.');

    const otp = generateOTP();
    user.otp = otp;
    user.otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();

    await sendOTPEmail(email, otp);

    res.json({ success: true, message: 'New OTP sent to your email.' });
  } catch (error) {
    next(error);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      throw new ApiError(400, 'Email and password are required.');
    }

    const user = await User.findOne({ email });
    if (!user) {
      throw new ApiError(401, 'Invalid email or password.');
    }

    if (!user.verified) {
      throw new ApiError(403, 'Please verify your email before logging in.');
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      throw new ApiError(401, 'Invalid email or password.');
    }

    const payload: JwtPayload = { id: String(user._id), email: user.email, role: user.activeMode };
    const { accessToken, refreshToken } = generateTokens(payload);

    user.refreshToken = refreshToken;
    await user.save();

    res.json({
      success: true,
      data: {
        accessToken,
        refreshToken,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          activeMode: user.activeMode,
          avatar: user.avatar,
          stripeOnboarded: user.stripeOnboarded,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

export const refreshToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { refreshToken: token } = req.body;
    if (!token) throw new ApiError(400, 'Refresh token is required.');

    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET || 'fallback-refresh') as JwtPayload;
    const user = await User.findById(decoded.id);

    if (!user || user.refreshToken !== token) {
      throw new ApiError(401, 'Invalid refresh token.');
    }

    const payload: JwtPayload = { id: String(user._id), email: user.email, role: user.activeMode };
    const tokens = generateTokens(payload);

    user.refreshToken = tokens.refreshToken;
    await user.save();

    res.json({ success: true, data: tokens });
  } catch (error) {
    next(error);
  }
};

export const switchMode = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { mode } = req.body;

    if (!mode || !['buyer', 'seller'].includes(mode)) {
      throw new ApiError(400, 'Mode must be "buyer" or "seller".');
    }

    const user = await User.findByIdAndUpdate(userId, { activeMode: mode }, { new: true });
    if (!user) throw new ApiError(404, 'User not found.');

    res.json({
      success: true,
      message: `Switched to ${mode} mode.`,
      data: { activeMode: user.activeMode },
    });
  } catch (error) {
    next(error);
  }
};

export const getProfile = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = await User.findById(req.user?.id)
      .select('-passwordHash -otp -otpExpiresAt -refreshToken')
      .populate('university', 'name domain departments');

    if (!user) throw new ApiError(404, 'User not found.');

    res.json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

export const updateProfile = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { name, avatar } = req.body;
    const updates: Record<string, any> = {};
    if (name) updates.name = name;
    if (avatar) updates.avatar = avatar;

    const user = await User.findByIdAndUpdate(req.user?.id, updates, { new: true })
      .select('-passwordHash -otp -otpExpiresAt -refreshToken');

    if (!user) throw new ApiError(404, 'User not found.');

    res.json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

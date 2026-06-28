import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import prisma from '../utils/prisma';
import { sendSubscriptionChangeEmail } from '../services/mailer.service';

export const getUserSubscriptions = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const subscriptions = await prisma.userSubscription.findMany({
      where: { userId },
      include: { plan: true, analytics: true },
    });

    res.status(200).json({ success: true, data: subscriptions });
  } catch (error) {
    next(error);
  }
};

export const getPlans = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const plans = await prisma.plan.findMany();
    res.status(200).json({ success: true, data: plans });
  } catch (error) {
    next(error);
  }
};

export const createSubscription = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const { name, price, billingCycle, nextBilling, category, features, isFamilyPlan, smtpConfig } = req.body;

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    // Find or create Plan
    let plan = await prisma.plan.findUnique({ where: { name } });
    if (!plan) {
      plan = await prisma.plan.create({
        data: {
          name,
          price: Number(price),
          billingCycle: billingCycle === 'YEARLY' ? 'YEARLY' : 'MONTHLY',
          features: features || [],
          description: isFamilyPlan ? 'Shared Family Plan' : 'Individual Plan'
        }
      });
    }

    const subscription = await prisma.userSubscription.create({
      data: {
        userId,
        planId: plan.id,
        status: 'ACTIVE',
        endDate: new Date(nextBilling || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)),
        autoRenew: true
      },
      include: { plan: true }
    });

    // Send confirmation email
    try {
      const priceText = `$${Number(price).toFixed(2)}`;
      await sendSubscriptionChangeEmail(user.email, name, 'Created', priceText, smtpConfig);
    } catch (mailErr) {
      console.error('Subscription welcome email failed:', mailErr);
    }

    res.status(201).json({ success: true, data: subscription });
  } catch (error) {
    next(error);
  }
};

export const updateSubscription = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const id = req.params.id as string;
    const { status, nextBilling, price, category, features, smtpConfig } = req.body;

    const subscription = await prisma.userSubscription.findUnique({
      where: { id },
      include: { plan: true }
    });

    if (!subscription || subscription.userId !== userId) {
      return res.status(404).json({ success: false, message: 'Subscription not found' });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    // Update Plan details if price or features changed
    if (price !== undefined || features !== undefined) {
      await prisma.plan.update({
        where: { id: subscription.planId },
        data: {
          price: price !== undefined ? Number(price) : undefined,
          features: features !== undefined ? features : undefined
        }
      });
    }

    const updatedSubscription = await prisma.userSubscription.update({
      where: { id },
      data: {
        status: status || undefined,
        endDate: nextBilling ? new Date(nextBilling) : undefined
      },
      include: { plan: true }
    });

    // Send update email notification
    try {
      const priceText = price !== undefined ? `$${Number(price).toFixed(2)}` : `$${Number((subscription as any).plan.price).toFixed(2)}`;
      const actionType = status === 'CANCELED' ? 'Canceled' : 'Modified';
      await sendSubscriptionChangeEmail(user.email, (subscription as any).plan.name, actionType, priceText, smtpConfig);
    } catch (mailErr) {
      console.error('Subscription update email failed:', mailErr);
    }

    res.status(200).json({ success: true, data: updatedSubscription });
  } catch (error) {
    next(error);
  }
};

export const deleteSubscription = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const id = req.params.id as string;
    const { smtpConfig } = req.body;

    const subscription = await prisma.userSubscription.findUnique({
      where: { id },
      include: { plan: true }
    });

    if (!subscription || subscription.userId !== userId) {
      return res.status(404).json({ success: false, message: 'Subscription not found' });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    // Delete related analytics metrics first to prevent foreign key errors
    await prisma.analytics.deleteMany({ where: { userSubscriptionId: id } });

    // Delete UserSubscription
    await prisma.userSubscription.delete({ where: { id } });

    // Send cancellation email
    try {
      await sendSubscriptionChangeEmail(user.email, (subscription as any).plan.name, 'Canceled', undefined, smtpConfig);
    } catch (mailErr) {
      console.error('Subscription cancellation email failed:', mailErr);
    }

    res.status(200).json({ success: true, message: 'Subscription deleted successfully' });
  } catch (error) {
    next(error);
  }
};


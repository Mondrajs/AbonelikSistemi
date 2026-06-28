import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import prisma from '../utils/prisma';

export const getAnalyticsSummary = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const subscriptions = await prisma.userSubscription.findMany({
      where: { userId },
      include: { plan: true }
    });

    const activeSubs = subscriptions.filter(s => s.status === 'ACTIVE');
    const totalActive = activeSubs.length;
    const totalPassive = subscriptions.length - totalActive;

    let totalMonthlySpend = 0;
    const categorySpend: Record<string, number> = {
      'Entertainment': 0,
      'Productivity': 0,
      'Utilities': 0,
      'Other': 0
    };

    activeSubs.forEach(sub => {
      const price = Number(sub.plan.price);
      const isYearly = sub.plan.billingCycle === 'YEARLY';
      const monthlyCost = isYearly ? price / 12 : price;
      totalMonthlySpend += monthlyCost;

      // Group by description (which contains category tags)
      const desc = sub.plan.description || 'Other';
      if (desc.includes('Shared Family') || sub.plan.name.toLowerCase().includes('family')) {
        categorySpend['Entertainment'] += monthlyCost;
      } else if (sub.plan.name.toLowerCase().includes('adobe')) {
        categorySpend['Productivity'] += monthlyCost;
      } else {
        categorySpend['Utilities'] += monthlyCost;
      }
    });

    // Find next upcoming payment dates
    const upcomingRenewals = activeSubs
      .map(sub => ({
        id: sub.id,
        name: sub.plan.name,
        nextBilling: sub.endDate,
        price: Number(sub.plan.price)
      }))
      .sort((a, b) => new Date(a.nextBilling).getTime() - new Date(b.nextBilling).getTime());

    res.status(200).json({
      success: true,
      data: {
        totalActive,
        totalPassive,
        totalMonthlySpend,
        categorySpend,
        upcomingRenewals
      }
    });
  } catch (error) {
    next(error);
  }
};

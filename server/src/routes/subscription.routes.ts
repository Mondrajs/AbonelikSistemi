import { Router } from 'express';
import { 
  getUserSubscriptions, 
  getPlans,
  createSubscription,
  updateSubscription,
  deleteSubscription
} from '../controllers/subscription.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

// Protect all subscription routes
router.use(authenticate);

router.get('/my-subscriptions', getUserSubscriptions);
router.get('/plans', getPlans);
router.post('/add', createSubscription);
router.put('/update/:id', updateSubscription);
router.delete('/delete/:id', deleteSubscription);

export default router;

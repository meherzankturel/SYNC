import express, { Request, Response } from 'express';
import Review from '../models/Review.model';

const router = express.Router();

// Create review
router.post('/', async (req: Request, res: Response) => {
  try {
    const review = new Review(req.body);
    await review.save();
    res.status(201).json(review);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Get reviews by date night
router.get('/date-night/:dateNightId', async (req: Request, res: Response) => {
  try {
    const { dateNightId } = req.params;
    const reviews = await Review.find({ dateNightId }).sort({ createdAt: -1 });
    res.json(reviews);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get single review
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) {
      return res.status(404).json({ error: 'Review not found' });
    }
    res.json(review);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Update review
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const review = await Review.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!review) {
      return res.status(404).json({ error: 'Review not found' });
    }
    res.json(review);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Delete review
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const review = await Review.findByIdAndDelete(req.params.id);
    if (!review) {
      return res.status(404).json({ error: 'Review not found' });
    }
    res.json({ message: 'Review deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;


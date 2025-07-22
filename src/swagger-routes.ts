// This file is used only for swagger documentation generation
// It mirrors your index.ts route structure

import express from 'express';
import userRoutes from './routes/userRoutes';
import roundRoutes from './routes/roundRoutes';
import jobAppRoutes from './routes/applicationRoutes';
import jobRoutes from './routes/jobRoutes';

const app = express();

// Mirror the exact same route structure as your index.ts
app.use('/api/users', userRoutes);
app.use('/api/rounds', roundRoutes);
app.use('/api/applications', jobAppRoutes);
app.use('/api/jobs', jobRoutes);

export default app;
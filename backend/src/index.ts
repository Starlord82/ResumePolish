import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { healthHandler } from './routes/health';
import { extractHandler } from './routes/extract';
import { improveHandler } from './routes/improve';
import { generateDocxHandler } from './routes/generateDocx';
import { generatePdfHandler } from './routes/generatePdf';
import { getStylesHandler } from './routes/styles';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json({ limit: '20mb' }));

const upload = multer({ dest: '/tmp/uploads/', limits: { fileSize: 20 * 1024 * 1024 } });

// Routes
app.get('/api/health', healthHandler);
app.get('/api/styles', getStylesHandler);
app.post('/api/extract', upload.single('resume_file'), extractHandler);
app.post('/api/improve', improveHandler);
app.post('/api/generate-docx', upload.single('template_file'), generateDocxHandler);
app.post('/api/generate-pdf', upload.single('template_file'), generatePdfHandler);

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Backend listening on port ${PORT}`);
});

import { Router } from 'express';
import { prisma } from '../lib/prisma';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const upload = multer({
  dest: path.join(process.cwd(), 'uploads'),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /\.(pdf|doc|docx|jpg|jpeg|png)$/i;
    if (allowedTypes.test(file.originalname)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, DOC, DOCX, and images are allowed.'));
    }
  },
});

export const documentRoutes = Router();

// Upload documents for a line item
documentRoutes.post('/line-item/:lineItemId', upload.array('documents', 10), async (req, res) => {
  try {
    const { lineItemId } = req.params;
    const files = req.files as Express.Multer.File[];

    if (!files || files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    const lineItem = await prisma.lineItem.findUnique({
      where: { id: lineItemId },
    });

    if (!lineItem) {
      // Clean up uploaded files
      files.forEach(file => {
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
      });
      return res.status(404).json({ error: 'Line item not found' });
    }

    const metadata = lineItem.metadata ? JSON.parse(lineItem.metadata as string) : {};
    const documents = metadata.documents || [];

    const newDocuments = files.map(file => ({
      name: file.originalname,
      filename: file.filename,
      path: file.path,
      size: file.size,
      mimetype: file.mimetype,
      uploadedAt: new Date().toISOString(),
    }));

    metadata.documents = [...documents, ...newDocuments];

    await prisma.lineItem.update({
      where: { id: lineItemId },
      data: {
        metadata: JSON.stringify(metadata),
      },
    });

    res.json({ documents: newDocuments });
  } catch (error: any) {
    console.error('Error uploading documents:', error);
    res.status(500).json({ error: 'Failed to upload documents', details: error.message });
  }
});

// Get documents for a line item
documentRoutes.get('/line-item/:lineItemId', async (req, res) => {
  try {
    const lineItem = await prisma.lineItem.findUnique({
      where: { id: req.params.lineItemId },
    });

    if (!lineItem) {
      return res.status(404).json({ error: 'Line item not found' });
    }

    const metadata = lineItem.metadata ? JSON.parse(lineItem.metadata as string) : {};
    res.json({ documents: metadata.documents || [] });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch documents' });
  }
});

// Delete a document
documentRoutes.delete('/line-item/:lineItemId/:documentIndex', async (req, res) => {
  try {
    const { lineItemId, documentIndex } = req.params;
    const index = parseInt(documentIndex);

    const lineItem = await prisma.lineItem.findUnique({
      where: { id: lineItemId },
    });

    if (!lineItem) {
      return res.status(404).json({ error: 'Line item not found' });
    }

    const metadata = lineItem.metadata ? JSON.parse(lineItem.metadata as string) : {};
    const documents = metadata.documents || [];

    if (index < 0 || index >= documents.length) {
      return res.status(400).json({ error: 'Invalid document index' });
    }

    // Delete file from filesystem
    const document = documents[index];
    if (document.path && fs.existsSync(document.path)) {
      fs.unlinkSync(document.path);
    }

    documents.splice(index, 1);
    metadata.documents = documents;

    await prisma.lineItem.update({
      where: { id: lineItemId },
      data: {
        metadata: JSON.stringify(metadata),
      },
    });

    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete document' });
  }
});

// Serve uploaded files
documentRoutes.get('/file/:filename', (req, res) => {
  try {
    const filePath = path.join(process.cwd(), 'uploads', req.params.filename);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'File not found' });
    }
    res.sendFile(path.resolve(filePath));
  } catch (error) {
    res.status(500).json({ error: 'Failed to serve file' });
  }
});


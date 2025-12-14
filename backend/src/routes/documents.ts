import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { requireAuth } from '../middleware/auth';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { sanitizeFilename, getSafeFilePath, validateMimeType, DOCUMENT_MIME_TYPES } from '../utils/fileSecurity';

const uploadsDir = path.join(process.cwd(), 'uploads');

const upload = multer({
  dest: uploadsDir,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
  fileFilter: (req, file, cb) => {
    // Check extension
    const allowedExtensions = /\.(pdf|doc|docx|jpg|jpeg|png)$/i;
    if (!allowedExtensions.test(file.originalname)) {
      return cb(new Error('Invalid file type. Only PDF, DOC, DOCX, and images are allowed.'));
    }
    
    // Validate MIME type
    if (!validateMimeType(file.mimetype, DOCUMENT_MIME_TYPES)) {
      return cb(new Error('Invalid file MIME type. File content does not match extension.'));
    }
    
    cb(null, true);
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
    res.status(500).json({ error: 'Failed to upload documents' });
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

// Serve uploaded files (requires authentication and authorization)
documentRoutes.get('/file/:filename', requireAuth, async (req, res) => {
  try {
    // Sanitize filename to prevent path traversal
    const safeFilePath = getSafeFilePath(req.params.filename, uploadsDir);
    if (!safeFilePath || !fs.existsSync(safeFilePath)) {
      return res.status(404).json({ error: 'File not found' });
    }

    // Find the line item that owns this file to verify access
    const sanitizedFilename = sanitizeFilename(req.params.filename);
    const lineItem = await prisma.lineItem.findFirst({
      where: {
        metadata: {
          contains: sanitizedFilename,
        },
      },
      include: {
        Event: {
          select: {
            id: true,
          },
        },
      },
    });

    if (!lineItem) {
      return res.status(404).json({ error: 'File not found' });
    }

    // Verify user has access to the event (all authenticated users can access files for now)
    // In the future, you might want to add more granular permissions here
    // For example, only users with access to the event can view its files

    // Get file metadata to determine Content-Type
    let contentType = 'application/octet-stream';
    let originalName = sanitizedFilename;

    try {
      if (lineItem.metadata) {
        const metadata = JSON.parse(lineItem.metadata as string);
        const documents = metadata.documents || [];
        const document = documents.find((doc: any) => doc.filename === sanitizedFilename);
        if (document) {
          if (document.mimetype) {
            contentType = document.mimetype;
          }
          if (document.name) {
            originalName = document.name;
          }
        }
      }
    } catch (e) {
      // Fallback to extension-based detection if metadata parsing fails
      const ext = path.extname(sanitizedFilename).toLowerCase();
      const mimeTypes: Record<string, string> = {
        '.pdf': 'application/pdf',
        '.doc': 'application/msword',
        '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.png': 'image/png',
      };
      contentType = mimeTypes[ext] || contentType;
    }

    // Set headers for proper display (inline) instead of download
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(originalName)}"`);
    
    res.sendFile(path.resolve(safeFilePath));
  } catch (error) {
    console.error('Error serving file:', error);
    res.status(500).json({ error: 'Failed to serve file' });
  }
});


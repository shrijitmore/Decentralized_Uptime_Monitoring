import express from 'express';
import authMiddleware from './middleware/middleware.js';
import {prisma} from 'db';
import cors from 'cors';

const app = express();

// Configure CORS FIRST - before other middleware
// This is critical for preflight OPTIONS requests
// The cors middleware automatically handles OPTIONS preflight requests
app.use(cors({
    origin: '*', // Allow all origins
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
    exposedHeaders: ['Content-Type'],
    credentials: false, // Set to false when using origin: '*'
    optionsSuccessStatus: 200, // Some legacy browsers (IE11) choke on 204
    preflightContinue: false, // Let cors handle preflight
}));

app.use(express.json());

app.post('/api/v1/website', authMiddleware, async (req, res) => {
    const userId = req.userId;
    const { url } = req.body;
    const website = await prisma.website.create({
        data: {
            userId: userId,
            url: url,
        }
    });
    res.json({
        id:website.id,
    })
});

app.post('/api/v1/website/:websiteId/tick', authMiddleware, async (req, res) => {
    try {
        const userId = req.userId;
        const { websiteId } = req.params;
        const { status, latency } = req.body as { status?: string; latency?: number };

        if (!websiteId) {
            return res.status(400).json({ error: 'websiteId is required in the path' });
        }

        if (!status || !['Good', 'Bad', 'Unknown'].includes(status)) {
            return res.status(400).json({ error: 'status must be one of Good, Bad, Unknown' });
        }

        if (typeof latency !== 'number' || latency < 0) {
            return res.status(400).json({ error: 'latency must be a non‑negative number' });
        }

        // Ensure website belongs to the current user and is not disabled
        const website = await prisma.website.findFirst({
            where: {
                id: websiteId,
                userId: userId,
                disabled: false,
            },
        });

        if (!website) {
            return res.status(404).json({ error: 'Website not found' });
        }

        // For now, use a single shared validator per API node
        let validator = await prisma.validator.findFirst({
            where: {
                ip: 'local',
            },
        });

        if (!validator) {
            validator = await prisma.validator.create({
                data: {
                    publicKey: 'local-validator',
                    location: 'local',
                    ip: 'local',
                },
            });
        }

        const tick = await prisma.websiteTick.create({
            data: {
                websiteId: website.id,
                validatorId: validator.id,
                status: status as any,
                latency,
            },
        });

        return res.status(201).json({ tick });
    } catch (err) {
        console.error('Failed to create website tick', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

app.get('/api/v1/website/status', authMiddleware, async (req, res) => {
   const userId = req.userId;
   const { websiteId } = req.query;
   const website = await prisma.website.findFirst({
    where: {
        id: websiteId as string,
        userId: userId,
        disabled: false,
    },
    include: {
        ticks: {
            orderBy: {
                createdAt: 'desc',
            },
            take: 10,
        },
    }
   });
   res.json({
    website: website,
   })
});
app.get('/api/v1/websites', authMiddleware, async (req, res) => {
    const userId = req.userId;
    const websites = await prisma.website.findMany({
        where: {
            userId: userId,
            disabled: false,
        },
        include: {
            ticks: {
                orderBy: {
                    createdAt: 'desc',
                },
                take: 10,
            },
        },
    });
    res.json({
        websites: websites,
    })
});
app.delete('/api/v1/website/:wesiteId', authMiddleware, async (req, res) => {
    const userId = req.userId;
    const websiteId = req.body.websiteId;
    await prisma.website.update({
        where: {
            id: websiteId,
            userId: userId,
        },
        data: {
            disabled: true,
        },
    });
    res.json({
        message: 'Website deleted successfully',
    })
});
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
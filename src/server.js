require('dotenv/config');

const express = require('express');
const cors = require('cors');
const Queue = require('bull');
const BullBoard = require('bull-board');

const packageTrackObjects = [
    {
        transporter: '',
        trackNumber: ''
    },
];

const app = express();

app.use(express.json());
app.use(cors());

app.use('/admin/queues', BullBoard.UI);

app.get('/queue/add', (req, res) => {
    const packageTrackerNotificationQueue = new Queue('package-tracker-notification-queue');
    packageTrackerNotificationQueue.add(
        {
            packageTrackObjects
        }, 
        {
            repeat: {
                every: 600 * 1000
            }
        }
    );
    BullBoard.setQueues(packageTrackerNotificationQueue);
    return res.json({});
});

app.listen(4500, '0.0.0.0', () => {
    console.log('Server started');
});
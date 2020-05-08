require('dotenv/config');

const fs = require('fs');
const Queue = require('bull');
const {Expo} = require('expo-server-sdk');
const {fetchEventsFromAzulCargoExpress, fetchEventsFromEasyCourier} = require('package-tracker-ptbr');

const packageTrackerNotificationQueue = new Queue('package-tracker-notification-queue');

packageTrackerNotificationQueue.process( async ({data}) => {

    let compatibleTransports = {
        'azulcargoexpress': fetchEventsFromAzulCargoExpress,
        'easycourier': fetchEventsFromEasyCourier,
    }

    for(const packageTrack of data.packageTrackObjects) {
        
        let events = [];
        let filePath = packageTrack.transporter+"_"+packageTrack.trackNumber+".json";
        if(!fs.existsSync(filePath)) {
            await fs.writeFileSync(filePath,'{"events":[]}');
        }

        let previousEvents = JSON.parse( await fs.readFileSync(filePath)).events;
        
        let trackerFunction = compatibleTransports[packageTrack.transporter];

        if(!trackerFunction) {
            continue;
        }

        events = await trackerFunction(packageTrack.trackNumber);

        if(events.length > previousEvents.length) {
            let expo = new Expo();
            await expo.sendPushNotificationsAsync([
                {
                    to: process.env.NOTIFY_TO_TOKEN,
                    sound: 'default',
                    title: 'Status do pacote',
                    body: `Houve uma atualização no pacote ${packageTrack.trackNumber} na transportadora ${packageTrack.transporter}`,
                    priority: 'high',
                    channelId: 'default',
                }
            ]);
            await fs.writeFileSync(filePath, JSON.stringify({events}));
        }
    }
});
class Database {
    constructor() {
        this.db = {
            'Me': {
                type: 'text',
                counter: 0,
                responses: [
                    'I don\'t know, I can\'t see you!',
                    'I don\'t know, I can\'t see you!',
                    'I don\'t know, I can\'t see you!',
                    'I don\'t know, I can\'t see you!',
                    'A silly little hypercube!'
                ],
                aliases:['I']
            },
            'Where': {
                type: 'text',
                counter: 0,
                responses: [
                    'filingcabinetparadox.com, silly.',
                    'filingcabinetparadox.com, silly.',
                    'filingcabinetparadox.com, silly!',
                    'filingcabinetparadox.com, silly.',
                    'Where does a sphere go when it\’s done pretending to be a circle?'
                ],
                aliases:['Where am I', 'Where are we', 'Where is this', 'Where is this place']
            },
            'Otto': {
                type: 'text',
                counter: 0,
                responses: [
                    'What, did you write this or something?',
                    'What, did you write this or something?',
                    'What, did you write this or something?',
                    'What, did you write this or something?',
                    'Wh0 are3 y0u?'
                ],
                aliases:['Oto']
            },
            'fcp': {
                type: 'text',
                counter: 0,
                responses: [
                    'A long story…',
                    'A long story…',
                    'A long story…',
                    'A long story…',
                    'Follow along, explore and see!'
                ],
                aliases:['The filing cabinet paradox', 'filing cabinet paradox', 'filingcabinet paradox', 'filingcabinetparadox']
            },
            'fc': {
                type: 'text',
                counter: 0,
                responses: [
                    'A place that you\’re stuck in and I\’m not!',
                    'A place that you\’re stuck in and I\’m not!',
                    'A place that you\’re stuck in and I\’m not!',,
                    'A place that you\’re stuck in and I\’m not!',
                    'A place that you\’re stuck in and I\’m not!'
                ],
                aliases:['the filing cabinet', 'filingcabinet', 'filing cabinet', 'what is the filing cabinet', 'what is the filingcabinet']
            },
            'Charlie': {
                type: 'image',
                imageUrls: ['https://images.squarespace-cdn.com/content/v1/64c538a9e8536a0da1521fd9/4c1db375-5f7b-4a06-b852-eeb689d6121f/CharlieQZone.png'],
                counter:0
            },
            'Spiff': {
                type: 'image',
                imageUrls: ['https://images.squarespace-cdn.com/content/v1/64c538a9e8536a0da1521fd9/daff5aa9-4ebf-4adc-87d3-65541b9de4ac/SPIFFCipherPage.png'],
                counter: 0,
                aliases:['Spaceman Spiff']
            },
            'Uptick': {
                type: 'image',
                imageUrls: ['https://images.squarespace-cdn.com/content/v1/64c538a9e8536a0da1521fd9/7cb718f1-3b56-4e81-8525-400ea29d29ad/DoodleUptick.png'],
                counter: 0,
                aliases:['Planet Uptick']
            },
            'RS': {
                type: 'image',
                imageUrls: ['https://images.squarespace-cdn.com/content/v1/64c538a9e8536a0da1521fd9/e4c6926e-9ed1-4520-9f21-503e079bb8fe/RSPoster.png'],
                counter: 0,
                aliases:['Relocation Services', 'Relo Services', 'Relo Srvcs', 'Reloc Services', 'ReloServices']
            },
           'Whistlestop': {
                type: 'image',
                imageUrls: ['https://images.squarespace-cdn.com/content/v1/64c538a9e8536a0da1521fd9/65fc5e31-1a34-43b1-9407-7645ee9f0bd0/DoodleWhistleSop.png'],
                counter: 0,
                aliases:['Planet Whistlestop']
            },
           'Snip': {
                type: 'image',
                imageUrls: ['https://images.squarespace-cdn.com/content/v1/64c538a9e8536a0da1521fd9/2d315dd3-b9ba-4804-8362-4c7986e645fa/SnipSnap.png'],
                counter: 0,
                aliases:['Snap', 'SnipSnap']
            },
            'NuStar': {
                type: 'image',
                imageUrls: ['https://images.squarespace-cdn.com/content/v1/64c538a9e8536a0da1521fd9/10f895c2-194a-4226-a203-8736a9ee27c3/NuStarPin.png?format=500w'],
                counter: 0,
                aliases:['Nu Star', 'Nu Star Market', 'NuStar Market']
            },
            'Buddy': {
                type: 'image',
                imageUrls: [
                    'https://images.squarespace-cdn.com/content/v1/64c538a9e8536a0da1521fd9/ecac3dd6-375b-4536-8be7-a4ceeed5174d/Bucket.png',
                    'https://images.squarespace-cdn.com/content/v1/64c538a9e8536a0da1521fd9/a2b59ff3-c678-427e-b120-c316c2694910/Helmet.png?format=500w',
                    'https://images.squarespace-cdn.com/content/v1/64c538a9e8536a0da1521fd9/5be328fa-384a-48f3-93b1-26e469ce6bbc/BUDDYCipherPage.png?format=500w'
                ],
                counter: 0
            },
            'Wolfgang': {
                type: 'multiType',
                records: [
                    { contentType: 'text', content: 'Wolfgang is a mysterious character.' },
                    { contentType: 'image', content: 'https://images.squarespace-cdn.com/content/v1/64c538a9e8536a0da1521fd9/f0b45f80-d451-44d5-98d2-12a2ac56b767/Plushie.png?format=500w' },
                    { contentType: 'audio', content: 'https://static1.squarespace.com/static/64c538a9e8536a0da1521fd9/t/64fe0e82171d037244694ab5/1694371459862/wolfLaugh.mp3/original/wolfLaugh.mp3' }
                    // ... add more records as needed
                ],
                counter: 0
            }
        };
    }

    
    resolveAlias(name) {
        const lowerName = name.toLowerCase();
        for (let character in this.db) {
            if (this.db[character].aliases && this.db[character].aliases.map(alias => alias.toLowerCase()).includes(lowerName)) {
                return character;
            }
        }
        return name;  // If no alias matches, return the original name
    }


    query(name) {
        const cleanedName = removePunctuation(name);
        const resolvedName = this.resolveAlias(name);
        const matchingKey = Object.keys(this.db).find(key => key.toLowerCase() === resolvedName.toLowerCase());
    
        if (matchingKey && this.db[matchingKey]) {
            if (this.db[matchingKey].type === 'text') {
                const response = this.db[matchingKey].responses[this.db[matchingKey].counter];
                this.db[matchingKey].counter = (this.db[matchingKey].counter + 1) % 5; // Cycle through the responses
                return response;
            } else if (this.db[matchingKey].type === 'image') {
                const imageUrl = this.db[matchingKey].imageUrls[this.db[matchingKey].counter];
                window.open(imageUrl, '_blank', 'width=500, height=500');
                this.db[matchingKey].counter = (this.db[matchingKey].counter + 1) % this.db[matchingKey].imageUrls.length; // Cycle through the images
                return `Displaying image for ${matchingKey}...`;
            }
            else if (this.db[matchingKey].type === 'multiType') {
                const record = this.db[matchingKey].records[this.db[matchingKey].counter];
                this.db[matchingKey].counter = (this.db[matchingKey].counter + 1) % this.db[matchingKey].records.length; // Cycle through the records
            
                switch (record.contentType) {
                    case 'text':
                        return record.content;
                    case 'image':
                        window.open(record.content, '_blank', 'width=500, height=500');
                        return `Displaying image for ${matchingKey}...`;
                    case 'audio':
                        const audio = new Audio(record.content);
                        audio.play();
                        return `Playing audio for ${matchingKey}...`;
                    default:
                        return `Unknown content type for ${matchingKey}.`;
                }
            }
        } else {
            return `0 results found`;
        }
    }
}

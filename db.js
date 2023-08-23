class Database {
    constructor() {
        this.db = {
            'Buddy': {
                type: 'text',
                counter: 0,
                responses: [
                    'Buddy is Spiff\'s loyal sidekick.',
                    'Buddy often gets into trouble.',
                    'Buddy loves space snacks.',
                    'Buddy once got lost in a space maze.',
                    'Buddy is always there when Spiff needs him.'
                ]
            },
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
                imageUrl: 'https://images.squarespace-cdn.com/content/v1/64c538a9e8536a0da1521fd9/4c1db375-5f7b-4a06-b852-eeb689d6121f/CharlieQZone.png'
            }
            'Spiff': {
                type: 'image',
                imageUrl: 'https://images.squarespace-cdn.com/content/v1/64c538a9e8536a0da1521fd9/daff5aa9-4ebf-4adc-87d3-65541b9de4ac/SPIFFCipherPage.png'
                aliases:['Spaceman Spiff', 'Spif']
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
                window.open(this.db[matchingKey].imageUrl, '_blank');
                return `Displaying image for ${matchingKey}...`;
            }
        } else {
            return `0 results found`;
        }
    }
}

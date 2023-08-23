class Database {
    constructor() {
        this.db = {
            'Spiff': {
                type: 'text',
                counter: 0,
                responses: [
                    'Spiff is a brave space explorer.',
                    'Spiff often daydreams about alien worlds.',
                    'Spiff\'s favorite spaceship is the Red Comet.',
                    'Spiff once battled the aliens of Zog.',
                    'Spiff is known for his wild imagination.'
                ],
                aliases:['Spaceman Spiff']                
            },
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
            'filing cabinet': {
                type: 'text',
                counter: 0,
                responses: [
                    'A place that you\’re stuck in and I\’m not!',
                    'A place that you\’re stuck in and I\’m not!',
                    'A place that you\’re stuck in and I\’m not!',,
                    'A place that you\’re stuck in and I\’m not!',
                    'A place that you\’re stuck in and I\’m not!'
                ],
                aliases:['The filing cabinet', 'filingcabinet', 'what is the filing cabinet', 'what is the filingcabinet']
            },
            'Karen': {
                type: 'image',
                imageUrl: 'https://i.kinja-img.com/gawker-media/image/upload/ujjl8koj5cbt7sqv9gki.jpg'  // Replace with the actual path to Karen's image
            }
            // ... [Add more characters as needed]
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

function removePunctuation(input) {
    return input.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?]/g, "");
}

function generateSituationReport() {
    const locations = ['City Center', 'West District', 'East Park', 'North Plaza', 'South Market'];
    const events = ['a power outage', 'a traffic jam', 'a peaceful protest', 'a water main break', 'a parade'];
    const statuses = ['ongoing', 'resolved', 'escalating', 'under control', 'monitored'];

    const randomLocation = locations[Math.floor(Math.random() * locations.length)];
    const randomEvent = events[Math.floor(Math.random() * events.length)];
    const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];

    return `Situation Report:\nLocation: ${randomLocation}\nEvent: ${randomEvent}\nStatus: ${randomStatus}`;
}

        const fs = new FileSystem();
        const rover = new Rover();
        const db = new Database();

        const images = {
            // ... [Images dictionary as provided above]
        };

        const audioClips = {
            // ... [Audio clips dictionary as provided above]
        };

        $(document).ready(function() {
            $('#terminal').terminal(function(command, term) {
                const [cmd, subcommand, ...args] = command.split(' ');
                switch (cmd) {
                    case 'rover':
                        if (subcommand === 'north' || subcommand === 'south' || subcommand === 'east' || subcommand === 'west') {
                            term.echo(rover.move(subcommand));
                        } else if (subcommand === 'selfie') {
                            term.echo(rover.takeSelfie());
                        } else if (subcommand === 'collect') {
                            term.echo(rover.collectItem());
                        } else if (subcommand === 'storage') {
                            term.echo(rover.showStorage());
                        } else if (subcommand === 'weather') {
                            term.echo(rover.checkWeather());
                        } else if (subcommand === 'message') {
                            const message = args.join(' ');
                            rover.sendMessageToEarth(message);
                            term.echo(`Message sent. Awaiting response...`);
                        }
                    case 'ls':
                        return fs.ls();
                    case 'cd':
                        return fs.cd(subcommand) || '';
                    case 'pwd':
                        return fs.pwd();
                    case 'read':
                        return fs.read(subcommand);
                    case 'showimage':
                        const imageName = subcommand;
                        const imageUrl = images[imageName];
                        if (imageUrl) {
                            window.open(imageUrl, '_blank');
                            return `Opening ${imageName}...`;
                        } else {
                            return `Unknown image: ${imageName}`;
                        }
                    case 'playaudio':
                        const clipName = subcommand;
                        const clipUrl = audioClips[clipName];
                        if (clipUrl) {
                            const audio = new Audio(clipUrl);
                            audio.play();
                            return `Playing ${clipName}...`;
                        } else {
                            return `Unknown audio clip: ${clipName}`;
                        }
                    case 'sreport':
                        return generateSituationReport();
                    case 'help':
                        return `
                            Available commands:
                            - ls: List files and directories in the current directory
                            - cd [directory]: Change to the specified directory
                            - pwd: Print the current directory path
                            - read [filename]: Display the contents of a file
                            - showimage [imageName]: Display an image in a new window
                            - playaudio [clipName]: Play an audio clip
                            - sreport: Generate a situation report
                            - rover [north|south|east|west]: Move the rover in the specified direction
                            - help: Display this help message
                        `;
                    case 'query':
                        return db.query(subcommand);
                    default:
                        return `Unknown command: ${command}`;
                }
            }, {
                greetings: 'Welcome to the combined rover exploration and mock file system!',
                name: 'rover_terminal',
                height: 400,
                prompt: `${fs.pwd()}> `
            });
        });



/* commenting out for now

var egg = new Egg();
egg.addCode("up,up", function() {
    $('body').terminal({
    hello: function(what) {
        this.echo('Hello, ' + what +
                  '. Wellcome to this terminal.');
    },
    cat: function() {
        this.echo($('<img src="https://placekitten.com/408/287">'));
    }
  }, {
    greetings: 'Relocation Services Command Line Terminal For Advanced Actions (RSCLTFAA)'
  });
})
  .addHook(function(){
    console.log("Hook called for: " + this.activeEgg.keys);
    console.log(this.activeEgg.metadata);
  }).listen();

$(document).ready(function() {
  $('a:contains("Launch Terminal")').click(function (){
    $('body').terminal({
    hello: function(what) {
        this.echo('Hello, ' + what +
                  '. Wellcome to the button terminal.');
    },
    cat: function() {
        this.echo($('<img src="https://placekitten.com/408/287">'));
    }
  }, {
    greetings: 'Button Terminal'
  });
  });
});
*/

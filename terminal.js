class FileSystem {
    constructor() {
        this.currentDir = '/';
        this.fs = {
            '/': {
                type: 'dir',
                children: ['file1.txt', 'dir1'],
                parent: null
            },
            '/file1.txt': {
                type: 'file',
                content: btoa('This is the content of file1.txt'),
                parent: '/'
            },
            '/dir1': {
                type: 'dir',
                children: ['file2.txt'],
                parent: '/'
            },
            '/dir1/file2.txt': {
                type: 'file',
                content: btoa('This is the content of file2.txt inside dir1'),
                parent: '/dir1'
            },
            // ... [Add more files and directories as needed]
        };
    }

    ls() {
        const path = this.currentDir;
        if (this.fs[path] && this.fs[path].type === 'dir') {
            return this.fs[path].children.join('  ');
        } else {
            return `Error: Not a directory.`;
        }
    }

    cd(dir) {
        if (dir === '..') {
            if (this.fs[this.currentDir].parent !== null) {
                this.currentDir = this.fs[this.currentDir].parent;
            }
        } else {
            const newPath = this.currentDir === '/' ? `/${dir}` : `${this.currentDir}/${dir}`;
            if (this.fs[newPath] && this.fs[newPath].type === 'dir') {
                this.currentDir = newPath;
            } else {
                return `Error: ${dir} not found or is not a directory.`;
            }
        }
    }

    pwd() {
        return this.currentDir;
    }

    read(filename) {
        const path = this.currentDir === '/' ? `/${filename}` : `${this.currentDir}/${filename}`;
        if (this.fs[path] && this.fs[path].type === 'file') {
            return atob(this.fs[path].content);
        } else {
            return `Error: ${filename} not found or is not a file.`;
        }
    }
}


class Rover {
    constructor() {
        this.x = 0;
        this.y = 0;
        this.world = [
            ['You are in a vast desert plain.', 'You see a distant oasis.', 'You are amidst sand dunes.', 'You find a small crater.', 'You are on the edge of a large canyon.'],
            ['You are near a rocky outcrop.', 'You are in a sandy valley.', 'You see a range of low hills.', 'You are near a large boulder.', 'You find a patch of rare Martian flowers.'],
            // ... [Add more descriptions for each grid location]
        ];
        this.weather = [
            ['Sunny with a chance of meteor showers', 'Mild sandstorms', 'Clear skies', 'Windy with flying sand', 'Night: Clear with visible stars'],
            ['Cloudy with a hint of acid rain', 'Dusty haze', 'Strong winds from the east', 'Calm with occasional dust devils', 'Night: Meteor showers'],
            // ... [Add more weather conditions for each grid location]
        ];
        this.storage = []; // Storage for items rover collects
        this.selfies = [
            ['selfie_0_0.jpg', 'selfie_0_1.jpg', 'selfie_0_2.jpg', 'selfie_0_3.jpg', 'selfie_0_4.jpg'],
            ['selfie_1_0.jpg', 'selfie_1_1.jpg', 'selfie_1_2.jpg', 'selfie_1_3.jpg', 'selfie_1_4.jpg'],
            // ... [Add more selfie URLs for each grid location]
        ];
    }

    move(direction) {
        switch (direction) {
            case 'north':
                if (this.y > 0) this.y--;
                break;
            case 'south':
                if (this.y < this.world.length - 1) this.y++;
                break;
            case 'east':
                if (this.x < this.world[this.y].length - 1) this.x++;
                break;
            case 'west':
                if (this.x > 0) this.x--;
                break;
        }
        return this.world[this.y][this.x];
    }

    takeSelfie() {
        const selfieUrl = this.selfies[this.y][this.x];
        window.open(selfieUrl, '_blank');
        return `Displaying selfie from current location...`;
    }

    collectItem() {
        const items = [
            ['desert rock', 'oasis water sample', 'cactus', 'sand sample', 'tumbleweed'],
            ['rocky formation sample', 'cave stone', 'water trace', 'desert flower', 'shrub leaf'],
            // ... [Add more items for each grid location]
        ];
        const item = items[this.y][this.x];
        this.storage.push(item);
        return `Collected: ${item}`;
    }

    showStorage() {
        if (this.storage.length === 0) {
            return "Rover's storage is empty.";
        }
        return `Rover's storage contains: ${this.storage.join(', ')}`;
    }

    checkWeather() {
        return this.weather[this.y][this.x];
    }

    sendMessageToEarth(message) {
        console.log(`Sending message to Earth: "${message}"...`);
        setTimeout(() => {
            const responses = [
                "Received your message, Rover. Stay safe out there!",
                "Rover, continue your exploration and keep sending updates.",
                "Message received, Rover. Sending you updated instructions shortly.",
                "Stay on course, Rover. Earth out.",
                "We're proud of you, Rover. Keep going!"
            ];
            const randomIndex = Math.floor(Math.random() * responses.length);
            console.log(responses[randomIndex]);
        }, 3000); // Simulating a 3-second delay for the response
    }
}

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
                    'I don\t know, I can\t see you!',
                    'I don\t know, I can\t see you!',
                    'I don\t know, I can\t see you!',
                    'I don\t know, I can\t see you!',
                    'A silly little hypercube!'
                ],
                aliases:['I']
            },
            'Ed': {
                type: 'text',
                counter: 0,
                responses: [
                    'Ed is the wise elder of the group.',
                    'Ed often provides guidance to Spiff and Buddy.',
                    'Ed has a vast knowledge of the universe.',
                    'Ed has been on many space adventures.',
                    'Ed is known for his calm demeanor.'
                ]
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
        return `Error: Character ${name} not found in the database.`;
    }
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

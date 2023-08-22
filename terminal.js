class FileSystem {
    constructor() {
        this.root = {
            name: '/',
            type: 'directory',
            children: {
                home: {
                    name: 'home',
                    type: 'directory',
                    parent: '/',
                    children: {
                        user: {
                            name: 'user',
                            type: 'directory',
                            parent: '/home'
                            children: {
                                'file1.txt': {
                                    name: 'file1.txt',
                                    type: 'file'
                                },
                                'file2.txt': {
                                    name: 'file2.txt',
                                    type: 'file'
                                }
                            }
                        }
                    }
                }
            }
        };
        this.currentDirectory = this.root;
    }

    pwd() {
        let path = [];
        let current = this.currentDirectory;
        while (current !== this.root) {
            path.unshift(current.name);
            current = current.parent;
        }
        return '/' + path.join('/');
    }

    ls() {
        return Object.keys(this.currentDirectory.children).join(' ');
    }

    cd(directory) {
        if (directory === '..') {
            if (this.currentDirectory.parent) {
                this.currentDirectory = this.currentDirectory.parent;
            }
            return;
        }

        const target = this.currentDirectory.children[directory];
        if (!target) {
            return `No such directory: ${directory}`;
        }
        if (target.type !== 'directory') {
            return `${directory} is not a directory`;
        }
        this.currentDirectory = target;
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

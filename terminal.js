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
                        const queryPhrase = [subcommand, ...args].join(' ');
                        return db.query(queryPhrase);
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

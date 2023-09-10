function removePunctuation(input) {
    return input.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?]/g, "");
}

        const fs = new FileSystem();
        const rover = new Rover();
        const db = new Database();

        $(document).ready(function() {
            $('#terminal').terminal(function(command, term) {
                const [cmd, subcommand, ...args] = command.split(' ');
                switch (cmd) {
                    case 'rover':
                        if (subcommand === 'north' || subcommand === 'south' || subcommand === 'east' || subcommand === 'west') {
                            return (rover.move(subcommand));
                        } else if (subcommand === 'collect') {
                            return (rover.collectItem());
                        } else if (subcommand === 'storage') {
                            return (rover.showStorage());
                        } else if (subcommand === 'unload') {
                            return (rover.unload());
                        }
                    case 'ls':
                        return fs.ls();
                    case 'cd':
                        return fs.cd(subcommand) || '';
                    case 'pwd':
                        return fs.pwd();
                    case 'read':
                        return fs.read(subcommand);
                    case 'help':
                        return `
                            Available commands:
                            - ls: List files and directories in the current directory
                            - cd [directory]: Change to the specified directory
                            - pwd: Print the current directory path
                            - read [filename]: Display the contents of a file
                            - rover [north|south|east|west]: Move the rover in the specified direction
                            - **** ROVER EXTENSION PACKAGE INSTALLED ****
                            - help: Display this help message
                            - query [subject]
                        `;
                    case 'query':
                        const queryPhrase = [subcommand, ...args].join(' ');
                        return db.query(queryPhrase);
                    default:
                        return `Unknown command: ${command}`;
                }
            }, {
                greetings: 'Research Station Terminal (Type \'help\' for help)',
                name: 'rover_terminal',
                height: 400,
                prompt: `${fs.pwd()}> `
            });
        });

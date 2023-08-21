class FileSystem {
    constructor() {
        this.root = {
            name: '/',
            type: 'directory',
            children: {
                home: {
                    name: 'home',
                    type: 'directory',
                    children: {
                        user: {
                            name: 'user',
                            type: 'directory',
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


        const fs = new FileSystem();

        const consoleApp = new Console({
            container: document.body,
            welcomeMessage: 'Welcome to the mock file system!',
            promptLabel: () => `${fs.pwd()}> `,
            commandHandle: function(line) {
                const [command, ...args] = line.split(' ');
                switch (command) {
                    case 'ls':
                        return fs.ls();
                    case 'cd':
                        return fs.cd(args[0]) || '';
                    case 'pwd':
                        return fs.pwd();
                    default:
                        return `Unknown command: ${command}`;
                }
            }
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

class FileSystem {
    constructor() {
        this.currentDir = '/';
        this.fs = {
            '/': {
                type: 'dir',
                children: ['notes.txt', 'rover', 'research'],
                parent: null
            },
            '/notes.txt': {
                type: 'file',
                content: btoa(`
  We need a few more resources to enable deeper analysis.  There's so much undiscovered on planet whistlestop,
  but as we find things we're addig them to the database.  Like the SnipSnap.
                              `),
                parent: '/'
            },
            '/rover': {
                type: 'dir',
                children: ['manual.txt', 'log.txt'],
                parent: '/'
            },
            '/rover/manual.txt': {
                type: 'file',
                content: btoa(`
                The TB-37B-X94 is the finest choice for quality, affordable planetary exploration, survey, and collection.  
                With proper maintenance, you should expect years of successful scientific research and discovery.  

                Some Helpful notes to get started:
                > To see the list of available rover commands, just type 'rover help'
                > To begin a new exploration session, select a rover with the 'rover select (n)' command
                > As you explore the environment, collect samples for processing and unload at your local processing facility
    
                Continue to document the local environment.  But above all, fun!
                              `),
                parent: '/rover'
            },
            '/rover/log.txt': {
                type: 'file',
                content: btoa(`
                Rover #1: -- Completing self-test - Status Normal
                Rover #2: -- Exploring Southern Revine - Status Normal
                Rover #3: -- Continuing Cave Exploration - Status Normal
                Rover #4: -- Gathering air sample - Status Normal
                Rover #5: -- Deploying Solar cells - Status Normal
                Rover #6: -- Awaiting Instructions - Status Normal 
                Rover #7: -- Continuing extraction of flora - Status Normal
                Rover #8: -- Begining Wind measurement - Status Normal
                Rover #9: -- Returning to Home Base with Cargo - Status Normal
                Rover #1: *** CATASTROPHIC ERROR *** ROVER OFFLINE
                Rover #2: *** CATASTROPHIC ERROR *** ROVER OFFLINE
                Rover #3: -- Observing interesting Worm - Status Normal
                Rover #4: *** CATASTROPHIC ERROR *** ROVER OFFLINE
                Rover #5: *** CATASTROPHIC ERROR *** ROVER OFFLINE
                Rover #6: *** CATASTROPHIC ERROR *** ROVER OFFLINE 
                Rover #7: *** CATASTROPHIC ERROR *** ROVER OFFLINE
                Rover #8: *** CATASTROPHIC ERROR *** ROVER OFFLINE
                Rover #9: *** CATASTROPHIC ERROR *** ROVER OFFLINE               
                              `),
                parent: '/rover'
            },
            '/research': {
                type: 'dir',
                children: ['notes.txt', 'todo.txt'],
                parent: '/'
            },
            '/research/notes.txt': {
                type: 'file',
                content: btoa(`
                Image of SnipSnap added to database.
                use command 'query snipsnap' to view
                There are some other intesting things in the DB!
                              `),
                parent: '/research'
            },
            '/research/todo.txt': {
                type: 'file',
                content: btoa(`
                Further analysis capabilities require the following Additional Resources:
                > Pink Sand (RECOVERED)
                > Boulder Fragement
                > Vulcanic Ash (RECOVERED)
                > Mud Sample
                > Canyon Rock
                > Rare Air Sample (RECOVERED)
                              `),
                parent: '/research'
            },
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

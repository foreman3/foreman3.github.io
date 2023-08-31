class FileSystem {
    constructor() {
        this.currentDir = '/';
        this.fs = {
            '/': {
                type: 'dir',
                children: ['notes.txt', 'rover'],
                parent: null
            },
            '/notes.txt': {
                type: 'file',
                content: btoa(`
                Image of SnipSnap added to database.
                Continue to document local environment.
                              `),
                parent: '/'
            },
            '/rover': {
                type: 'dir',
                children: ['manual.txt', 'logs'],
                parent: '/'
            },
            '/rover/manual.txt': {
                type: 'file',
                content: btoa(`
                The TB-37B-X94 is the finest choice for quality, affordable platentary exploration, survey, and collection.  
                With proper mantenace, you shoud expect years of successful scientific research and discovery.  But above all, fun!
    
                Continue to document local environment.
                              `),
                parent: '/rover'
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

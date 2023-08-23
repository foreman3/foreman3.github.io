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

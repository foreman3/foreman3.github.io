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

    }

    move(direction) {
        switch (direction) {
            case 'north':
            case 'n':
                if (this.y > 0) this.y--;
                break;
            case 'south':
            case 's':
                if (this.y < this.world.length - 1) this.y++;
                break;
            case 'east':
            case 'e':
                if (this.x < this.world[this.y].length - 1) this.x++;
                break;
            case 'west':
            case 'w':
                if (this.x > 0) this.x--;
                break;
        }
        return this.world[this.y][this.x];
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

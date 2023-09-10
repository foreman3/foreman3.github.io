class Rover {
    constructor() {
        this.x = 6;
        this.y = 3;
        this.world = [
            ['You are in a vast desert plain.', 'You see a distant oasis.', 'You are amidst sand dunes.', 'You find a small crater.', 'You are on the edge of a large canyon.', 'You are near a frozen lake.', 'You are near a dried-up riverbed.'],
            ['You are near a rocky outcrop.', 'You are in a sandy valley.', 'You see a range of low hills.', 'You are near a large boulder.', 'You find a patch of rare flowers.', 'You are at the base of a tall mountain.', 'You see a series of small geysers.'],
            ['You are in a flat, open area.', 'You see strange rock formations.', 'You are in a region with many small craters.', 'You find a patch of colorful sand.', 'You are near a deep chasm.', 'You spot a distant waterfall.', 'You are in a foggy region.'],
            ['You are in a dense forest.', 'You are near a bubbling mud pit.', 'You are in a region with red sand.', 'Home Base', 'You are in a region with blue sand.', 'You have entered a huge cave.', 'You are in a windy area with flying sand.'],
            ['You are in a region with tall cliffs.', 'You are near a volcanic area.', 'You see a large, still lake.', 'You are in a dense foggy region.', 'You are in a region with green sand.', 'You are near a series of caves.', 'You are in a region with many boulders.'],
            ['You are in a flat region with a distant horizon.', 'You are near a series of sand dunes.', 'You are in a region with many small rocks.', 'You are near a large, still pond.', 'You are in a region with yellow sand.', 'You are near a tall peak.', 'You are in a region with a distant storm.'],
            ['You are in a region with a rocky terrain.', 'You are near a series of small ponds.', 'You are in a region with a lot of vegetation.', 'You are near a series of small canyons.', 'You are in a region with purple sand.', 'You are near a large waterfall.', 'You are in a region with a rainbow.']
        ];
        this.weather = [
            ['Sunny with a chance of meteor showers', 'Mild sandstorms', 'Clear skies', 'Windy with flying sand', 'Night: Clear with visible stars'],
            ['Cloudy with a hint of acid rain', 'Dusty haze', 'Strong winds from the east', 'Calm with occasional dust devils', 'Night: Meteor showers'],
            // ... [Add more weather conditions for each grid location]
        ];
        this.storage = []; // Storage for items rover collects
        this.neededItems = ['boulder fragment', 'mud sample', 'canyon rock'];
        this.unknownItemFound = false;
        this.enabled = false;
    }

    select(number) {
        let value = parseInt(number);
        if (typeof value === 'number' && value >= 1 && value <= 9 && Math.floor(value) === value) {
            if (value == 3) {
                this.enabled = true;
                return 'Rover #3 Selected, ready to rove';
            }
            else {
                this.enabled = false;
                return 'Rover #' + value + ' Offline, select another rover';
            }
        }
        else return 'Select a rover number 1-9';
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
            ['desert rock', 'oasis water sample', 'cactus', 'sand sample', 'tumbleweed', 'frozen water sample', 'riverbed stone'],
            ['rocky formation sample', 'valley soil', 'hill stone', 'boulder fragment', 'Strange flower', 'mountain mineral', 'geyser water sample'],
            ['flat area soil', 'strange rock', 'crater soil', 'colorful sand sample', 'chasm rock', 'waterfall sample', 'foggy region air sample'],
            ['purple wood', 'mud sample', 'red sand sample', 'Home Base Item', 'blue sand sample', 'interesting worm', 'flying sand sample'],
            ['cliff rock', 'volcanic ash', 'lake water sample', 'fog sample', 'green sand sample', 'cave moss', 'boulder fragment'],
            ['horizon soil', 'dune sand sample', 'small rock', 'pond water sample', 'yellow sand sample', 'peak stone', 'storm air sample'],
            ['rocky soil', 'pond water sample', 'Martian vegetation', 'canyon rock', 'purple sand sample', 'waterfall stone', 'unknown item']
        ];
        if (this.world[this.y][this.x] !== 'Home Base'){
            const item = items[this.y][this.x];
            this.storage.push(item);
            return `Collected: ${item}`;
        }
        return 'Cannot Collect at Home Base, consider unloading';
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

     unload() {
        if (this.world[this.y][this.x] !== 'Home Base') {
            return "Error: Can only unload at Home Base.";
        }

        let importantItemsFound = 0;
        let messages = [];

        for (let item of this.storage) {
            messages.push(`unloading ${item} -> analyzing`);

            if (item === 'unknown item') {
                this.unknownItemFound = true;
                if (this.neededItems.length > 0) {
                   messages.push('*** Further analysis possible, requires remaining Needed Items ***');
                }
            }
            
            if (this.neededItems.includes(item)) {
                importantItemsFound++;
                const index = this.neededItems.indexOf(item);
                this.neededItems.splice(index, 1);  // Remove the item from the needed items list
                messages.push(`*** ${item} discovered ***`);
            }
            
        }

        this.storage = [];  // Empty the rover's storage

        if (importantItemsFound > 0) {
            messages.push(`${this.neededItems.length} Needed Items remain.`);
        }

        if (this.neededItems.length === 0 && this.unknownItemFound) {
            messages.push(`*** Unknown Item Analysis continued:  Communicator.   Rendering Image ***`);
            let image = 'https://images.squarespace-cdn.com/content/v1/64c538a9e8536a0da1521fd9/fda61eb1-8213-437b-97b3-bb139cb99687/Com.png?format=500w';
            window.open(image, '_blank', 'width=500, height=500');
            messages.push(`*** Deep Analysis Beginning ->->-> Return Later ***`);
        }
    
        return messages.join('\n');
    }

        help(){
            return `
                                Basic Rover Control:
                                - rover [north|south|east|west] : Move the rover in the specified direction
                                - rover help : Display this help message
                                
                                Rover Science Package Commands ****
                                - rover collect : Gather an item from the current rover location
                                - rover storeage : Display the content of the rover storeage
                                - rover unload : Unload rover (only usable at an approved Science Processing Facility)
                            `;
            
        }
}

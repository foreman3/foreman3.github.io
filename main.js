import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// Sample data
const data = [
    // Group 1: Animals
    { id: 1, label: 'Horse', embedding: [1,2,73,4,5,6,7,8,9,10,11,12,13,14,15,16] },
    { id: 2, label: 'Donkey', embedding: [2,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16] },
    { id: 3, label: 'Bear', embedding: [1,3,3,4,5,6,7,8,9,10,57,12,13,18,15,16] },
    { id: 4, label: 'Lion', embedding: [1,2,4,4,5,6,7,8,9,10,11,12,24,14,15,16] },
    { id: 5, label: 'Tiger', embedding: [1,2,9,5,5,6,7,8,9,10,11,12,13,14,15,16] },
    { id: 6, label: 'Elephant', embedding: [1,2,3,4,6,6,7,8,9,10,11,12,13,14,3,16] },
    { id: 7, label: 'Giraffe', embedding: [1,2,3,4,5,7,7,8,9,10,11,12,13,14,15,16] },
    { id: 8, label: 'Kangaroo', embedding: [1,2,3,4,5,6,8,8,9,10,11,12,13,14,15,16] },
    { id: 9, label: 'Penguin', embedding: [1,2,3,4,5,6,7,9,9,10,11,12,13,14,15,16] },
    { id: 10, label: 'Zebra', embedding: [1,2,3,4,5,6,7,8,10,10,11,12,13,14,15,16] },

    // Group 2: Fruits
    { id: 11, label: 'Apple', embedding: [20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35] },
    { id: 12, label: 'Banana', embedding: [20,22,22,23,24,25,26,27,28,29,30,31,32,33,34,35] },
    { id: 13, label: 'Cherry', embedding: [20,21,23,23,24,25,26,27,28,29,30,31,32,33,34,35] },
    { id: 14, label: 'Date', embedding: [20,21,22,24,24,25,26,27,28,29,30,31,32,33,34,35] },
    { id: 15, label: 'Elderberry', embedding: [20,21,22,23,25,25,26,27,28,29,30,31,32,33,34,35] },
    { id: 16, label: 'Fig', embedding: [20,21,22,23,24,26,26,27,28,29,30,31,32,33,34,35] },
    { id: 17, label: 'Grape', embedding: [20,21,22,23,24,25,27,27,28,29,30,31,32,33,34,35] },
    { id: 18, label: 'Honeydew', embedding: [20,21,22,23,24,25,26,28,28,29,30,31,32,33,34,35] },
    { id: 19, label: 'Kiwi', embedding: [20,21,22,23,24,25,26,27,29,29,30,31,32,33,34,35] },
    { id: 20, label: 'Lemon', embedding: [20,21,22,23,24,25,26,27,28,30,30,31,32,33,34,35] },
    // ... add more fruit data points

    // Group 3: Vehicles
    { id: 21, label: 'Car', embedding: [40,41,42,43,44,45,46,47,48,49,50,51,52,53,54,55] },
    { id: 22, label: 'Bike', embedding: [40,42,42,43,44,45,46,47,48,49,50,51,52,53,54,55] },
    { id: 23, label: 'Bus', embedding: [40,41,43,43,44,45,46,47,48,49,50,51,52,53,54,55] },
    // ... add more vehicle data points

    // Group 4: Colors
    { id: 31, label: 'Red', embedding: [60,61,62,63,64,65,66,67,68,69,70,71,72,73,74,75] },
    { id: 32, label: 'Blue', embedding: [60,62,62,63,64,65,66,67,68,69,70,71,72,73,74,75] },
    { id: 33, label: 'Green', embedding: [60,61,63,63,64,65,66,67,68,69,70,71,72,73,74,75] },
    // ... add more color data points

    // Group 5: Instruments
    { id: 41, label: 'Guitar', embedding: [80,81,82,83,84,85,86,87,88,89,90,91,92,93,94,95] },
    { id: 42, label: 'Piano', embedding: [80,82,82,83,84,85,86,87,88,89,90,91,92,93,94,95] },
    { id: 43, label: 'Drum', embedding: [80,81,83,83,84,85,86,87,88,89,90,91,92,93,94,95] }
    // ... add more instrument data points
];

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer();
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let lastSelectedEmbedding = null; // Store the embedding of the last selected sphere

document.getElementById('visualization').addEventListener('click', onClick, false);

const width = (window.innerWidth * 0.65) - 20; // 45% of the viewport width minus some padding
const height = window.innerHeight - 40; // viewport height minus some padding


function onClick(event) {

    const canvasBounds = renderer.domElement.getBoundingClientRect();

    // Adjust the mouse position
    mouse.x = ((event.clientX - canvasBounds.left) / canvasBounds.width) * 2 - 1;
    mouse.y = -((event.clientY - canvasBounds.top) / canvasBounds.height) * 2 + 1;

    // Update the picking ray with the camera and mouse position
    raycaster.setFromCamera(mouse, camera);

    // Calculate objects intersecting the picking ray
    const intersects = raycaster.intersectObjects(scene.children);

    if (intersects.length > 0) {
        const intersectedObject = intersects[0].object;
        const id = intersectedObject.userData.id;
        selectItem(id);
    }
    event.stopPropagation();
}

function euclideanDistance(pointA, pointB) {
    if (pointA.length !== pointB.length) {
        throw new Error("Points must have the same dimensionality");
    }
    return Math.sqrt(pointA.reduce((sum, value, index) => sum + Math.pow(value - pointB[index], 2), 0));
}


function argsort(array) {
    const arrayObject = array.map((value, idx) => { return { value, idx }; });
    arrayObject.sort((a, b) => {
        if (a.value < b.value) return 1;
        if (a.value > b.value) return -1;
        return 0;
    });
    return arrayObject.map(obj => obj.idx);
}

function pca(dataWithEmbeddings) {
    // Extract only the embeddings from the data
    const embeddings = dataWithEmbeddings.map(d => d.embedding);

    // Calculate the mean of each dimension
    const mean = math.mean(embeddings, 0);

    // Center the data
    const centeredData = embeddings.map(d => math.subtract(d, mean));

    // Calculate the covariance matrix
    const covarianceMatrix = math.multiply(math.transpose(centeredData), centeredData);

    // Calculate eigenvectors and eigenvalues
    const { values, vectors } = math.eigs(covarianceMatrix);

    // Sort by eigenvalues in descending order
    const sortedIndices = argsort(values);
    const topVectors = sortedIndices.slice(0, 3).map(i => vectors[i]);

    // Project the data onto the top 3 eigenvectors and retain the original ID
    return dataWithEmbeddings.map((dataPoint, index) => {
        const coordinates = math.multiply(centeredData[index], math.transpose(topVectors));
        return {
            id: dataPoint.id,
            coordinates: coordinates
        };
    });
}

    function visualize3D(data) {
        renderer.setSize(width, height);
        document.body.appendChild(renderer.domElement);

        // Add the AxesHelper
        const axesHelper = new THREE.AxesHelper(100);
        axesHelper.material.color.set(0xCCCCCC); // Set to light gray if desired
        scene.add(axesHelper);


        data.forEach(point => {
            const geometry = new THREE.SphereGeometry(1, 32, 32);
            const material = new THREE.MeshBasicMaterial({ color: 0xff0000, transparent: true, opacity: 0.6 });
            const sphere = new THREE.Mesh(geometry, material);
            const scale = 1; // Adjust this value as needed
            sphere.position.set(point.coordinates[0] * scale, point.coordinates[1] * scale, point.coordinates[2] * scale);
            sphere.userData = { id: point.id };  // Store the ID with the sphere
            scene.add(sphere);
        });

        camera.position.z = 5;

        const controls = new OrbitControls(camera, renderer.domElement);
        controls.update();
        document.getElementById('visualization').appendChild(renderer.domElement);
        function animate() {
            requestAnimationFrame(animate);
            controls.update();
            renderer.render(scene, camera);
        }

        animate();
    }

function displayLabel(position, text) {
    // Convert 3D position to 2D screen coordinates
    position.project(camera);
    const x = (position.x * 0.5 + 0.5) * renderer.domElement.clientWidth;
    const y = (-position.y * 0.5 + 0.5) * renderer.domElement.clientHeight;

    // Create a floating div for the label
    const labelDiv = document.createElement('div');
    labelDiv.style.position = 'absolute';
    labelDiv.style.background = 'rgba(255, 255, 255, 0.8)';
    labelDiv.style.padding = '2px 5px';
    labelDiv.style.borderRadius = '3px';
    labelDiv.style.fontFamily = 'Arial, sans-serif';
    labelDiv.style.fontSize = '12px';
    labelDiv.style.pointerEvents = 'none'; // Make sure the div doesn't interfere with scene interactions
    labelDiv.textContent = text;
    labelDiv.style.left = `${x}px`;
    labelDiv.style.top = `${y}px`;
    labelDiv.className = 'floating-label';
    // Append the label to the document body or the container of your visualization
    document.body.appendChild(labelDiv);
}



document.getElementById('labelSearch').addEventListener('input', function() {
    const searchTerm = this.value.toLowerCase();
    const matchingData = data.filter(d => d.label.toLowerCase().includes(searchTerm));

    const tableBody = document.querySelector('#resultsTable tbody');
    tableBody.innerHTML = ''; // Clear previous results

    matchingData.forEach(d => {
        const row = tableBody.insertRow();
        const idCell = row.insertCell(0);
        const labelCell = row.insertCell(1);
        const distanceCell = row.insertCell(2); // New cell for distance

        idCell.textContent = d.id;
        labelCell.innerHTML = `<a href="#" data-id="${d.id}">${d.label}</a>`;

        // If a sphere has been selected, calculate and display the distance
        if (lastSelectedEmbedding) {
            const distance = euclideanDistance(d.embedding, lastSelectedEmbedding);
            distanceCell.textContent = distance.toFixed(2); // Display distance with 2 decimal places
        }
    });
});

    const reducedData = pca(data);  // Note that we're passing the entire 'data' array, not just the embeddings
    visualize3D(reducedData);

const resultsTable = document.querySelector('#resultsTable tbody');
resultsTable.addEventListener('click', function(event) {
    if (event.target.tagName === 'A') {
        event.preventDefault();
        const id = parseInt(event.target.getAttribute('data-id'));
        selectItem(id);
    }
});

function handleLabelClick(id) {
    const clickedData = data.find(d => d.id === id);
    const distances = data.map(d => ({
        id: d.id,
        distance: euclideanDistance(clickedData.embedding, d.embedding)
    }));

    // Sort by distance and get the 5 nearest neighbors
    const nearestNeighbors = distances.sort((a, b) => a.distance - b.distance).slice(1, 6);

    // Update the visualization
    updateVisualization(id, nearestNeighbors.map(n => n.id));
}

function updateVisualization(clickedId, neighborIds) {
    scene.traverse(child => {
        if (child instanceof THREE.Mesh) {
            if (child.userData.id === clickedId) {
                child.material.color.set(0x00ff00); // Green for the clicked item
            } else if (neighborIds.includes(child.userData.id)) {
                child.material.color.set(0x0000ff); // Blue for the neighbors
            } else {
                child.material.color.set(0xff0000); // Default color for others (adjust as needed)
            }
        }
    });

    renderer.render(scene, camera);
}

let lastSelectedId = null; // Declare it at the top of your script or in a relevant scope

function selectItem(id) {
    lastSelectedId = id; // Set the lastSelectedId here
    const clickedData = data.find(d => d.id === id);
    const distances = data.map(d => ({
        id: d.id,
        distance: euclideanDistance(clickedData.embedding, d.embedding)
    }));

    // Sort by distance and get the nearest neighbors based on the dropdown value
    const count = parseInt(document.getElementById('neighborsCount').value);
    const nearestNeighbors = distances.sort((a, b) => a.distance - b.distance).slice(1, count + 1);

    // Update the visualization
    updateVisualization(id, nearestNeighbors.map(n => n.id));

    // Update the right panel
    document.getElementById('selectedId').textContent = clickedData.id;
    document.getElementById('selectedLabel').textContent = clickedData.label;

    const neighborsTbody = document.querySelector('#neighborsTable tbody');
    neighborsTbody.innerHTML = '';
    nearestNeighbors.forEach(neighbor => {
        const row = neighborsTbody.insertRow();
        row.insertCell().textContent = neighbor.id;
        row.insertCell().textContent = data.find(d => d.id === neighbor.id).label;
        row.insertCell().textContent = neighbor.distance.toFixed(2);
    });
}

document.getElementById('neighborsCount').addEventListener('change', function() {
    if (lastSelectedId) {
        selectItem(lastSelectedId);
    }
});

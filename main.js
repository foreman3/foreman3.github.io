import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// Sample data
const data = [
    // Group 1: Animals
    { id: 1, label: 'Horse', embedding: [1.0, 2.0, 73, 4.0, 5.0, 6.0, 7.0, 8.0, 9.0, 10.0, 11.0, 12.0, 13.0, 14.0, 15.0, 16.0] },
    { id: 2, label: 'Donkey', embedding: [1.0, 2.0, 3.0, 4.0, 59.0, 6.0, 7.0, 8.0, 9.0, 10.0, 11.0, 12.0, 13.0, 14.0, 15.0, 16.0] },
    { id: 3, label: 'Bear', embedding: [1.0, 2.0, 3.0, 4.0, 5.0, 6.0, 7.0, 8.0, 9.0, 10.0, 50.0, 12.0, 13.0, 14.0, 15.0, 16.0] },
    { id: 4, label: 'Lion', embedding: [1.0, 2.0, 3.0, 4.0, 5.0, 6.0, 7.0, 8.0, 9.0, 10.0, 11.0, 12.0, 13.0, 14.0, 15.0, 16.0] },
    { id: 5, label: 'Tiger', embedding: [1.0, 2.0, 3.0, 4.0, 5.0, 6.0, 7.0, 8.0, 9.0, 10.0, 11.0, 12.0, 13.0, 94.0, 15.0, 16.0] },
    { id: 6, label: 'Elephant', embedding: [1.0, 2.0, 3.0, 4.0, 5.0, 6.0, 7.0, 8.0, 9.0, 10.0, 11.0, 62.0, 13.0, 14.0, 15.0, 16.0] },
    { id: 7, label: 'Giraffe', embedding: [1.0, 2.0, 3.0, 4.0, 5.0, 6.0, 7.0, 58.0, 9.0, 10.0, 11.0, 12.0, 13.0, 14.0, 15.0, 16.0] },
    { id: 8, label: 'Kangaroo', embedding: [1.0, 2.0, 3.0, 4.0, 5.0, 6.0, 77.0, 8.0, 9.0, 10.0, 11.0, 12.0, 13.0, 14.0, 15.0, 16.0] },
    { id: 9, label: 'Penguin', embedding: [1.0, 2.0, 3.0, 4.0, 5.0, 86.0, 7.0, 8.0, 9.0, 10.0, 11.0, 12.0, 13.0, 14.0, 15.0, 16.0] },
    { id: 10, label: 'Zebra', embedding: [1.0, 2.0, 3.0, 4.0, 95.0, 6.0, 7.0, 8.0, 9.0, 10.0, 11.0, 12.0, 13.0, 14.0, 15.0, 16.0] },

    // Group 2: Fruits
    { id: 11, label: 'Apple', embedding: [20.0, 21.0, 82.0, 23.0, 24.0, 25.0, 26.0, 27.0, 28.0, 29.0, 30.0, 31.0, 32.0, 33.0, 34.0, 35.0] },
    { id: 12, label: 'Banana', embedding: [20.0, 21.0, 22.0, 83.0, 24.0, 25.0, 26.0, 27.0, 28.0, 29.0, 30.0, 31.0, 32.0, 33.0, 34.0, 35.0] },
    { id: 13, label: 'Cherry', embedding: [20.0, 21.0, 22.0, 23.0, 94.0, 25.0, 26.0, 27.0, 28.0, 29.0, 30.0, 31.0, 32.0, 33.0, 34.0, 35.0] },
    { id: 14, label: 'Date', embedding: [20.0, 21.0, 22.0, 23.0, 24.0, 75.0, 26.0, 27.0, 28.0, 29.0, 30.0, 31.0, 32.0, 33.0, 34.0, 35.0] },
    { id: 15, label: 'Elderberry', embedding: [20.0, 21.0, 22.0, 23.0, 24.0, 85.0, 26.0, 27.0, 28.0, 29.0, 30.0, 31.0, 32.0, 33.0, 34.0, 35.0] },
    { id: 16, label: 'Fig', embedding: [20.0, 21.0, 22.0, 23.0, 24.0, 25.0, 26.0, 87.0, 28.0, 29.0, 30.0, 31.0, 32.0, 33.0, 34.0, 35.0] },
    { id: 17, label: 'Grape', embedding: [20.0, 21.0, 22.0, 23.0, 24.0, 25.0, 26.0, 27.0, 98.0, 29.0, 30.0, 31.0, 32.0, 33.0, 34.0, 35.0] },
    { id: 18, label: 'Honeydew', embedding: [20.0, 21.0, 22.0, 23.0, 24.0, 25.0, 26.0, 27.0, 78.0, 29.0, 30.0, 31.0, 32.0, 33.0, 34.0, 35.0] },
    { id: 19, label: 'Kiwi', embedding: [20.0, 21.0, 22.0, 23.0, 24.0, 25.0, 26.0, 27.0, 28.0, 29.0, 90.0, 31.0, 32.0, 33.0, 34.0, 35.0] },
    { id: 20, label: 'Lemon', embedding: [20.0, 21.0, 22.0, 23.0, 24.0, 25.0, 26.0, 27.0, 28.0, 29.0, 30.0, 91.0, 32.0, 33.0, 34.0, 35.0] },

 // Group 3: Vehicles
    { id: 21, label: 'Car', embedding: [40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55] },
    { id: 22, label: 'Bike', embedding: [40, 42, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55] },
    { id: 23, label: 'Bus', embedding: [40, 41, 43, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55] },
    // ... add more vehicle data points

    // Group 4: Ten colors points with slightly different embeddings
    { id: 31, label: 'Red', embedding: [650, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 75] },
    { id: 32, label: 'Blue', embedding: [60, 52, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 75] },
    { id: 33, label: 'Green', embedding: [60, 61, 53, 63, 64, 65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 75] },
    { id: 34, label: 'Yellow', embedding: [60, 61, 62, 54, 64, 65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 75] },
    { id: 35, label: 'Orange', embedding: [60, 61, 62, 63, 55, 65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 75] },
    { id: 36, label: 'Purple', embedding: [60, 61, 62, 63, 64, 56, 66, 67, 68, 69, 70, 71, 72, 73, 74, 75] },
    { id: 37, label: 'Pink', embedding: [60, 61, 62, 63, 64, 65, 67, 57, 68, 69, 70, 71, 72, 73, 74, 75] },
    { id: 38, label: 'Brown', embedding: [60, 61, 62, 63, 64, 65, 66, 68, 58, 69, 70, 71, 72, 73, 74, 75] },
    { id: 39, label: 'Black', embedding: [60, 61, 62, 63, 64, 65, 66, 67, 69, 55, 70, 71, 72, 73, 74, 75] },
    { id: 40, label: 'White', embedding: [60, 61, 62, 63, 64, 65, 66, 67, 68, 70, 50, 71, 72, 73, 74, 75] },



    // Group 5: Instruments
    { id: 41, label: 'Guitar', embedding: [80, 81, 82, 83, 84, 85, 86, 87, 88, 89, 90, 91, 92, 93, 94, 95] },
    { id: 42, label: 'Piano', embedding: [80, 82, 72, 83, 84, 85, 86, 87, 88, 89, 95, 91, 92, 93, 94, 95] },
    { id: 43, label: 'Drum', embedding: [80, 81, 83, 83, 84, 85, 63, 87, 88, 45, 90, 91, 92, 93, 94, 95] },
    { id: 44, label: 'Violin', embedding: [80, 18, 82, 84, 84, 85, 86, 87, 88, 89, 90, 91, 92, 34, 94, 95] },
    { id: 45, label: 'Flute', embedding: [80, 81, 82, 83, 85, 85, 54, 87, 88, 89, 32, 91, 92, 93, 94, 16] },
    { id: 46, label: 'Trumpet', embedding: [80, 81, 9, 83, 13, 86, 86, 87, 88, 89, 90, 54, 92, 93, 94, 95] },
    { id: 47, label: 'Saxophone', embedding: [80, 81, 82, 21, 84, 85, 87, 65, 88, 87, 90, 91, 92, 93, 24, 95] },
    { id: 48, label: 'Cello', embedding: [80, 81, 17, 83, 84, 85, 86, 88, 23, 89, 90, 91, 92, 93, 94, 95] },
    { id: 49, label: 'Clarinet', embedding: [80, 81, 82, 83, 12, 85, 86, 87, 89, 89, 90, 91, 92, 93, 11, 95] },
    { id: 50, label: 'Trombone', embedding: [80, 81, 82, 53, 84, 85, 86, 87, 24, 90, 90, 91, 21, 93, 94, 95] }

];


document.getElementById('visualization').addEventListener('click', onClick, false);

const width = (window.innerWidth * 0.65) - 20; // 45% of the viewport width minus some padding
const height = window.innerHeight - 40; // viewport height minus some padding

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
const renderer = new THREE.WebGLRenderer();
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let lastSelectedEmbedding = null; // Store the embedding of the last selected sphere


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
        // Check if the intersected object is a sphere
        if (intersectedObject.geometry.type === "SphereGeometry") {
            const id = intersectedObject.userData.id;
            selectItem(id);
        }
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

function visualize3D(data) {
    renderer.setSize(width, height);
    document.body.appendChild(renderer.domElement);

    // Add the AxesHelper
    const axesHelper = new THREE.AxesHelper(100);
    axesHelper.material.color.set(0xCCCCCC); // Set to light gray if desired
    scene.add(axesHelper);

    // Clear existing spheres from the scene
    const objectsToRemove = [];
    scene.traverse(child => {
        if (child instanceof THREE.Mesh && child !== axesHelper) {
            objectsToRemove.push(child);
        }
    });
    objectsToRemove.forEach(obj => scene.remove(obj));

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

document.getElementById('uploadButton').addEventListener('click', handleFileUpload);

function handleFileUpload() {
    const fileInput = document.getElementById('csvFileInput');
    const file = fileInput.files[0];

    if (file) {
        const reader = new FileReader();
        reader.onload = function(event) {
            const csvData = event.target.result;
            processData(csvData);
        };
        reader.readAsText(file);
    } else {
        alert('Please select a CSV file first.');
    }
}

function processData(csvData) {
    const rows = csvData.split('\n');
    const newData = [];

    for (let i = 1; i < rows.length; i++) { // Start from 1 to skip the header
        const columns = rows[i].split(',');
        if (columns.length < 3) continue; // Skip rows with insufficient data

        const id = columns[0];
        const label = columns[1];
        const embedding = columns.slice(2).map(Number); // Convert to numbers

        newData.push({ id, label, embedding });
    }

    if (newData.length === 0) {
        alert('Error reading the file or no valid data found.');
        return;
    }

    // Replace the previous dataset with the new one
    data = newData;

    // Inform the user
    alert(`Successfully ingested ${newData.length} points.`);

    // Re-render the visualization (assuming you have a function for this)
    renderVisualization();
}

const radios = document.querySelectorAll('input[name="reductionMethod"]');
radios.forEach(radio => {
    radio.addEventListener('change', handleDimensionReductionChange);
});
function showSpinner(method) {
    document.getElementById('spinner').style.display = 'block';
    document.getElementById('spinner-text').innerText = `Applying ${method}...`;
}

function hideSpinner() {
    document.getElementById('spinner').style.display = 'none';
}

async function handleDimensionReductionChange() {
    const selectedMethod = document.querySelector('input[name="reductionMethod"]:checked').value;
    showSpinner(selectedMethod);
    const reducedData = await reduceDimensions(selectedMethod, data);
    visualize3D(reducedData);
    hideSpinner();
}

async function reduceDimensions(method, data) {
    let reducedData;
    console.log("Dimension Reduction Method: " + method);
    switch (method) {
        case 'PCA':
            reducedData = pca(data);
            break;
        case 'UMAP':
            reducedData = await doUMAP(data);
            break;
        case 'T-SNE':
            reducedData = doTSNE(data);
            break;
    }
    return reducedData;
}

function normalizeVector(vector) {
    let norm = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
    return vector.map(val => val / norm);
}

function doTSNE(dataWithEmbeddings) {
    let reducedData;
    console.log("Starting T-SNE...");
    try {
       const opt = {
            epsilon: 100, // epsilon is learning rate (10 = default)
            perplexity: 5, // roughly how many neighbors each point influences (30 = default)
            dim: 3 // dimensionality of the output (2 = default)
        }
       const tsne = new tsnejs.tSNE(opt); // create a tSNE instance
       const embeddings = dataWithEmbeddings.map(d => d.embedding);
       tsne.initDataRaw(embeddings);

        for (var epoch = 0; epoch < 500; epoch++) {
            console.log("T-SNE Epoch number: " + epoch);
            tsne.step(); // every time you call this, solution gets better

        }
        const all_coordinates = tsne.getSolution(); // Y is an array of 2-D points that you can plot
        // Convert embeddings to your data format and update visualization
        reducedData = all_coordinates.map((coordinates, index) => ({
            id: data[index].id,
            coordinates: coordinates
        }));

    } catch (error) {
        console.error("Error processing data with T-SNE:", error);
        alert("An error occurred while processing data with T-SNE. Please try again.");
    }
    console.log("Ending T-SNE...");
    return reducedData;
}



async function doUMAP(dataWithEmbeddings) {
    let reducedData;
    console.log("Starting UMAP...");
    try {
        const umapOptions = {
            nNeighbors: 15,
            minDist: .2,
            spread: 1,
            nComponents: 3
        };
        const umap = new UMAP(umapOptions);
               // Use fitAsync for asynchronous processing
        const all_coordinates = await umap.fitAsync(data.map(d => d.embedding), epoch => {
            console.log("UMAP Epoch number: " + epoch);
        });

        // Convert embeddings to your data format and update visualization
        reducedData = all_coordinates.map((coordinates, index) => ({
            id: data[index].id,
            coordinates: coordinates
        }));
    } catch (error) {
        console.error("Error processing data with UMAP:", error);
        alert("An error occurred while processing data with UMAP. Please try again.");
    }
    console.log("Ending UMAP...");
    return reducedData;
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
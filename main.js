import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import TextTexture from '@seregpie/three.text-texture';

// Sample data
    const data = [
        { id: 1, label: 'A', embedding: [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16] },
        { id: 2, label: 'B', embedding: [16,15,14,13,12,11,10,9,8,7,6,5,4,3,2,1] },
        // ... add more data points as needed
    ];

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer();
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

window.addEventListener('click', onClick, false);

function onClick(event) {
    // Convert mouse position to normalized device coordinates (-1 to +1)
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = - (event.clientY / window.innerHeight) * 2 + 1;

    // Update the picking ray with the camera and mouse position
    raycaster.setFromCamera(mouse, camera);

    // Calculate objects intersecting the picking ray
    const intersects = raycaster.intersectObjects(scene.children);

    if (intersects.length > 0) {
        // The first intersected object is the one you're looking for
        const intersectedObject = intersects[0].object;

        // Highlight the dot
        intersectedObject.material.color.set(0x00ff00); // Green color

        // Display the label
        const label = data.find(d => d.id === intersectedObject.userData.id).label;
        displayLabel(intersectedObject.position, `Label: ${label}`);
    }
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
        renderer.setSize(window.innerWidth, window.innerHeight);
        document.body.appendChild(renderer.domElement);

        data.forEach(point => {
            const geometry = new THREE.SphereGeometry(0.1, 32, 32);
            const material = new THREE.MeshBasicMaterial({ color: 0xff0000 });
            const sphere = new THREE.Mesh(geometry, material);
            sphere.position.set(point.coordinates[0], point.coordinates[1], point.coordinates[2]);
            sphere.userData = { id: point.id };  // Store the ID with the sphere
            scene.add(sphere);
        });

        camera.position.z = 5;

        const controls = new OrbitControls(camera, renderer.domElement);
        controls.update();
        renderer.setSize(400, 400);
        document.getElementById('visualization').appendChild(renderer.domElement);
        function animate() {
            requestAnimationFrame(animate);
            controls.update();
            renderer.render(scene, camera);
        }

        animate();
    }

    function displayLabel(position, text) {
        const spriteMaterial = new THREE.SpriteMaterial({
            map: new THREE.TextTexture({
                text: text,
                fontFamily: '"Times New Roman", Times, serif',
                fontSize: 12,
                fillStyle: '#ffffff'
            })
        });
        const sprite = new THREE.Sprite(spriteMaterial);
        sprite.position.copy(position);
        sprite.position.y += 0.2; // Adjust this value to position the label above the dot
        scene.add(sprite);
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
        idCell.textContent = d.id;
        labelCell.textContent = d.label;
    });
});

    const reducedData = pca(data);  // Note that we're passing the entire 'data' array, not just the embeddings
    visualize3D(reducedData);

